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
  console.log('Файл загружен:', req.file); // Проверяем, какой файл загружается
  const file = req.file;
  const projectId = req.body.projectId;
  console.log('Запрашиваем файлы для projectId:', projectId);
  console.log('file', file)

  if (!file) {
    return res.status(400).json({ error: 'Файл не найден' });
  }

  try {
    await updateProject(projectId, file.filename, `/uploads/${file.filename}`);
    res.json({ filename: file.originalname, filepath: `/uploads/${file.filename}` });
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
