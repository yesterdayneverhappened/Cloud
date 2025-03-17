const fs = require('fs');
const path = require('path');
const { fileList, addFile, deleteFileFromDatabase, getFilesByProjectId, getFileById } = require('../models/fileModel');
const updateProject = async (project_id, filename, filepath, fileSize, fileExtension) => {
  await addFile(project_id, filename, filepath, fileSize, fileExtension);
};

const getFiles = async (req, res) => {
  console.log('Маршрут вызван:', req.params.projectId);
  const { projectId } = req.params;
  try {
    const files = await fileList(projectId);
    res.json(files);
  } catch (err) {
    console.error('Ошибка при получении файлов:', err);
    res.status(500).json({ error: 'Ошибка при получении файлов', details: err });
  }
};


const deleteFile = async (req, res) => {
  const fileId = req.params.id;

  try {
    const fileData = await getFileById(fileId);
    if (!fileData) {
      return res.status(404).json({ error: 'Файл не найден в базе данных' });
    }

    const filename = fileData.filepath; // Получаем путь из базы
    const filePath = path.join(__dirname, '..', filename);
    console.log('Имя удаляемого файла: ', filePath)
    // Проверяем, существует ли файл перед удалением
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    // Удаляем запись из базы
    await deleteFileFromDatabase(fileId);

    res.status(200).json({ message: 'Файл успешно удалён' });
  } catch (err) {
    console.error('Ошибка при удалении файла:', err);
    res.status(500).json({ error: 'Ошибка при удалении файла', details: err });
  }
};

const getFilesWithSizes = async (req, res) => {
  const { projectId } = req.params;

  try {
    const files = await getFilesByProjectId(projectId);
    const fileDetails = files.map((file) => ({
      id: file.id,
      filename: file.filename,
      size: getFileSize(path.join(__dirname, '..', 'uploads', file.filename)),
    }));

    res.json(fileDetails);
  } catch (err) {
    console.error('Ошибка при выполнении запроса:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
const getFileSize = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size; // Размер в байтах
  } catch (err) {
    console.error('Ошибка при получении размера файла:', err);
    return null;
  }
};
module.exports = { updateProject, getFiles, deleteFile, getFilesWithSizes };