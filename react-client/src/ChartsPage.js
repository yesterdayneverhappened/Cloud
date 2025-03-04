import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

const ProjectCharts = () => {
  const { projectId } = useParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilesWithSizes = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/files/size/${projectId}`);
        
        if (response.status === 200) {
          setFiles(response.data); // Устанавливаем файлы
        } else {
          console.error('Сервер вернул некорректный статус:', response.status);
          setFiles([]); // На случай ошибки, устанавливаем пустой массив
        }
      } catch (error) {
        console.error('Ошибка при получении данных о файлах:', error);
        setFiles([]); // Устанавливаем пустой массив в случае ошибки
      } finally {
        setLoading(false); // Завершаем загрузку в любом случае
      }
    };
  
    fetchFilesWithSizes();
  }, [projectId]);
  

  if (loading) {
    return <p>Загрузка...</p>;
  }

  if (!files.length) {
    return <p>Файлы не найдены для проекта {projectId}</p>;
  }

  // Круговая диаграмма: Распределение по типам файлов
  const fileTypes = files.map((file) => file.filename.split('.').pop());
  const uniqueTypes = [...new Set(fileTypes)];
  const pieData = {
    labels: uniqueTypes,
    datasets: [
      {
        label: 'Распределение по типам файлов',
        data: uniqueTypes.map((type) => fileTypes.filter((fileType) => fileType === type).length),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Столбчатая диаграмма: Размеры файлов
  const barData = {
    labels: files.map((file) => file.filename),
    datasets: [
      {
        label: 'Размер файла (в байтах)',
        data: files.map((file) => file.size), // Используем размер из API
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Линейная диаграмма: Условное накопление ID
  const lineData = {
    labels: files.map((file) => file.filename),
    datasets: [
      {
        label: 'ID файлов (нарастающим итогом)',
        data: files.map((_, index) => index + 1),
        fill: false,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.2,
      },
    ],
  };

  return (
    <div>
      <div style={{ width: '400px', margin: '20px auto' }}>
        <h2>Круговая диаграмма</h2>
        <Pie data={pieData} />
      </div>
      <div style={{ width: '700px', margin: '20px auto' }}>
        <h2>Столбчатая диаграмма</h2>
        <Bar data={barData} />
      </div>
      <div style={{ width: '700px', margin: '20px auto' }}>
        <h2>Линейная диаграмма</h2>
        <Line data={lineData} />
      </div>
    </div>
  );
};

export default ProjectCharts;
