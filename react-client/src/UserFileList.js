// frontend/src/pages/UserFileList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './UserFileList.css'
import {
  Button,
  Input,
  Select,
  Typography,
  Modal,
  List,
  Upload,
  Progress,
  Space,
  Card,
  message,
} from 'antd';
import {
  UploadOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  CopyOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import File from './components/File';

const { Title } = Typography;
const { Option } = Select;

const UserFileList = () => {
  const { projectId } = useParams();
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [sizeUnit, setSizeUnit] = useState('bytes');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userId, setUserId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchFiles();
    fetchApiKey();
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      setUserId(decoded.id);
    }
  }, [projectId]);

  const fetchApiKey = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const decoded = jwtDecode(token);
    axios.get(`http://localhost:5000/api/users/${decoded.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      setApiKey(res.data.api_key);
    }).catch(console.error);
  };

  const fetchFiles = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/files/${projectId}`);
      setFiles(res.data);
    } catch (error) {
      message.error('Ошибка при получении файлов');
    } finally {
      setLoading(false);
    }
  };

  const convertFileSize = (sizeInBytes) => {
    switch (sizeUnit) {
      case 'KB': return sizeInBytes / 1024;
      case 'MB': return sizeInBytes / 1024 / 1024;
      case 'GB': return sizeInBytes / 1024 / 1024 / 1024;
      default: return sizeInBytes;
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return message.warning('Выберите файлы');

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('fileSize', file.size);
        formData.append('fileExtension', file.name.split('.').pop());

        await axios.post('http://localhost:5000/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            const progress = (e.loaded / e.total) * 100;
            setUploadProgress((prev) => {
              const updated = [...prev];
              updated[selectedFiles.indexOf(file)] = progress;
              return updated;
            });
          },
        });
      }
      message.success(`Загружено ${selectedFiles.length} файл(ов)`);
      fetchFiles();
      setSelectedFiles([]);
      setIsModalVisible(false);
    } catch (err) {
      console.error(err);
      message.error('Ошибка при загрузке');
    }
  };

  const handleFileChange = ({ fileList }) => {
    setSelectedFiles(fileList.map(f => f.originFileObj));
  };

  const copyApiRequest = () => {
    const requestText = `GET http://localhost:5000/client/${projectId}/files\nAuthorization: Bearer ${apiKey}`;
    navigator.clipboard.writeText(requestText).then(() => {
      setCopyStatus('Скопировано!');
      setTimeout(() => setCopyStatus(''), 2000);
    });
  };

  const deleteFile = async (fileId) => {
    try {
      await axios.delete(`http://localhost:5000/files/${projectId}/${fileId}`);
      message.success('Файл удален');
      fetchFiles();
    } catch (error) {
      message.error('Ошибка при удалении файла');
    }
  };

  const renameFile = async (fileId, newName) => {
    try {
      await axios.put(`http://localhost:5000/files/rename/${fileId}`, {
        newName: newName
      });
      message.success('Файл переименован');
      fetchFiles();
    } catch (error) {
      message.error('Ошибка при переименовании файла');
    }
  };
  

  const moveFile = async (fileId, newProjectId) => {
    try {
      await axios.put(`http://localhost:5000/files/${projectId}/${fileId}/move`, {
        newProjectId
      });
      message.success('Файл перемещен');
      fetchFiles();
    } catch (error) {
      message.error('Ошибка при перемещении файла');
    }
  };

  useEffect(() => {
    let updated = [...files];
    if (searchTerm) {
      updated = updated.filter(f => f.filename.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterSize) {
      updated = updated.filter(f => convertFileSize(f.file_size) <= parseFloat(filterSize));
    }
    switch (sortType) {
      case 'nameAsc': updated.sort((a, b) => a.filename.localeCompare(b.filename)); break;
      case 'nameDesc': updated.sort((a, b) => b.filename.localeCompare(a.filename)); break;
      case 'sizeAsc': updated.sort((a, b) => a.file_size - b.file_size); break;
      case 'sizeDesc': updated.sort((a, b) => b.file_size - a.file_size); break;
      case 'dateAsc': updated.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break;
      case 'dateDesc': updated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      default: break;
    }
    setFilteredFiles(updated);
  }, [files, searchTerm, sortType, filterSize, sizeUnit]);

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/yourproject')}>Назад</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>Загрузить файлы</Button>
      </Space>

      <Card title="API-запрос для получения файлов" bordered style={{ marginBottom: 24 }}>
        <pre>GET http://localhost:5000/client/{projectId}/files\nAuthorization: Bearer {showApiKey ? apiKey : '•••••••••••••'}</pre>
        <Space>
          <Button icon={<CopyOutlined />} onClick={copyApiRequest}>{copyStatus || 'Копировать'}</Button>
          <Button icon={showApiKey ? <EyeInvisibleOutlined /> : <EyeTwoTone />} onClick={() => setShowApiKey(!showApiKey)}>
            {showApiKey ? 'Скрыть ключ' : 'Показать ключ'}
          </Button>
        </Space>
      </Card>

      <Card title="Фильтрация и сортировка" bordered style={{ marginBottom: 24, }}>
        <Space direction="vertical" size="middle" style={{ width: '100%', display: 'flex' }}>
          <Input placeholder="Поиск по имени" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <Input type="number" placeholder={`Макс. размер (${sizeUnit})`} value={filterSize} onChange={e => setFilterSize(e.target.value)} />
          <Select value={sizeUnit} onChange={setSizeUnit} style={{ width: 200 }}>
            <Option value="bytes">Байты</Option>
            <Option value="KB">Килобайты</Option>
            <Option value="MB">Мегабайты</Option>
            <Option value="GB">Гигабайты</Option>
          </Select>
          <Select value={sortType} onChange={setSortType} style={{ width: 200 }}>
            <Option value="">Без сортировки</Option>
            <Option value="nameAsc">Имя (A-Z)</Option>
            <Option value="nameDesc">Имя (Z-A)</Option>
            <Option value="sizeAsc">Размер (по возр.)</Option>
            <Option value="sizeDesc">Размер (по убыв.)</Option>
            <Option value="dateAsc">Дата (старые)</Option>
            <Option value="dateDesc">Дата (новые)</Option>
          </Select>
        </Space>
      </Card>

      <Title level={3}>Список файлов</Title>
      {loading ? <p>Загрузка...</p> : (
        <div className="file-list-wrapper">
        {filteredFiles.map(file => (
          <File
            key={file.id}
            file={file}
            deleteFile={deleteFile}
            renameFile={renameFile}
            userId={userId}
            moveFile={moveFile}
          />
        ))}
      </div>      
      )}

      <Modal
        open={isModalVisible}
        title="Загрузка файлов"
        onCancel={() => setIsModalVisible(false)}
        onOk={handleUpload}
        okText="Загрузить"
      >
        <Upload multiple beforeUpload={() => false} onChange={handleFileChange} fileList={selectedFiles.map((f, i) => ({ uid: i, name: f.name }))}>
          <Button icon={<UploadOutlined />}>Выбрать файлы</Button>
        </Upload>
        <List
          dataSource={selectedFiles}
          renderItem={(file, index) => (
            <List.Item>
              <span>{file.name}</span>
              {uploadProgress[index] !== undefined && (
                <Progress percent={Math.round(uploadProgress[index])} size="small" />
              )}
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default UserFileList;