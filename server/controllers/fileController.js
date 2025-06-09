const fs = require('fs');
const path = require('path');
const { fileList, getProjectFiles, addFile, deleteFileFromDatabase, getFilesByProjectId, getFileById, renameFileq, replaceFile, getFileByIdCount, getAllFilesSize } = require('../models/fileModel');
const updateProject = async (project_id, filename, filepath, fileSize, fileExtension) => {
  await addFile(project_id, filename, filepath, fileSize, fileExtension);
};

const getFiles = async (req, res) => {
  const { projectId } = req.params;
  try {
    const files = await fileList(projectId);
    res.json(files);
  } catch (err) {
    console.error('Ошибка при получении файлов:', err);
    res.status(500).json({ error: 'Ошибка при получении файлов', details: err });
  }
};
const getFilesE = async (req, res) => {
  try {
    const { projectId } = req.params;
    const apiKey = req.headers['x-api-key'];
    
    // Сначала проверяем валидность API ключа
    const isValid = await validateApiKey(apiKey, projectId);
    if (!isValid) {
      return res.status(403).json({ error: 'Invalid API key or project ID' });
    } else {
      const files = await getProjectFilesS(projectId);
      res.json(files);
    }
  } catch (err) {
    console.error('Files controller error:', err);
    
    const status = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    
    res.status(status).json({ 
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
};

const validateApiKey = async (apiKey, projectId) => {
  if (!apiKey || !projectId) return false;

  try {
    const [rows] = await con.execute(`
      SELECT 1
      FROM projects p
      JOIN clients c ON p.client_id = c.id
      WHERE p.id = ? AND c.api_key = ?
    `, [projectId, apiKey]);

    return rows.length > 0;
  } catch (err) {
    console.error('API key validation error:', err);
    return false;
  }
};

const getProjectFilesS = async (projectId) => {
  const projectDir = path.join(__dirname, '..', 'projects', String(projectId));
  if (!fs.existsSync(projectDir)) {
    throw new Error('Project directory not found');
  }

  const files = fs.readdirSync(projectDir);

  return files.map(fileName => {
    const filePath = path.join(projectDir, fileName);
    const stats = fs.statSync(filePath);

    return {
      name: fileName,
      content: fs.readFileSync(filePath).toString('base64'),
      size: stats.size,
      type: path.extname(fileName).substring(1) || 'unknown',
      lastModified: stats.mtime,
    };
  });
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

const replaceFileController = async (req, res) => {
  const { id } = req.params
  const { projectId } = req.body
  console.log('ID из параметров:', id);
  console.log('Новый проект файла:', projectId);
  try{
    await replaceFile(id, projectId)
    res.json({message: 'Файл успешно перемещён в проект', projectId})
  } catch (error) {
    console.error('Ошибка перемещения файла', error);
    res.status(500).json({error: 'Ошибка при перемещении файла'})
  }
}

const getCountFile = async (req, res) => {
  const { id } = req.params;
  try {
    const count = await getFileByIdCount(id);
    res.json({ count });
  } catch (error) {
    console.error('Ошибка при получении количества файлов:', error);
    res.status(500).json({ error: 'Ошибка при получении количества файлов' });
  }
};

const getAllFilesSizeController = async (req, res) => {
  try {
    const fileSizes = await getAllFilesSize(); // Получаем массив данных
    console.log('Общий размер файлов на сервере (до преобразования):', fileSizes);

    // Преобразуем данные
    const formattedFileSizes = fileSizes.map(file => ({
      file_extension: file.file_extension || 'Без расширения',
      total_size: Number(file.total_size) || 0, // Преобразуем в число
    }));

    console.log('Форматированные данные:', formattedFileSizes);

    const totalSizeNumber = formattedFileSizes.reduce((sum, file) => sum + Number(file.total_size), 0); // Суммируем размеры

    if (isNaN(totalSizeNumber)) {
      console.error('Ошибка: Неверный формат данных о размере файлов.');
      return res.status(500).json({ error: 'Ошибка при получении размера файлов' });
    }

    res.json(formattedFileSizes); // Возвращаем форматированные данные
  } catch (error) {
    console.error('Ошибка при получении количества файлов:', error);
    res.status(500).json({ error: 'Ошибка при получении количества файлов' });
  }
};



module.exports = { updateProject, getFiles, getFilesE, deleteFile, getFilesWithSizes, downloadFile, renameFile, replaceFileController, getCountFile, getAllFilesSizeController };