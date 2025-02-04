const BookDetay = require('../models/BookDetay');

exports.getBooks = async (req, res) => {
  try {
    const books = await BookDetay.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: 'Kitaplar getirilirken hata oluştu.' });
  }
};

 
//Kitap Silme
exports.deletebook = async (req, res) => {
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
};