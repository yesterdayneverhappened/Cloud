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

const addFile = async (project_id, filename, filepath) => {
  const now = new Date();
  const created_at = now.toISOString().slice(0, 19).replace('T', ' ');

  const sql = `INSERT INTO files (project_id, filename, filepath, created_at) VALUES (?, ?, ?, ?)`;
  try {
    await con.execute(sql, [project_id, filename, filepath, created_at]);
  } catch (err) {
    throw err;
  }
};

const deleteFileFromDatabase = async (id) => {
  const deleteSql = `DELETE FROM files WHERE id = ?`;
  await con.execute(deleteSql, [id]);
};

module.exports = { fileList, addFile, deleteFileFromDatabase };