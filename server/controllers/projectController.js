const { projectList, addProject, deleteProjectFromDatabase, userProjectList, updatedProject, findClientByEmail, checkExistingAccess, grantAccessToProject, getAccessUsersByProjectId,  } = require('../models/projectModel');
const logger = require('../middlewares/logger');
const con = require('../config/db');
// Получение всех проектов
const getProjects = async (req, res) => {
  try {
    const projects = await projectList();
    logger.info('Получены проекты', { projectsCount: projects.length });
    res.json(projects);
  } catch (err) {
    logger.error('Ошибка при получении проектов', { error: err.message });
    res.status(500).json({ error: 'Ошибка при получении проектов', details: err.message });
  }
};

// Создание проекта
const createProject = async (req, res) => {
  const { name, description, userId } = req.body;
  logger.info('Создание проекта', { name, description, userId });
  try {
    await addProject(name, description, userId);
    logger.info('Проект успешно добавлен', { name });
    res.status(200).json({ message: 'Проект успешно добавлен' });
  } catch (err) {
    logger.error('Ошибка при добавлении проекта', { error: err.message });
    res.status(500).json({ error: 'Ошибка при добавлении проекта', details: err.message });
  }
};

// Получение проектов пользователя
const getUserProject = async (req, res) => {
  const { id: userID } = req.params; // Получаем id из параметров запроса
  if (!userID) {
    logger.warn('Не указан userID');
    return res.status(400).json({ error: 'Не указан userID' });
  }

  try {
    const userProjects = await userProjectList(userID);
    logger.info('Проекты пользователя получены', { userID, projectsCount: userProjects.length });
    res.status(200).json(userProjects);
  } catch (err) {
    logger.error('Ошибка при получении проектов пользователя', { userID, error: err.message });
    res.status(500).json({ error: 'Ошибка при получении проектов пользователя', details: err.message });
  }
};

// Удаление проекта
const deleteProject = async (req, res) => {
  const projectId = req.params.id;
  try {
    await deleteProjectFromDatabase(projectId);
    logger.info('Проект успешно удалён', { projectId });
    res.status(200).json({ message: 'Проект успешно удалён' });
  } catch (err) {
    logger.error('Ошибка при удалении проекта', { projectId, error: err.message });
    res.status(500).json({ error: 'Ошибка при удалении проекта', details: err.message });
  }
};

// Обновление проекта
const updatedProject1 = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    await updatedProject(name, description, id);
    logger.info('Проект успешно обновлён', { id, name });
    res.status(200).json({ message: 'Проект успешно обновлён' });
  } catch (err) {
    logger.error('Ошибка при обновлении проекта', { id, error: err.message });
    res.status(500).json({ error: 'Ошибка при обновлении проекта', details: err.message });
  }
};

const shareProjectAccess = async (req, res) => {
  const projectId = req.params.id;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email обязателен' });
  }

  try {
    const client = await findClientByEmail(email);
    if (!client) {
      return res.status(404).json({ message: 'Пользователь с таким email не найден' });
    }

    const alreadyHasAccess = await checkExistingAccess(projectId, client.id);
    if (alreadyHasAccess) {
      return res.status(400).json({ message: 'Пользователю уже предоставлен доступ' });
    }

    await grantAccessToProject(projectId, client.id);

    res.status(200).json({ message: 'Доступ успешно предоставлен' });
  } catch (error) {
    console.error('Ошибка при предоставлении доступа:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};
const getProjectAccessUsers = async (req, res) => {
  const projectId = req.params.id;

  try {
    const users = await getAccessUsersByProjectId(projectId);
    res.status(200).json(users);
  } catch (err) {
    console.error('Ошибка при получении списка доступа:', err);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
};

const getProjectAccess = async (req, res) => {
  const { projectId } = req.params;
  const sql = `
    SELECT c.id, c.name, c.domain, pa.access_level
    FROM clients c
    INNER JOIN project_access pa ON c.id = pa.client_id AND pa.project_id = ?
  `;

  try {
    const [rows] = await con.execute(sql, [projectId]);
    res.json(rows);
  } catch (error) {
    console.error('Ошибка при получении доступа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

// PUT /projects/:projectId/access/:clientId
// PUT /projects/:projectId/access/:clientId
const updateAccess = async (req, res) => {
  const { projectId, clientId } = req.params;
  const { access_level } = req.body;

  // Валидация входных данных
  if (!['read', 'write', 'owner', null].includes(access_level)) {
    return res.status(400).json({ error: 'Invalid access level' });
  }

  try {
    // Удаление доступа если передано null
    if (access_level === null) {
      const [result] = await con.execute(
        'DELETE FROM project_access WHERE project_id = ? AND client_id = ?',
        [projectId, clientId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Access record not found' });
      }
      
      return res.json({ message: 'Access removed' });
    }

    // Обновление существующего доступа
    const [result] = await con.execute(
      'UPDATE project_access SET access_level = ? WHERE project_id = ? AND client_id = ?',
      [access_level, projectId, clientId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Access record not found' });
    }

    res.json({ message: 'Access updated' });

  } catch (error) {
    console.error('Error updating access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
module.exports = { getProjects, createProject, deleteProject, getUserProject, updatedProject1, shareProjectAccess, getProjectAccessUsers, getProjectAccess, updateAccess };
