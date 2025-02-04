const express = require('express');
const { getAnnouncements, addAnnouncement, getApproved, deleteAnnouncement,updateApproved } = require('../controllers/announcementController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getAnnouncements);
router.post('/',  addAnnouncement);
router.delete('/:id', deleteAnnouncement);
router.put('/:id',  updateApproved);
router.get('/:id', getApproved);

module.exports = router;
