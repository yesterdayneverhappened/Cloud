const con = require('../config/db');

const projectList = async () => {
  const sql = `
    SELECT 
      projects.id, 
      projects.name, 
      projects.description, 
      projects.created_at, 
      clients.domain AS client_email, 
      SUM(f.file_size) AS total_size
    FROM 
      projects
    JOIN 
      clients ON projects.client_id = clients.id
    LEFT JOIN 
      files f ON projects.id = f.project_id
    GROUP BY 
      projects.id, 
      projects.name, 
      projects.description, 
      projects.created_at, 
      clients.domain
  `;
  try {
    const [rows] = await con.execute(sql);
    return rows;
  } catch (err) {
    throw err;
  }
};


const userProjectList = async (clientId) => {
  const sql = `
    SELECT DISTINCT p.*, 
      CASE 
        WHEN p.client_id = ? THEN 'owner'
        ELSE pa.access_level
      END AS effective_access
    FROM projects p
    LEFT JOIN project_access pa ON p.id = pa.project_id AND pa.client_id = ?
    WHERE p.client_id = ? OR pa.client_id = ?
  `;
  try {
    const [rows] = await con.execute(sql, [clientId, clientId, clientId, clientId]);
    return rows;
  } catch (err) {
    throw err;
  }
};


const addProject = async (name, description, userID) => {
  const now = new Date();
  const created_at = now.toISOString().slice(0, 19).replace('T', ' ');

  const sql = `INSERT INTO projects (name, description, created_at, client_id) VALUES (?, ?, ?, ?)`;
  await con.execute(sql, [name, description, created_at, userID]);
};

const deleteProjectFromDatabase = async (id) => {
  const deleteFilesSql = 'DELETE FROM files WHERE project_id = ?';
  const deleteProjectSql = 'DELETE FROM projects WHERE id = ?';
  try {
    console.log('Проверка соединения...');
    const con2 = await con.getConnection(); 

    console.log('Начало транзакции, проект id:', id);
    await con2.beginTransaction(); // Начинаем транзакцию
    console.log('Транзакция началась');

    // Удаляем файлы
    console.log('Удаление файлов, запрос:', deleteFilesSql);
    const fileDeletionResult = await con2.execute(deleteFilesSql, [id]);
    console.log('Результат удаления файлов:', fileDeletionResult);

    // Удаляем проект
    console.log('Удаление проекта, запрос:', deleteProjectSql);
    await con2.execute(deleteProjectSql, [id]);
    await con2.commit();
  } catch (error) {
    console.error('Ошибка при удалении проекта и файлов:', error);
    if (con) {
      await con.rollback(); // Откат транзакции в случае ошибки
      console.log('Транзакция откатана');
    }
  }
};


const updatedProject = async (name, description, projectId) => {
  const sql = `UPDATE projects SET name = ?, description = ? WHERE id = ?`;
  await con.execute(sql, [name, description, projectId])
}

const findClientByEmail = async (email) => {
  const [rows] = await con.execute('SELECT id FROM clients WHERE domain = ?', [email]);
  return rows[0];
};

const checkExistingAccess = async (projectId, clientId) => {
  const [rows] = await con.execute(
    'SELECT * FROM project_access WHERE project_id = ? AND client_id = ?',
    [projectId, clientId]
  );
  return rows.length > 0;
};

const grantAccessToProject = async (projectId, clientId) => {
  await con.execute(
    'INSERT INTO project_access (project_id, client_id) VALUES (?, ?)',
    [projectId, clientId]
  );
};

const getAccessUsersByProjectId = async (projectId) => {
  const [rows] = await con.execute(`
    SELECT c.id, c.domain, c.name
    FROM project_access pa
    JOIN clients c ON pa.client_id = c.id
    WHERE pa.project_id = ?
  `, [projectId]);

  return rows;
};
module.exports = {
   projectList,
   addProject,
   deleteProjectFromDatabase, 
   userProjectList, 
   updatedProject, 
   findClientByEmail, 
   checkExistingAccess, 
   grantAccessToProject, 
   getAccessUsersByProjectId,
};