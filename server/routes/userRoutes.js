const express = require('express');
const { register, login, getUsersActivity, exportLogFile, getUser, getAllUsers, getUserProjectRights } = require('../controllers/userController');
const { deleteUser, updateApiKey } = require('../models/userModels')
const router = express.Router();
const con = require('../config/db');

router.post('/register', register);
router.post('/login', login);
router.get('/activity', getUsersActivity);
router.get('/log', exportLogFile);
router.get('/:id', getUser)
router.get('/', getAllUsers)
router.delete('/:id', deleteUser);
router.put('/:id/api-key', updateApiKey);
router.get('/:projectId/rights/:userId', getUserProjectRights)
// GET /projects/:projectId/user-access
router.get('/:projectId/user-access', async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;
      
      // Проверяем является ли пользователь владельцем проекта
      const [project] = await con.execute(
        'SELECT user_id FROM projects WHERE id = ?', 
        [projectId]
      );
      
      if (project.length && project[0].user_id === userId) {
        return res.json({ access_level: 'owner' });
      }
      
      // Проверяем доступ в таблице project_access
      const [access] = await con.execute(
        'SELECT access_level FROM project_access WHERE project_id = ? AND client_id = ?',
        [projectId, userId]
      );
      
      if (access.length) {
        return res.json({ access_level: access[0].access_level });
      }
      
      // Если доступ не найден
      res.json({ access_level: null });
      
    } catch (error) {
      console.error('Error checking user access:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
module.exports = router;
