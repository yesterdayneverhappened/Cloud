import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import './ChartsPage.css'; // Подключаем CSS файл для стилизации

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const ProjectCharts = () => {
  const [usersData, setUsersData] = useState([]);
  const [storageData, setStorageData] = useState({ used: 0, total: 2 * 1024 }); // 2 ГБ в МБ
  const [timeRange, setTimeRange] = useState('7d');
  const [fileTypeData, setFileTypeData] = useState([]);
  const navigate = useNavigate();

  // Функция для получения данных о типах файлов
 // Функция для получения данных о типах файлов
 const fetchFileTypeData = async () => {
  try {
    const response = await axios.get('http://localhost:5000/files');
    console.log('Данные о типах файлов:', response.data);

    if (Array.isArray(response.data)) {
      const isValidData = response.data.every(file => 
        file.hasOwnProperty('file_extension') && typeof file.file_extension === 'string' &&
        file.hasOwnProperty('total_size') && typeof file.total_size === 'number'
      );

      if (isValidData) {
        setFileTypeData(response.data); // Обновляем состояние с типами файлов
      } else {
        console.error('Ошибка: Неверный формат данных о типах файлов.');
        setFileTypeData([]); // Если формат неверный, очищаем данные
      }
    } else {
      console.error('Ошибка: Ответ не является массивом.', response.data);
      setFileTypeData([]);
    }
  } catch (error) {
    console.error('Ошибка при получении данных о типах файлов:', error);
  }
};

  // Функции для получения других данных
  const fetchUsersData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/users/activity?range=${timeRange}`);
      setUsersData(response.data);
    } catch (error) {
      console.error('Ошибка при получении данных о пользователях:', error);
    }
  };

  const fetchStorageData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/files');
      console.log('Данные с сервера:', response.data);
  
      if (typeof response.data.totalSize !== 'number') {
        console.error('Ошибка: Неверный формат данных о размере файлов.');
        setStorageData({ used: 0, total: 2048 });
        return;
      }
  
      const totalSizeMB = Math.round(response.data.totalSize / (1024 * 1024)); // Перевод в МБ
      setStorageData({ used: totalSizeMB, total: 2048 });
    } catch (error) {
      console.error('Ошибка при получении данных о хранилище:', error);
      setStorageData({ used: 0, total: 2048 });
    }
  };

  // useEffect для выполнения запросов при изменении временного диапазона
  useEffect(() => {
    fetchUsersData();
    fetchStorageData();
    fetchFileTypeData();  // Добавим вызов fetchFileTypeData
  }, [timeRange]);

  // Данные для графиков
  const lineData = {
    labels: usersData.map((entry) => entry.date),
    datasets: [
      {
        label: 'Количество пользователей',
        data: usersData.map((entry) => entry.count),
        fill: false,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.2,
      },
    ],
  };

  const pieData = {
    labels: fileTypeData.map(file => 
      `${file.file_extension || 'Без расширения'} (${(file.total_size / 1024 / 1024).toFixed(2)} МБ)`
    ),
    datasets: [
      {
        data: fileTypeData.map(file => file.total_size),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#8A2BE2', '#FFA500', '#FF4500'
        ],
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  };
  return (
    <div className="charts-container">
      <div className="button-container">
        <button onClick={() => navigate('/projects')} className="navigate-button">
          Перейти на главную
        </button>
      </div>
      <div className="header">
        <label>Выберите временной диапазон: </label>
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="dropdown">
          <option value="7d">Последние 7 дней</option>
          <option value="30d">Последний месяц</option>
          <option value="365d">Последний год</option>
        </select>
      </div>

      <div className="chart-container">
        <h2>Активность пользователей</h2>
        <Line data={lineData} />
      </div>

      <div className="chart-container">
        <h2>Типы файлов по размеру</h2>
        <Pie data={pieData} />
      </div>
    </div>
  );
};

export default ProjectCharts;
