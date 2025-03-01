const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { getFiles, deleteFile } = require('../controllers/fileController');

const router = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const projectId = req.body.projectId;

  if (!file) {
    return res.status(400).send('Файл не найден');
  }

  await updateProject(projectId, file.originalname, file.filename);
  res.json({
    filename: file.originalname,
    filepath: path.join(__dirname, '..', 'uploads', file.filename),
  });
});

router.get('/:projectId', getFiles);
router.delete('/delete/:id', deleteFile);

module.exports = router;