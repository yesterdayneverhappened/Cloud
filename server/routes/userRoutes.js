const express = require('express');
const { register, login, getUsersActivity, exportLogFile, getUser } = require('../controllers/userController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/activity', getUsersActivity);
router.get('/log', exportLogFile);
router.get('/:id', getUser)
module.exports = router;
