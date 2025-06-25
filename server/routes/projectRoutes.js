const express = require('express');
const { getProjects, createProject, deleteProject, getUserProject, updatedProject1, shareProjectAccess, getProjectAccessUsers } = require('../controllers/projectController');
const logger = require('../middlewares/logger');

const router = express.Router();

// Логирование всех запросов к маршруту
router.use((req, res, next) => {
  logger.info('Запрос к маршруту', { method: req.method, url: req.url });
  next();
});

router.get('/', getProjects);
router.get('/user/:id', getUserProject);
router.get('/:id/access', getProjectAccessUsers);
router.post('/', createProject);
router.put('/:id', updatedProject1);
router.post('/:id/share', shareProjectAccess)
router.delete('/:id', deleteProject);
router.get('/download-log', (req, res) => {
    const logFilePath = path.join(__dirname, '..', 'logs', 'app.log');
  
    // Проверка наличия файла
    if (fs.existsSync(logFilePath)) {
      res.download(logFilePath, 'log.txt', (err) => {
        if (err) {
          logger.error('Ошибка при скачивании лог-файла', { error: err.message });
          res.status(500).send('Ошибка при скачивании лог-файла');
        }
      });
    } else {
      res.status(404).send('Лог-файл не найден');
    }
  });
module.exports = router;
