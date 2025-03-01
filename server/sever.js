const express = require('express');
const cors = require('cors');
const fileRoutes = require('./routes/fileRoutes');
const projectRoutes = require('./routes/projectRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET, POST, DELETE',
}));
app.use(express.json());
app.use('/files', fileRoutes);
app.use('/projects', projectRoutes);
app.use(errorHandler);

// Создание папки для загрузок, если её нет
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});