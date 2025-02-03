const express = require('express');
const cors = require('cors'); // CORS paketini import et
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./db');

dotenv.config();

const app = express();

// CORS'u aktif et
app.use(cors({
  origin: 'http://localhost:3000', // Frontend'inizin çalıştığı port
  methods: 'GET,POST,PUT,DELETE', // İzin verilen HTTP metodları
  allowedHeaders: 'Content-Type, Authorization', // İzin verilen başlıklar
}));

app.use(express.json()); // JSON formatında veri alabilmek için

// MongoDB bağlantısını başlat
connectDB();

// Kullanıcı ve Kitap modelini oluştur
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}));

const Announcement = mongoose.model('Announcement', new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  created_at: { type: Date, default: Date.now },
}));

const authenticate = async (req, res, next) => {
  const token = req.header('Authorization'); // Token'ı al
  console.log(token); // Debugging: Token'ı logla
  if (!token) return res.status(401).send('Token bulunamadı!');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded User:', decoded); // Debugging: Decoded token'ı logla
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token doğrulama hatası:', err); // Debugging: Hata detayını logla
    res.status(401).send('Token geçersiz!');
  }
};

// Kullanıcı girişi (JWT oluşturma)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) return res.status(400).send('Kullanıcı bulunamadı!');

  const isMatch = await password == user.password;
  if (!isMatch) return res.status(400).send('Yanlış şifre!');

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  res.json({ token });
});

// YORUM YAPMA
app.post('/comments', async (req, res) => {
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
});

//yorumları getir
app.get('/comments', async (req, res) => {
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
});

// YORUM approved GÜNCELLE
app.put('/comments/updateApproved', authenticate, async (req, res) => {
  const { bookId, createdAt, approved } = req.body;

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
});


// YORUM SİLME created_at
app.delete('/deletecomments/:created_at', authenticate, async (req, res) => {
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
});


// YORUM GÜNCELLEME
app.put('/updatecomments/:created_at', authenticate, async (req, res) => {
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
});

//Kitap Silme
app.delete('/deletebook/:id', authenticate, async (req, res) => {
  const { id } = req.params; // Kitap _id'sini al

  try {
    // BookDetay modelini sil
    delete mongoose.models.BookDetay;

    // Kitap detayları koleksiyonunu oluşturun
    const bookDetayCollection = mongoose.model('BookDetay', new mongoose.Schema({
      bookId: { type: String, required: true },
      Yorumdetay: [{ type: Object }],
    }));

    // Belirtilen _id değerine göre kitabı sil
    const result = await bookDetayCollection.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).send('Kitap bulunamadı.');
    }

    res.status(200).send('Kitap ve tüm verileri başarıyla silindi!');
  } catch (err) {
    res.status(500).send('Silme sırasında hata: ' + err.message);
  }
});


// TÜM YORUMLARI SİLME
app.delete('/comments', authenticate, async (req, res) => {
  const { bookId } = req.body; // Belirli bir kitap için tüm yorumları silmek istiyorsanız.

  try {
    // BookDetay modelini sil
    delete mongoose.models.BookDetay;

    // Kitap detayları koleksiyonunu oluşturun
    const bookDetayCollection = mongoose.model('BookDetay', new mongoose.Schema({
      bookId: { type: String, required: true },
      Yorumdetay: [{ type: Object }]
    }));

    // Kitap detaylarını bulun
    const bookDetay = await bookDetayCollection.findOne({ bookId });

    if (!bookDetay) {
      return res.status(404).send('Kitap bulunamadı.');
    }

    // Yorumdetay içeriğini temizle
    bookDetay.Yorumdetay.forEach(chapter => {
      chapter.comments = [];
    });

    // Değişiklikleri kaydet
    await bookDetay.save();

    res.status(200).send('Tüm yorumlar başarıyla silindi!');
  } catch (err) {
    res.status(500).send('Yorumlar silinemedi: ' + err.message);
  }
});

//Duyuru oluşturma
app.post('/admin/announcements', authenticate, async (req, res) => {
  const { title, description } = req.body;
  const announcement = new Announcement({ title, description });
  try {
    await announcement.save();
    res.status(201).send('Duyuru başarıyla eklendi!');
  } catch (err) {
    res.status(400).send('Duyuru eklenemedi: ' + err.message);
  }
});
//Duyuru silme
app.delete('/admin/announcements/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await Announcement.findByIdAndDelete(id);
    res.status(200).send('Duyuru başarıyla silindi!');
  } catch (err) {
    res.status(400).send('Duyuru silinemedi: ' + err.message);
  }
});
//Duyuru getirme
app.get('/admin/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find();
    res.json(announcements);
  } catch (err) {
    res.status(400).send('Duyurular bulunamadı: ' + err.message);
  }
});

//duyuru açma kapama
const Announcementapproved = mongoose.model(
  'Announcementapproved',
  new mongoose.Schema({
    approved: { type: Boolean, required: true },
  })
);

// //Duyuru açık mı kapalı mı değişkeni değeri değiştirme
app.put('/update-approved/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;

  if (typeof approved !== 'boolean') {
    return res.status(400).send({ message: 'Invalid approved value. It must be a boolean.' });
  }

  try {
    const updated = await Announcementapproved.findByIdAndUpdate(
      id,
      { approved },
      { new: true }
    );

    if (!updated) {
      return res.status(404).send({ message: 'Document not found.' });
    }

    res.status(200).send(updated);
  } catch (error) {
    res.status(500).send({ message: 'Error updating the document.', error });
  }
});
//Duyuru açık mı kapalı mı değişkeni değeri getirme
app.get('/get-approved/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const document = await Announcementapproved.findById(id);

    if (!document) {
      return res.status(404).send({ message: 'Document not found.' });
    }

    res.status(200).send({ approved: document.approved });
  } catch (error) {
    res.status(500).send({ message: 'Error retrieving the document.', error });
  }
});


// Sunucuyu başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});
