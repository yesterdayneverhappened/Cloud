const express = require('express');
const { register, login, getUsersActivity } = require('../controllers/userController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/activity', getUsersActivity);
module.exports = router;
