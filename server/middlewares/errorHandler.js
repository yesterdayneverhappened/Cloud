const logger = require('./logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Необработанная ошибка', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Что-то пошло не так' });
};

module.exports = errorHandler;
