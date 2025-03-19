import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import ProjectCharts from './ChartsPage';

const FileList = () => {
  const { projectId } = useParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Выберите файл для загрузки');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    try {
      const response = await axios.post('http://localhost:5000/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(`Файл загружен: ${response.data.filename}`);
      setFile(null);
      fetchFiles(); // Обновляем список файлов после загрузки
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      setMessage('Ошибка при загрузке файла');
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch(`http://localhost:5000/files/${projectId}`);
      if (!response.ok) {
        throw new Error('Ошибка при получении файлов');
      }
      const data = await response.json();
      console.log('Файлы с сервера:', data);
      setFiles(data);
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setLoading(false); // Устанавливаем флаг загрузки в false в любом случае
    }
  };

  const deleteFile = async (idFile) => {
    console.log(idFile)
    try {
      await axios.delete(`http://localhost:5000/files/${idFile}`);
      console.log('Файл удалён');
      fetchFiles(); // Обновляем список файлов после удаления
    } catch (err) {
      console.error('Ошибка при удалении файла:', err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  return (
    <div>
      <div>
        <h1>Загрузка файла</h1>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload}>Загрузить</button>
        {message && <p>{message}</p>}
      </div>
      <div>
        <button onClick={() => navigate('/projects')}>Назад</button>
      </div>
      <h2>Список файлов для проекта {projectId}</h2>
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <ul>
          {files.length > 0 ? (
            files.map((file) => (
              <div key={file.id}>
                <li>
                  <strong>{file.filename}</strong>
                  <br />
                  Путь: {file.filepath}
                  <br />
                  Загружено: {new Date(file.created_at).toLocaleString()}
                </li>
                <button onClick={() => deleteFile(file.id)}>Удалить</button>
              </div>
            ))
          ) : (
            <p>Файлы не найдены</p>
          )}
        </ul>
      )}
    </div>
  );
};

export default FileList;