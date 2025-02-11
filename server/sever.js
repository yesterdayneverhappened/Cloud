const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');  // Используем mysql2 с промисами

const app = express();
const PORT = 5000;

// Создание папки для загрузок, если её нет
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Разрешить доступ только с вашего фронтенда
  methods: 'GET, POST, DELETE',
}));
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Папка для загрузок
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Используем оригинальное имя файла
  },
});

const upload = multer({ storage });
const con = mysql.createPool({
  host: "localhost",
  user: "panic",
  password: "mysql",
  database: "mydb"
});

// Функция для обновления проекта
const updateProject = async (project_id, filename, filepath) => {
  // Получаем текущую дату и время
  const now = new Date();
  
  // Форматируем дату в нужный формат: YYYY-MM-DD HH:MM:SS
  const created_at = now.toISOString().slice(0, 19).replace('T', ' ');

  const sql = `INSERT INTO files (project_id, filename, filepath, created_at) 
               VALUES (?, ?, ?, ?)`;

  console.log(sql, [project_id, filename, filepath, created_at]);

  try {
    const [rows] = await con.execute(sql, [project_id, filename, filepath, created_at]);
    console.log('Файл добавлен:', rows);
  } catch (err) {
    console.error('Ошибка при добавлении файла:', err);
  }
};

// Эндпоинт для загрузки файлов
app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const projectId = req.body.projectId;
  const timestamp = new Date().toISOString();

  if (!file) {
    return res.status(400).send('Файл не найден');
  }

  res.json({
    filename: file.originalname,
    filepath: path.join(__dirname, 'uploads', file.filename),
    uploadedAt: timestamp,
  });

  await updateProject(projectId, file.originalname, file.filename, timestamp);
});

// Получение списка файлов
const fileList = async (project_id) => {
  const sql = `SELECT * FROM files WHERE project_id = ?`; // Фильтруем по project_id
  try {
    const [rows] = await con.execute(sql, [project_id]);
    return rows;
  } catch (err) {
    throw err;
  }
};

app.get('/files/:projectId', async (req, res) => { 
  const { projectId } = req.params;
  console.log("Запрос для projectId:", projectId); // Логируем ID проекта

  try {
    const files = await fileList(projectId);
    console.log('Полученные файлы:', files);
    res.json(files);
  } catch (err) {
    console.error('Ошибка при получении файлов:', err);
    res.status(500).json({ error: 'Ошибка при получении файлов', details: err });
  }
});

const projectList = async () => {
  const sql = "SELECT * FROM projects";
  try {
    const [rows] = await con.execute(sql);
    return rows;
  } catch (err) {
    throw err;
  }
};

app.get('/projects', async (req, res) => {
  try {
    const files = await projectList();
    console.log('Полученные проекты:', files);  // Логируем полученные файлы
    res.json(files);
  } catch (err) {
    console.error('Ошибка при получении файлов:', err);
    res.status(500).json({ error: 'Ошибка при получении файлов', details: err });
  }
});

const deleteFile = async (id) => {
  try {
    const selectSql = `SELECT filename FROM files WHERE id = ?`;
    const [rows] = await con.execute(selectSql, [id]); // `rows` — это массив с результатами

    if (!rows.length) {
      console.warn("Файл с данным ID не найден в базе данных");
      return; // Если записи нет, выходим
    }

    const filename = rows[0].filename; // Получаем имя файла

    // Указываем путь к файлу
    const uploadsDirectory = path.join(__dirname, 'uploads');
    const filePath = path.join(uploadsDirectory, filename);
    // Удаляем файл, если он существует
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log("Файл успешно удалён из директории");
    } else {
      console.warn("Файл не найден в директории:", filePath);
    }

    // Удаляем запись из базы данных
    const deleteSql = `DELETE FROM files WHERE id = ?`;
    await con.execute(deleteSql, [id]);

  } catch (error) {
    console.error("Ошибка удаления:", error); // Логируем ошибку
    throw error;
  }
};

app.get('/files-with-sizes/:projectId', async (req, res) => {
  const { projectId } = req.params;

  const query = 'SELECT id, filename FROM files WHERE project_id = ?';

  try {
    // Выполняем запрос к базе данных с использованием execute
    const [results] = await con.execute(query, [projectId]);

    // Собираем информацию о файлах
    const fileDetails = results.map((file) => {
      const filePath = path.join(__dirname, 'uploads', file.filename);
      let size = 0;

      try {
        if (fs.existsSync(filePath)) {
          size = fs.statSync(filePath).size; // Получаем размер файла
        }
      } catch (fsError) {
        console.error(`Ошибка обработки файла ${file.filename}:`, fsError);
      }

      return {
        id: file.id,
        filename: file.filename,
        size,
      };
    });

    res.json(fileDetails);
  } catch (err) {
    console.error('Ошибка при выполнении запроса:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// const selectFileName = (id) => {
//   return new Promise((resolve, reject) => {
//     const sql = `SELECT filename FROM files WHERE id = ?`;
//     con.query(sql, [id], function (err, result) {
//       if (err) {
//         return reject(err);
//       }
//       resolve(result);
//     });
//   });
// }

app.delete('/delete-files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    await deleteFile(fileId);
    res.status(200).json({ message: 'Файл успешно удалён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при удалении файла', details: err.message });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
