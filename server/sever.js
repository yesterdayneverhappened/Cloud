const express = require('express');
const cors = require('cors');
const fileRoutes = require('./routes/fileRoutes');
const projectRoutes = require('./routes/projectRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middlewares/errorHandler');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Настройка CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET, POST, DELETE, PUT',
}));

app.use(express.json());

// Подключение маршрутов
app.use('/files', fileRoutes);
app.use('/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use(errorHandler);

// Создание папки `uploads`, если её нет
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
