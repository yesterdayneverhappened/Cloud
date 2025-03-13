const express = require('express');
const { getProjects, createProject, deleteProject, getUserProject } = require('../controllers/projectController');

const router = express.Router();

router.get('/', getProjects);
router.get('/user/:id', getUserProject)
router.post('/', createProject);
router.delete('/-delete:id', deleteProject);

module.exports = router;