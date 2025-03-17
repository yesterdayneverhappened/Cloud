const fs = require('fs');
const path = require('path');
const { fileList, addFile, deleteFileFromDatabase, getFilesByProjectId, getFileById, renameFileq } = require('../models/fileModel');
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
const downloadFile = async (req, res) => {
  const { id } = req.params;
  try {
      const file = await getFileById(id);
      if (!file) return res.status(404).json({ error: 'Файл не найден' });

      const filePath = path.join(__dirname, '..', file.filepath);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Файл не найден на сервере' });

      res.download(filePath, file.filename);
  } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      res.status(500).json({ error: 'Ошибка при скачивании файла' });
  }
};
const renameFile = async (req, res) => {
  const { id } = req.params;
  const { newName } = req.body;
  const wowid = req.params.id
  // Логирование входных данных
  console.log('ID из параметров:', wowid);
  console.log('Новое имя файла:', newName);

  if (!wowid || !newName) {
    return res.status(400).json({ error: 'Неверные данные для переименования файла' });
  }

  try {
    const file = await getFileById(wowid);
    if (!file) return res.status(404).json({ error: 'Файл не найден' });

    const oldPath = path.join(__dirname, '..', file.filepath);
    const newPath = path.join(path.dirname(oldPath), newName);

    if (!fs.existsSync(oldPath)) return res.status(404).json({ error: 'Файл не найден на сервере' });

    fs.renameSync(oldPath, newPath);

    await renameFileq(wowid, newName, `/uploads/${newName}`);

    res.json({ message: 'Файл успешно переименован', newName });
  } catch (error) {
    console.error('Ошибка при переименовании файла:', error);
    res.status(500).json({ error: 'Ошибка при переименовании файла' });
  }
};

module.exports = { updateProject, getFiles, deleteFile, getFilesWithSizes, downloadFile, renameFile };