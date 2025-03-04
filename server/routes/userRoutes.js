const express = require('express');
const { getUsers } = require('../controllers/userController');

const router = express.Router();

router.get('/login-user', getUsers);