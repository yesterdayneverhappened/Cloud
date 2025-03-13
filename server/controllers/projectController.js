const { projectList, addProject, deleteProjectFromDatabase, userProjectList } = require('../models/projectModel');

const getProjects = async (req, res) => {
  try {
    const projects = await projectList();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении проектов', details: err });
  }
};

const createProject = async (req, res) => {
  const { name, description, userId } = req.body;
  console.log('Полученные данные:', { name, description, userId  }); // Логирование данных
  try {
    await addProject(name, description, userId);
    res.status(200).json({ message: 'Проект успешно добавлен' });
  } catch (err) {
    console.error('Ошибка при добавлении проекта:', err);
    res.status(500).json({ error: 'Ошибка при добавлении проекта', details: err });
  }
};

const getUserProject = async (req, res) => {
  const { id: userID } = req.params; // Получаем id из параметров запроса
  try {
    if (!userID) {
      return res.status(400).json({ error: 'Не указан userID' });
    }
    
    const userProjects = await userProjectList(userID);
    res.status(200).json(userProjects);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении проектов пользователя', details: err });
  }
};
const deleteProject = async (req, res) => {
  const projectId = req.params.id;
  try {
    await deleteProjectFromDatabase(projectId);
    res.status(200).json({ message: 'Проект успешно удалён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при удалении проекта', details: err });
  }
};

module.exports = { getProjects, createProject, deleteProject, getUserProject };