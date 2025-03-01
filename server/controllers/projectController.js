const { projectList, addProject, deleteProjectFromDatabase } = require('../models/projectModel');

const getProjects = async (req, res) => {
  try {
    const projects = await projectList();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении проектов', details: err });
  }
};

const createProject = async (req, res) => {
  const { name, description } = req.body;
  try {
    await addProject(name, description);
    res.status(200).json({ message: 'Проект успешно добавлен' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при добавлении проекта', details: err });
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

module.exports = { getProjects, createProject, deleteProject };