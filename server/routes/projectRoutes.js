const express = require('express');
const { getProjects, createProject, deleteProject, getUserProject, updatedProject1 } = require('../controllers/projectController');

const router = express.Router();

router.get('/', getProjects);
router.get('/user/:id', getUserProject)
router.post('/', createProject);
router.put('/:id', updatedProject1)
router.delete('/-delete:id', deleteProject);

module.exports = router;