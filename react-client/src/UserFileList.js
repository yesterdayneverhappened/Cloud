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

  const navigate = useNavigate();

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
  const [activeFileId, setActiveFileId] = useState(null);

  // Функция для закрытия предыдущего контекстного меню
  const handleOpenContextMenu = (fileId) => {
    setActiveFileId(fileId);
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
              <File file={file} deleteFile={deleteFile} onOpenContextMenu={() => handleOpenContextMenu(file.id)}/>
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
