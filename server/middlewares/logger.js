const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.File({ filename: 'logs/app.log' }), // Логирование в файл
    new winston.transports.Console({ format: winston.format.simple() }), // Логирование в консоль
  ],
});

module.exports = logger;
