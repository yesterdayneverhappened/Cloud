import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './UserFileList.css';
import File from './components/File';
import { jwtDecode } from 'jwt-decode';

const UserFileList = () => {
  const { projectId } = useParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState(null);

  const navigate = useNavigate();

  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;
    setUserId(userId)
};

  useEffect(() => {
    fetchFiles();
    getUserIdFromToken();
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
    } catch (err) {
      console.error('Ошибка при удалении файла:', err);
      setMessage('Ошибка при удалении файла');
    }
  };

  const moveFile = async (fileId, projectId) => {
    try {
      await axios.put(`http://localhost:5000/files/replace/${fileId}`, { projectId });
      fetchFiles();
      return;
    } catch (error) {
      console.error('Ошибка при перемещении файла:', error);
      alert('Ошибка при перемещении файла');
    }
  };
  
  const [activeFileId, setActiveFileId] = useState(null);

  // Функция для закрытия предыдущего контекстного меню
  const handleOpenContextMenu = (fileId) => {
    setActiveFileId(fileId);
  };

  const renameFile = async (file) => {
    const newName = prompt('Введите новое имя файла:', file.filename);
    if (newName) {
      try {
        const response = await axios.put(
          `http://localhost:5000/files/rename/${file.id}`,
          { newName }  // Здесь передается newName в теле запроса
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
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="file-list">
          {files.length > 0 ? (
            files.map((file) => (
              <File 
                file={file} 
                deleteFile={deleteFile} 
                renameFile={renameFile} 
                onOpenContextMenu={() => handleOpenContextMenu(file.id)}
                userId={userId}
                moveFile={moveFile}
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
