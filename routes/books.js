const express = require('express');
const { getBooks, deletebook } = require('../controllers/bookController');
const authenticate = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getBooks);
router.delete('/:id', deletebook);

module.exports = router;
