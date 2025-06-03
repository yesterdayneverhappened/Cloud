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
const validateApiKey = async (apiKey, projectId) => {
  const [projectRows] = await con.execute(`SELECT * FROM projects WHERE id = ?`, [projectId]);
  const project = projectRows[0];
  if (!project) return false;

  const [clientRows] = await con.execute(`SELECT * FROM clients WHERE api_key = ?`, [apiKey]);
  const client = clientRows[0];
  if (!client) return false;

  return project.client_id === client.id;
};

const getProjectFiles = async (projectId, apiKey) => {
  const isValid = await validateApiKey(apiKey, projectId);
  if (!isValid) {
    throw new Error('Invalid API key or project ID');
  }

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

module.exports = { fileList, getProjectFiles, addFile, deleteFileFromDatabase, getFilesByProjectId, getFileById, renameFileq, replaceFile, getFileByIdCount, getAllFilesSize };