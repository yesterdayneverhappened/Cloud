const express = require('express');
const { register, login, getUsersActivity, exportLogFile, getUser, getAllUsers } = require('../controllers/userController');
const { deleteUser, updateApiKey } = require('../models/userModels')
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/activity', getUsersActivity);
router.get('/log', exportLogFile);
router.get('/:id', getUser)
router.get('/', getAllUsers)
router.delete('/:id', deleteUser);
router.put('/:id/api-key', updateApiKey);
module.exports = router;
