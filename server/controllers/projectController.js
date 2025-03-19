const { projectList, addProject, deleteProjectFromDatabase, userProjectList, updatedProject } = require('../models/projectModel');
const logger = require('../middlewares/logger');

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

module.exports = { getProjects, createProject, deleteProject, getUserProject, updatedProject1 };
