import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './UserFileList.css';
import File from './components/File';

const UserFileList = () => {
  const { projectId } = useParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [totalSize, setTotalSize] = useState(0);  // Состояние для хранения общего размера файлов в байтах
  const [progress, setProgress] = useState(0);    // Процент заполненности хранилища

  const navigate = useNavigate();
  const MAX_STORAGE = 100 * 1024 * 1024; // 2 ГБ в байтах

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

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
    formData.append('fileSize', file.size);
    formData.append('fileExtension', file.name.split('.').pop());

    try {
      const response = await axios.post('http://localhost:5000/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage(`Файл загружен: ${response.data.filename} (${response.data.fileSize} байт, ${response.data.fileExtension})`);
      setFile(null);
      fetchFiles(); // Обновляем список файлов после загрузки
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      setMessage('Ошибка при загрузке файла');
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/files/${projectId}`);
      setFiles(response.data);

      // Вычисляем общий размер всех файлов в байтах
      const totalSizeInBytes = response.data.reduce((acc, file) => {
        if (file.file_size && !isNaN(file.file_size)) {
          return acc + file.file_size;  // Суммируем размер файла в байтах
        }
        return acc;  // Если file_size отсутствует или некорректен, пропускаем файл
      }, 0);

      // Преобразуем общий размер в мегабайты
      const totalSizeInMB = totalSizeInBytes / (1024 * 1024);  // Размер в МБ
      setTotalSize(totalSizeInMB);

      // Рассчитываем процент использованного пространства
      const percentageUsed = (totalSizeInBytes / MAX_STORAGE) * 100;
      setProgress(percentageUsed);

    } catch (error) {
      console.error('Ошибка при получении файлов:', error);
      setMessage('Ошибка при получении файлов');
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (idFile) => {
    try {
      await axios.delete(`http://localhost:5000/files/${idFile}`);
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== idFile)); // Удаление из состояния
      setMessage('Файл успешно удалён');
      fetchFiles(); // Обновляем список после удаления
    } catch (err) {
      console.error('Ошибка при удалении файла:', err);
      setMessage('Ошибка при удалении файла');
    }
  };

  const [activeFileId, setActiveFileId] = useState(null);

  const handleOpenContextMenu = (fileId) => {
    setActiveFileId(fileId);
  };

  const renameFile = async (file) => {
    const newName = prompt('Введите новое имя файла:', file.filename);
    if (newName) {
      try {
        const response = await axios.put(
          `http://localhost:5000/files/rename/${file.id}`,
          { newName }
        );
        if (response.status === 200) {
          alert(`Файл переименован в: ${newName}`);
          fetchFiles();
        } else {
          alert('Ошибка при переименовании файла');
        }
      } catch (error) {
        console.error('Ошибка при переименовании файла:', error);
        alert('Ошибка при переименовании файла');
      }
    }
  };

  return (
    <div className="container">
      <div className="upload-section">
        <h1>Загрузка файла</h1>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload}>Загрузить</button>
        {message && <p className="message">{message}</p>}
      </div>

      <div className="navigation-section">
        <button className="back-button" onClick={() => navigate('/yourproject')}>
          Назад
        </button>
      </div>

      <h2>Список файлов для проекта {projectId}</h2>

      <p>Общий размер файлов: {totalSize.toFixed(2)} МБ</p>

      {/* Прогресс-бар */}
      <div className="progress-bar-container" style={{ marginTop: '20px', width: '100%' }}>
        <label htmlFor="progressBar">Прогресс использования хранилища (100 МБ):</label>
        <progress
          id="progressBar"
          value={progress}
          max="100"
          style={{ width: '100%', height: '30px' }}
        >
          {progress}%
        </progress>
        <p>{progress.toFixed(2)}% из 100 МБ использовано</p>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="file-list">
          {files.length > 0 ? (
            files.map((file) => (
              <File
                key={file.id}
                file={file}
                deleteFile={deleteFile}
                renameFile={renameFile}
                onOpenContextMenu={() => handleOpenContextMenu(file.id)}
              />
            ))
          ) : (
            <p>Файлы не найдены</p>
          )}
        </div>
      )}
    </div>
  );
};

export default UserFileList;
