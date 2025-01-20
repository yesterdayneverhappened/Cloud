import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

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

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(`Файл загружен: ${response.data.filename}`);
      fetchFiles(); // Обновляем список файлов после загрузки
    } catch (error) {
      console.error(error);
      setMessage('Ошибка при загрузке файла');
    }
  };

  const fetchFiles = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      console.log(`Запрос на файлы для проекта с ID: ${projectId}`);
      const response = await axios.get(`http://localhost:5000/files/${projectId}`);
      console.log(response.data);
      setFiles(response.data);
    } catch (error) {
      console.error('Ошибка при получении файлов:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (idFile) => {
    try {
      await axios.delete(`http://localhost:5000/delete-files/${idFile}`);
      console.log("Файл удалён");
      fetchFiles(); // Обновляем список файлов после удаления
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  if (loading) {
    return <p>Загрузка...</p>;
  }

  const back = () => {
    navigate('/');
  };

  return (
    <div>
      <div>
        <h1>Загрузка файла</h1>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload}>Загрузить</button>
        {message && <p>{message}</p>}
      </div>
      <div>
        <button onClick={back}>Назад</button>
      </div>
      <h2>Список файлов для проекта {projectId}</h2>
      <ul>
        {files.length > 0 ? (
          files.map((file) => (
            <div key={file.id}>
              <li>
                <strong>{file.filename}</strong>
                <br />
                Путь: {file.filepath}
                <br />
                Загружено: {new Date(file.uploaded_at).toLocaleString()}
              </li>
              <button onClick={() => deleteFile(file.id)}>
                Удалить
              </button>
            </div>
          ))
        ) : (
          <p>Файлы не найдены</p>
        )}
      </ul>
    </div>
  );
};

export default FileList;