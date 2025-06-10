const con = require('../config/db');
const path = require('path');
const fs = require('fs');

const fileList = async (project_id) => {
  const sql = `SELECT * FROM files WHERE project_id = ?`;
  try {
    const [rows] = await con.execute(sql, [project_id]);
    return rows;
  } catch (err) {
    throw err;
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

const getProjectFiles = async (projectId) => {
  try {
    const filesFromDb = await fileList(projectId);

    return filesFromDb.map(file => {
      const filePath = path.join(__dirname, '..', file.filepath);

      if (!fs.existsSync(filePath)) {
        console.warn('File not found:', filePath);
        return null;
      }

      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath).toString('base64');

      return {
        name: file.filename, // или file.original_name, если у тебя есть
        content,
        size: stats.size,
        type: path.extname(filePath).substring(1) || 'unknown',
        lastModified: stats.mtime,
      };
    }).filter(Boolean); // убираем null, если файл не найден
  } catch (err) {
    console.error('getProjectFiles error:', err);
    throw err;
  }
};
const addFile = async (project_id, filename, filepath, fileSize, fileExtension) => {
  console.log(`Добавление файла: ${filename} в проект ${project_id}`);
  const sql = `INSERT INTO files (project_id, filename, filepath, file_size, file_extension, created_at) VALUES (?, ?, ?, ?, ?, ?)`;
  try {
    await con.execute(sql, [
      project_id,
      filename,
      filepath,
      fileSize,
      fileExtension,
      new Date(),
    ]);
  } catch (err) {
    console.error('Ошибка при добавлении файла в базу:', err);
    throw err;
  }
};
const deleteFileFromDatabase = async (fileId) => {
  await con.execute(`DELETE FROM files WHERE id = ?`, [fileId]);
};
const getFilesByProjectId = async (projectId) => {
  const query = 'SELECT id, filename FROM files WHERE project_id = ?';
  const [results] = await con.execute(query, [projectId]);
  return results;
};
const renameFileq = async (id, newName, newPath) => {
  await con.execute('UPDATE files SET filename = ?, filepath = ? WHERE id = ?', [newName, newPath, id]);
};
const getFileById = async (fileId) => {
  const [fileData] = await con.execute(`SELECT filepath FROM files WHERE id = ?`, [fileId]);
  return fileData.length > 0 ? fileData[0] : null;
};
const getFileByIdCount = async (projectId) => {
  const [fileData] = await con.execute('SELECT COUNT(*) AS count FROM files WHERE project_id = ?', [projectId]);
  return fileData;
};
const replaceFile = async (id, projectId) => {
  await con.execute('UPDATE files SET project_id = ? WHERE id = ?', [projectId, id]);
}

const getAllFilesSize = async () => {
  console.log('Функция `getAllFilesSize` вызвана');

  const sql = `
    SELECT IFNULL(file_extension, 'Без расширения') AS file_extension, 
           IFNULL(SUM(file_size), 0) AS total_size
    FROM files
    GROUP BY file_extension
  `;

  try {
    const [rows] = await con.execute(sql);

    const formattedData = rows.map(file => ({
      file_extension: file.file_extension || 'Без расширения',
      total_size: Number(file.total_size) || 0,
    }));

    console.log('Результат запроса (после преобразования):', formattedData);
    return formattedData;
  } catch (err) {
    console.error('Ошибка при выполнении SQL-запроса:', err);
    throw new Error('Не удалось получить размер всех файлов.');
  }
};

module.exports = { fileList, getProjectFiles, validateApiKey, addFile, deleteFileFromDatabase, getFilesByProjectId, getFileById, renameFileq, replaceFile, getFileByIdCount, getAllFilesSize };