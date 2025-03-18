import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './UserFileList.css';
import File from './components/File';
import { jwtDecode } from 'jwt-decode';

const UserFileList = () => {
  const { projectId } = useParams();
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [sizeUnit, setSizeUnit] = useState('bytes'); // Единица измерения размера

  const navigate = useNavigate();

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setSelectedFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
  };

  const handleDragOver = (e) => e.preventDefault();

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

  const convertFileSize = (sizeInBytes) => {
    switch (sizeUnit) {
      case 'KB':
        return sizeInBytes / 1024;
      case 'MB':
        return sizeInBytes / (1024 * 1024);
      case 'GB':
        return sizeInBytes / (1024 * 1024 * 1024);
      default:
        return sizeInBytes; // По умолчанию байты
    }
  };
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setMessage('Выберите файлы для загрузки');
      return;
    }

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('fileSize', file.size);
        formData.append('fileExtension', file.name.split('.').pop());

        await axios.post('http://localhost:5000/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setMessage(`Успешно загружено ${selectedFiles.length} файл(ов)`);
      setSelectedFiles([]);
      fetchFiles();
      setShowModal(false); // Закрываем модальное окно после загрузки
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      setMessage('Ошибка при загрузке файлов');
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

  useEffect(() => {
    let updatedFiles = [...files];

    if (searchTerm) {
      updatedFiles = updatedFiles.filter((file) =>
        file.filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterSize) {
      updatedFiles = updatedFiles.filter((file) =>
        convertFileSize(file.file_size) <= parseFloat(filterSize)
      );
    }

    switch (sortType) {
      case 'nameAsc':
        updatedFiles.sort((a, b) => a.filename.localeCompare(b.filename));
        break;
      case 'nameDesc':
        updatedFiles.sort((a, b) => b.filename.localeCompare(a.filename));
        break;
      case 'sizeAsc':
        updatedFiles.sort((a, b) => a.file_size - b.file_size);
        break;
      case 'sizeDesc':
        updatedFiles.sort((a, b) => b.file_size - a.file_size);
        break;
      case 'dateAsc':
        updatedFiles.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'dateDesc':
        updatedFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      default:
        break;
    }

    setFilteredFiles(updatedFiles);
  }, [searchTerm, sortType, filterSize, files, sizeUnit]);

  return (
    <div className="container">
      
      {showModal && (
        <div className="file-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="file-upload-modal"
            onClick={(e) => e.stopPropagation()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <h2 className="file-modal-title">Загрузка файлов</h2>
            <p className="file-modal-text">Перетащите файлы сюда или выберите их вручную</p>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="file-input"
            />
            {selectedFiles.length > 0 && (
              <ul className="file-preview-list">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="file-preview-item">{file.name}</li>
                ))}
              </ul>
            )}
            <button className="file-upload-button" onClick={handleUpload}>Загрузить файлы</button>
          </div>
        </div>
      )}
      <div className="filter-section">
        <input
          type="text"
          placeholder="Поиск по имени"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

          <input
          type="number"
          placeholder={`Макс. размер (${sizeUnit})`}
          value={filterSize}
          onChange={(e) => setFilterSize(e.target.value)}
        />

        <select value={sizeUnit} onChange={(e) => setSizeUnit(e.target.value)}>
          <option value="bytes">Байты</option>
          <option value="KB">Килобайты (KB)</option>
          <option value="MB">Мегабайты (MB)</option>
          <option value="GB">Гигабайты (GB)</option>
        </select>


        <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
          <option value="">Сортировка</option>
          <option value="nameAsc">По имени (A-Z)</option>
          <option value="nameDesc">По имени (Z-A)</option>
          <option value="sizeAsc">По размеру (возр.)</option>
          <option value="sizeDesc">По размеру (убыв.)</option>
          <option value="dateAsc">По дате (старые)</option>
          <option value="dateDesc">По дате (новые)</option>
        </select>
      </div>
      <div className="navigation-section">
        <button className="back-button" onClick={() => navigate('/yourproject')}>
          Назад
        </button>
        <button className="file-upload-modal-button" onClick={() => setShowModal(true)}>
          ➕ Загрузить файлы
        </button>
      </div>

      <h2>Список файлов для проекта {projectId}</h2>
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="file-list">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file) => ( 
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
