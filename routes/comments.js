const express = require('express');
const { addComment, getComments, updateApproved, deletecomments } = require('../controllers/commentController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', addComment);
router.get('/', getComments);
router.delete('/:created_at',  deletecomments);
router.put('/',  updateApproved);

module.exports = router;
