const express = require('express');
const { getProjects, createProject, deleteProject } = require('../controllers/projectController');

const router = express.Router();

router.get('/', getProjects);
router.post('/', createProject);
router.delete('/-delete:id', deleteProject);

module.exports = router;