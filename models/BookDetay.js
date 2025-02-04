const mongoose = require('mongoose');

const BookDetaySchema = new mongoose.Schema({
  bookId: { type: String, required: true },
  Yorumdetay: [{ 
    Bolum: Number, 
    Satir: Number, 
    comments: [{ 
      user: String, 
      comment: String, 
      approved: Boolean, 
      created_at: Number 
    }] 
  }],
});

module.exports = mongoose.model('BookDetay', BookDetaySchema);
