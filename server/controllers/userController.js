const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { registerUser, getUserByEmail } = require('../models/userModels');

const register = async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Все поля обязательны' });
      }
  
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Пользователь уже существует' });
      }
  
      await registerUser(name, email, password);
      res.status(201).json({ message: 'Регистрация успешна' });
    } catch (err) {
      console.error("Ошибка регистрации:", err);
      res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
  };
  
  const login = async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Все поля обязательны' });
      }
  
      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Неверный email или пароль' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Неверный email или пароль' });
      }
  
      const token = jwt.sign({ id: user.id, email: user.domain }, 'your_secret_key', { expiresIn: '5h' });
      res.json({ message: 'Вход выполнен', token });
    } catch (err) {
      console.error("Ошибка авторизации:", err);
      res.status(500).json({ error: 'Ошибка сервера', details: err.message });
    }
  };
  

module.exports = { register, login };
