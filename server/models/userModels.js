const bcrypt = require('bcrypt');
const crypto = require('crypto');
const con = require('../config/db');

const registerUser = async (name, email, password) => {
  try {
    if (!name || !email || !password) throw new Error("Заполните все поля");

    // Генерация случайного API-ключа из 8 символов
    const apiKey = crypto.randomBytes(4).toString('hex');  // 4 байта = 8 символов в hex

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO clients (name, domain, password, api_key) VALUES (?, ?, ?, ?)";
    await con.execute(sql, [name, email, hashedPassword, apiKey]);

    return { message: "Пользователь успешно зарегистрирован" };
  } catch (err) {
    console.error("Ошибка при регистрации пользователя:", err);
    throw new Error("Ошибка при регистрации");
  }
};

const getUserByEmail = async (email) => {
  try {
    if (!email) throw new Error("Email обязателен");

    const sql = "SELECT * FROM clients WHERE domain = ?";
    const [rows] = await con.execute(sql, [email]);

    return rows.length ? rows[0] : null;
  } catch (err) {
    console.error("Ошибка при поиске пользователя:", err);
    throw new Error("Ошибка при получении данных пользователя");
  }
};

module.exports = { registerUser, getUserByEmail };
