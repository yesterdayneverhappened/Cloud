const con = require('../config/db');

const projectList = async () => {
  const sql = "SELECT * FROM projects";
  try {
    const [rows] = await con.execute(sql);
    return rows;
  } catch (err) {
    throw err;
  }
};

const addProject = async (name, description) => {
  const now = new Date();
  const created_at = now.toISOString().slice(0, 19).replace('T', ' ');

  const sql = `INSERT INTO projects (name, description, created_at) VALUES (?, ?, ?)`;
  await con.execute(sql, [name, description, created_at]);
};

const deleteProjectFromDatabase = async (id) => {
  const deleteSql = `DELETE FROM projects WHERE id = ?`;
  await con.execute(deleteSql, [id]);
};

module.exports = { projectList, addProject, deleteProjectFromDatabase };