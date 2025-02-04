const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  console.log(username, password)

  if (!user) return res.status(400).json({ message: 'Kullanıcı bulunamadı!' });

  if (password !== user.password) return res.status(400).json({ message: 'Yanlış şifre!' });
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
};
