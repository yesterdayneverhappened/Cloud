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

const getActivityData = async (range) => {
  let dateCondition = '';
  switch (range) {
      case '7d':
          dateCondition = 'WHERE register_date >= NOW() - INTERVAL 7 DAY';
          break;
      case '30d':
          dateCondition = 'WHERE register_date >= NOW() - INTERVAL 30 DAY';
          break;
      case '365d':
          dateCondition = 'WHERE register_date >= NOW() - INTERVAL 365 DAY';
          break;
      default:
          throw new Error('Некорректный временной диапазон');
  }

  const sql = `
      SELECT DATE(register_date) AS date, COUNT(*) AS count
      FROM clients
      ${dateCondition}
      GROUP BY DATE(register_date)
      ORDER BY DATE(register_date) ASC;
  `;

  const [rows] = await con.execute(sql);
  return rows;
};

const getProjectReport = async () => {
  const query = `
    SELECT 
        c.name AS client_name,
        c.domain AS client_email, 
        p.name AS project_name,
        SUM(f.file_size) AS total_size
    FROM 
        clients c
    JOIN 
        projects p ON c.id = p.client_id
    JOIN 
        files f ON p.id = f.project_id
    GROUP BY 
        c.id, p.id;
  `;
  
  try {
    const [rows] = await con.execute(query);
    return rows;
  } catch (error) {
    console.error('Ошибка при получении отчета:', error);
    throw error;
  }
};

const getClientById = (clientId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM clients WHERE id = ?';

    con.execute(query, [clientId], (err, results) => {
      if (err) {
        return reject('Ошибка запроса: ' + err.message); // Добавил `.message` для читаемости
      }

      if (results.length === 0) {
        return reject('Клиент не найден');
      }

      resolve(results[0]);
    });
  });
};

const getAllClient = async (req, res) => {
  try {
    const users = await con.query('SELECT * FROM clients');
    return users;
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).send('Internal Server Error');
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Удаляем файлы пользователя
    await con.execute(`
      DELETE files 
      FROM files
      JOIN projects ON projects.id = files.project_id
      WHERE projects.client_id = ?
    `, [userId]);
    
    // Удаляем проекты пользователя
    await con.execute('DELETE FROM projects WHERE client_id = ?', [userId]);
    
    // Удаляем самого пользователя
    await con.execute('DELETE FROM clients WHERE id = ?', [userId]);
    
    res.send('User and all related data deleted');
  } catch (error) {
    res.status(500).send(error.message);
  }
};
function generateApiKey() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return result;
};
const updateApiKey = async (req, res) => {
  try {
    const userId = req.params.id;
    const newApiKey = generateApiKey();
    
    await con.execute(
      'UPDATE clients SET api_key = ? WHERE id = ?',
      [newApiKey, userId]
    );
    
    res.send(`New API Key: ${newApiKey}`);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

module.exports = { registerUser, getUserByEmail, getActivityData, getProjectReport, getClientById, getAllClient, deleteUser, updateApiKey };
