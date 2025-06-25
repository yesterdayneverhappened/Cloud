// frontend/src/pages/UserProjects.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button, Modal, Input, Typography, Row, Col, Card, Space, message, Dropdown, Menu
} from 'antd';
import { PlusOutlined, LogoutOutlined, UserAddOutlined, EllipsisOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const UserProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [deletingProjectFilesCount, setDeletingProjectFilesCount] = useState(0);
  const [shareEmail, setShareEmail] = useState('');
  const [shareModalProjectId, setShareModalProjectId] = useState(null);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [loadingSharedUsers, setLoadingSharedUsers] = useState(false);


  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProjects();
  }, []);
  const fetchSharedUsers = async (projectId) => {
    const token = localStorage.getItem('token');
    setLoadingSharedUsers(true);
    try {
      const res = await axios.get(`http://localhost:5000/projects/${projectId}/access`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSharedUsers(res.data);
    } catch (err) {
      console.error('Ошибка при получении пользователей с доступом:', err);
      setSharedUsers([]);
    } finally {
      setLoadingSharedUsers(false);
    }
  };
  
  const fetchUserProjects = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      const res = await axios.get(`http://localhost:5000/projects/user/${decoded.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectFilesCount = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/files/count/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeletingProjectFilesCount(res.data.count[0].count);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProject = async () => {
    const token = localStorage.getItem('token');
    if (!token || !newProjectName || !newProjectDescription) return;
    try {
      const decoded = jwtDecode(token);
      const payload = {
        name: newProjectName,
        description: newProjectDescription,
      };
      const url = editingProject
        ? `http://localhost:5000/projects/${editingProject.id}`
        : 'http://localhost:5000/projects';
      const method = editingProject ? 'put' : 'post';
      await axios[method](url, {
        ...payload,
        userId: decoded.id,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success(editingProject ? 'Проект обновлён' : 'Проект добавлен');
      setIsModalOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
      setEditingProject(null);
      fetchUserProjects();
    } catch (err) {
      console.error(err);
      message.error('Ошибка при сохранении проекта');
    }
  };

  const handleDeleteProject = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/projects/-delete${deletingProjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Проект удалён');
      setIsDeleteModalOpen(false);
      setDeletingProjectId(null);
      fetchUserProjects();
    } catch (err) {
      console.error(err);
      message.error('Ошибка при удалении');
    }
  };

  const handleShareProject = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(`http://localhost:5000/projects/${shareModalProjectId}/share`, {
        email: shareEmail,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Доступ предоставлен');
    } catch (err) {
      console.error(err);
      message.error('Ошибка при предоставлении доступа');
    } finally {
      setShareModalProjectId(null);
      setShareEmail('');
    }
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2} style={{ color: '#52c41a' }}>Мои проекты</Title>
        <Space>
          <Button
            icon={<PlusOutlined />} type="primary"
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            onClick={() => setIsModalOpen(true)}>
            Добавить
          </Button>
          <Button icon={<LogoutOutlined />} onClick={() => {
            localStorage.removeItem('token');
            navigate('/login');
          }}>Выйти</Button>
        </Space>
      </Space>
      <Row gutter={[16, 16]}>
        {projects.map(project => {
          const menu = (
            <Menu>
              <Menu.Item key="edit" onClick={() => {
                setEditingProject(project);
                setNewProjectName(project.name);
                setNewProjectDescription(project.description);
                setIsModalOpen(true);
              }}>Редактировать</Menu.Item>
              <Menu.Item key="delete" onClick={() => {
                setDeletingProjectId(project.id);
                setIsDeleteModalOpen(true);
                fetchProjectFilesCount(project.id);
              }}>Удалить</Menu.Item>
              <Menu.Item key="share" onClick={() => {
                setShareModalProjectId(project.id);
                fetchSharedUsers(project.id);
              }}>
                Поделиться</Menu.Item>
            </Menu>
          );

          return (
            <Col xs={24} sm={12} md={8} key={project.id}>
              <Card
                title={<span onClick={() => navigate(`/yourproject/${project.id}`)} style={{ cursor: 'pointer', color: '#389e0d' }}>{project.name}</span>}
                extra={<Dropdown overlay={menu} trigger={['click']}><Button icon={<EllipsisOutlined />} /></Dropdown>}
                bordered style={{ borderColor: '#52c41a' }}>
                <Paragraph>{project.description}</Paragraph>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Modal
        title={editingProject ? 'Редактировать проект' : 'Новый проект'}
        open={isModalOpen}
        onOk={handleAddProject}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingProject(null);
          setNewProjectName('');
          setNewProjectDescription('');
        }}>
        <Input
          placeholder="Название проекта"
          value={newProjectName}
          onChange={e => setNewProjectName(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Input.TextArea
          placeholder="Описание проекта"
          value={newProjectDescription}
          onChange={e => setNewProjectDescription(e.target.value)}
          rows={4}
        />
      </Modal>

      <Modal
        title="Удалить проект"
        open={isDeleteModalOpen}
        onOk={handleDeleteProject}
        onCancel={() => setIsDeleteModalOpen(false)}
        okButtonProps={{ danger: true }}
        okText="Удалить"
        cancelText="Отмена"
      >
        <p>Вы действительно хотите удалить проект?</p>
        <p>Он содержит {deletingProjectFilesCount} файлов.</p>
      </Modal>

      <Modal
        title="Добавить пользователя к проекту"
        open={!!shareModalProjectId}
        onOk={handleShareProject}
        onCancel={() => {
          setShareModalProjectId(null);
          setShareEmail('');
        }}
        okText="Поделиться"
        cancelText="Отмена"
      >
        {loadingSharedUsers ? (
          <p>Загрузка пользователей...</p>
        ) : (
          <>
            {sharedUsers.length > 0 ? (
              <div style={{ marginBottom: 12 }}>
                <b>Уже имеют доступ:</b>
                <ul style={{ paddingLeft: 20 }}>
                  {sharedUsers.map(user => (
                    <li key={user.id}>{user.name}: {user.domain}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p style={{ color: '#888' }}>Никому ещё не выдан доступ</p>
            )}
          </>
        )}
        <Input
          placeholder="Email пользователя"
          value={shareEmail}
          onChange={e => setShareEmail(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default UserProjects;
