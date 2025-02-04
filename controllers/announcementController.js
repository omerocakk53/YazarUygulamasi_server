const { default: mongoose } = require('mongoose');
const Announcement = require('../models/Announcement');

exports.getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find();
    res.json(announcements);
  } catch (err) {
    res.status(400).send('Duyurular bulunamadı: ' + err.message);
  }
};

exports.addAnnouncement = async (req, res) => {
  const { title, description } = req.body;
  const announcement = new Announcement({ title, description });
  try {
    await announcement.save();
    res.status(201).send('Duyuru başarıyla eklendi!');
  } catch (err) {
    res.status(400).send('Duyuru eklenemedi: ' + err.message);
  }
};

exports.deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  try {
    await Announcement.findByIdAndDelete(id);
    res.status(200).send('Duyuru başarıyla silindi!');
  } catch (err) {
    res.status(400).send('Duyuru silinemedi: ' + err.message);
  }
};

//duyuru açma kapama
const Announcementapproved = mongoose.model(
  'Announcementapproved',
  new mongoose.Schema({
    approved: { type: Boolean, required: true },
  })
);
//Duyuru açık mı kapalı mı değişkeni değeri değiştirme
exports.updateApproved = async (req, res) => {
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
};


//Duyuru açık mı kapalı mı değişkeni değeri getirme
exports.getApproved = async (req, res) => {
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
};