const { default: mongoose } = require('mongoose');
const BookDetay = require('../models/BookDetay');

exports.addComment = async (req, res) => {
  const { bookId, chapter, line, comment, user } = req.body;

  try {
    // BookDetay modelini sil
    delete mongoose.models.BookDetay;

    // Kitap detayları koleksiyonunu oluşturun
    const bookDetayCollection = mongoose.model('BookDetay', new mongoose.Schema({
      bookId: { type: String, required: true },
      Yorumdetay: [{ type: Object }]
    }));

    // Kitap detayları koleksiyonunu kullanın
    let bookDetay = await bookDetayCollection.findOne({ bookId });

    if (!bookDetay) {
      bookDetay = new bookDetayCollection({ bookId, Yorumdetay: [] });
    }

    // Yorumdetay arrayine yeni yorum ekle
    const existingChapter = bookDetay.Yorumdetay.find((chapter) => chapter.Bolum === chapter);
    if (existingChapter) {
      existingChapter.comments.push({
        user: user,
        comment: comment,
        approved: false,
        created_at: Date.now(),
      });
    } else {
      bookDetay.Yorumdetay.push({
        Bolum: chapter,
        Satir: line,
        comments: [
          {
            user: user,
            comment: comment,
            approved: false,
            created_at: Date.now(),
          },
        ],
      });
    }

    // Kitap detayları koleksiyonunu güncelle
    await bookDetay.save();

    res.status(201).send('Yorum başarıyla eklendi!');
  } catch (err) {
    res.status(400).send('Yorum eklenemedi: ' + err.message);
  }
};

exports.getComments = async (req, res) => {
  try {
    // Eğer model zaten tanımlıysa tekrar tanımlamadan kullan
    const bookDetayCollection = mongoose.models.BookDetay || mongoose.model('BookDetay', new mongoose.Schema({
      bookId: { type: String, required: true },
      Yorumdetay: [{ type: Object }],
    }));

    const comments = await bookDetayCollection.find();
    res.json(comments);
  } catch (err) {
    res.status(400).send('Yorumlar bulunamadı: ' + err.message);
  }
};

// app.put('/comments/updateApproved', authenticate, async (req, res) => {
exports.updateApproved = async (req, res) => {
  const { bookId, createdAt, approved } = req.body;
   console.log(req.body);
  try {
    // BookDetay modelini sil
    delete mongoose.models.BookDetay;
    // Kitap detayları koleksiyonunu oluşturun veya mevcut olanı kullanın
    const bookDetayCollection = mongoose.model('BookDetay', new mongoose.Schema({
      bookId: { type: String, required: true },
      Yorumdetay: [{
        Bolum: Number,
        Satir: Number,
        comments: [
          {
            user: String,
            comment: String,
            approved: Boolean,
            created_at: Number,
          }
        ]
      }]
    }));

    // Verilen bookId'ye göre kitap bulun
    const bookDetay = await bookDetayCollection.findOne({ bookId });

    if (!bookDetay) {
      return res.status(404).send('Kitap bulunamadı!');
    }

    // Yorumdetay içindeki ilgili yorumun approved değerini güncelle
    let commentFound = false;
    bookDetay.Yorumdetay.forEach((chapter) => {
      chapter.comments.forEach((comment) => {
        if (comment.created_at === createdAt) {
          comment.approved = approved; // Güncelleme işlemi
          commentFound = true;
        }
      });
    });

    if (!commentFound) {
      return res.status(404).send('Yorum bulunamadı!');
    }

    // Değişiklikleri kaydet
    await bookDetay.save();

    res.status(200).send('Yorum başarıyla güncellendi!');
  } catch (err) {
    res.status(400).send('Yorum güncellenemedi: ' + err.message);
  }
};



// YORUM SİLME created_at
// app.delete('/deletecomments/:created_at', authenticate, async (req, res) => {

exports.deletecomments = async (req, res) => {
  const { created_at } = req.params;
  try {
    // Mongoose modelini tanımla
    delete mongoose.models.BookDetay;

    const bookDetayCollection = mongoose.model('BookDetay', new mongoose.Schema({
      bookId: { type: String, required: true },
      Yorumdetay: [
        {
          Bolum: Number,
          Satir: Number,
          comments: [
            {
              user: String,
              comment: String,
              approved: Boolean,
              created_at: Number,
            },
          ],
        },
      ],
    }));

    // `created_at` ile yorumu bul ve sil
    const updatedBook = await bookDetayCollection.findOneAndUpdate(
      { "Yorumdetay.comments.created_at": parseInt(created_at) },
      {
        $pull: { "Yorumdetay.$[].comments": { created_at: parseInt(created_at) } },
      },
      { new: true }
    );

    // Eğer yorum bulunamazsa
    if (!updatedBook) {
      return res.status(404).send('Yorum bulunamadı.');
    }

    // Boş kalan `Yorumdetay` öğelerini temizle
    const cleanedBook = await bookDetayCollection.findOneAndUpdate(
      { bookId: updatedBook.bookId },
      {
        $pull: {
          Yorumdetay: { comments: { $size: 0 } }, // comments dizisi boş olanları sil
        },
      },
      { new: true }
    );

    res.status(200).send(cleanedBook || 'Yorum başarıyla silindi ve yapı temizlendi!');
  } catch (err) {
    res.status(500).send('Silme sırasında hata: ' + err.message);
  }
};



// YORUM GÜNCELLEME
// app.put('/updatecomments/:created_at', authenticate, async (req, res) => {
exports.updatecomments = async (req, res) => {
  const { created_at } = req.params;
  const { newComment, newApproved } = req.body;

  try {
    delete mongoose.models.BookDetay;

    const bookDetayCollection = mongoose.model('BookDetay', new mongoose.Schema({
      bookId: { type: String, required: true },
      Yorumdetay: [{ type: Object }],
    }));

    // Belirtilen created_at değerine göre yorum bul ve güncelle
    const bookDetay = await bookDetayCollection.findOneAndUpdate(
      { "Yorumdetay.comments.created_at": parseInt(created_at) },
      {
        $set: {
          "Yorumdetay.$[].comments.$[comment].comment": newComment,
          "Yorumdetay.$[].comments.$[comment].approved": newApproved,
        },
      },
      {
        arrayFilters: [{ "comment.created_at": parseInt(created_at) }],
        new: true,
      }
    );

    if (!bookDetay) {
      return res.status(404).send('Yorum bulunamadı.');
    }

    res.status(200).send('Yorum başarıyla güncellendi!');
  } catch (err) {
    res.status(500).send('Güncelleme sırasında hata: ' + err.message);
  }
};
