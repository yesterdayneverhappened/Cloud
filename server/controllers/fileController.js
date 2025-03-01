const fs = require('fs');
const path = require('path');
const { fileList, addFile, deleteFileFromDatabase } = require('../models/fileModel');

const updateProject = async (project_id, filename, filepath) => {
  await addFile(project_id, filename, filepath);
};

const getFiles = async (req, res) => {
  const { projectId } = req.params;
  try {
    const files = await fileList(projectId);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении файлов', details: err });
  }
};

const deleteFile = async (req, res) => {
  const fileId = req.params.id;
  try {
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    await deleteFileFromDatabase(fileId);
    res.status(200).json({ message: 'Файл успешно удалён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при удалении файла', details: err });
  }
};

module.exports = { updateProject, getFiles, deleteFile };