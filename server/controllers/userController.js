const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { registerUser, getUserByEmail, getActivityData, getProjectReport } = require('../models/userModels');

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
  
  const getUsersActivity = async (req, res) => {
    const { range } = req.query;

    try {
        const activityData = await getActivityData(range);
        res.json(activityData);
    } catch (error) {
        console.error('Ошибка при получении данных об активности пользователей:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении данных' });
    }
};
const exportLogFile = async (req, res) => {
  try {
    const reportData = await getProjectReport();

    // Отправляем данные в формате JSON
    res.json(reportData);
  } catch (error) {
    console.error('Ошибка при получении данных для отчета:', error);
    res.status(500).json({ error: 'Ошибка при получении данных для отчета' });
  }
};
module.exports = { register, login, getUsersActivity, exportLogFile };
