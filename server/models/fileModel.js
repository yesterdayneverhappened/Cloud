const con = require('../config/db');

const fileList = async (project_id) => {
  const sql = `SELECT * FROM files WHERE project_id = ?`;
  try {
    const [rows] = await con.execute(sql, [project_id]);
    return rows;
  } catch (err) {
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

const getFileById = async (fileId) => {
  const [fileData] = await con.execute(`SELECT filepath FROM files WHERE id = ?`, [fileId]);
  return fileData.length > 0 ? fileData[0] : null;
};

module.exports = { fileList, addFile, deleteFileFromDatabase, getFilesByProjectId, getFileById };