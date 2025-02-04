const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Veritabanı bağlantısı
connectDB();

// Route tanımlamaları
app.use('/api/login', require('./routes/auth'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/books', require('./routes/books'));
app.use('/api/announcements', require('./routes/announcements'));

// Sunucuyu başlat
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server ${PORT} portunda çalışıyor`));
