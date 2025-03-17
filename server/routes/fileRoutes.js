const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { updateProject, getFiles, deleteFile, getFilesWithSizes } = require('../controllers/fileController');

const router = express.Router();

// Настройка хранения файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Маршрут для загрузки файлов
router.post('/upload', upload.single('file'), async (req, res) => {
  console.log('Файл загружен:', req.file);
  const file = req.file;
  const projectId = req.body.projectId;

  if (!file) {
    return res.status(400).json({ error: 'Файл не найден' });
  }

  if (!projectId) {
    return res.status(400).json({ error: 'ID проекта не указан' });
  }

  // Получение данных о файле
  const filename = file.originalname;
  const filepath = `/uploads/${file.filename}`;
  const fileSize = file.size; // Размер в байтах
  const fileExtension = path.extname(filename).slice(1); // Расширение файла (без точки)

  try {
    await updateProject(projectId, filename, filepath, fileSize, fileExtension);
    res.json({
      filename: filename,
      filepath: filepath,
      fileSize: fileSize,
      fileExtension: fileExtension
    });
  } catch (error) {
    console.error('Ошибка при сохранении файла:', error);
    res.status(500).json({ error: 'Ошибка при сохранении файла' });
  }
});


// Получение файлов проекта
router.get('/:projectId', getFiles);

// Удаление файла
router.delete('/:id', deleteFile);

// Получение информации о размере файлов
router.get('/size/:projectId', getFilesWithSizes);

module.exports = router;
