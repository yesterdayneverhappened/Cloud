import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { useNavigate } from 'react-router-dom';
import './ChartsPage.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const ProjectCharts = () => {
  const [usersData, setUsersData] = useState([]);
  const [storageData, setStorageData] = useState({ used: 0, total: 2 * 1024 });
  const [timeRange, setTimeRange] = useState('7d');
  const [fileTypeData, setFileTypeData] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0); // Новое состояние для общего количества пользователей
  const navigate = useNavigate();

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
          setFileTypeData(response.data);
        } else {
          console.error('Ошибка: Неверный формат данных о типах файлов.');
          setFileTypeData([]);
        }
      } else {
        console.error('Ошибка: Ответ не является массивом.', response.data);
        setFileTypeData([]);
      }
    } catch (error) {
      console.error('Ошибка при получении данных о типах файлов:', error);
    }
  };

  const fetchUsersData = async () => {
    try {
      // Запрос данных для графика
      const activityResponse = await axios.get(`http://localhost:5000/api/users/activity?range=${timeRange}`);
      setUsersData(activityResponse.data);
      const totalUsers = activityResponse.data.reduce((sum, entry) => sum + entry.count, 0);
      setTotalUsers(totalUsers);
      // Новый запрос для получения общего количества пользователей
      const totalResponse = await axios.get(`http://localhost:5000/api/users/total?range=${timeRange}`);
      setTotalUsers(totalResponse.data.total);
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
  
      const totalSizeMB = Math.round(response.data.totalSize / (1024 * 1024));
      setStorageData({ used: totalSizeMB, total: 2048 });
    } catch (error) {
      console.error('Ошибка при получении данных о хранилище:', error);
      setStorageData({ used: 0, total: 2048 });
    }
  };

  useEffect(() => {
    fetchUsersData();
    fetchStorageData();
    fetchFileTypeData();
  }, [timeRange]);

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
        <div className="stats-info">
          <p>Общее количество пользователей за период: <strong>{totalUsers}</strong></p>
        </div>
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