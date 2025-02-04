const mongoose = require('mongoose');
const dotenv = require('dotenv');

// dotenv yapılandırması
dotenv.config();

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB bağlantısı başarılı!');
  } catch (err) {
    console.error('MongoDB bağlantısı başarısız:', err.message);
    process.exit(1);  // Uygulamayı sonlandır
  }
};

module.exports = connectDB;
