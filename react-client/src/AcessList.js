// pages/ProjectAccessPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import {
  Table,
  Select,
  Typography,
  message,
  Space,
  Tag
} from 'antd';

const { Title } = Typography;
const { Option } = Select;

const ACCESS_LEVELS = ['read', 'write', 'owner', null];

const ProjectAccessPage = () => {
  const { projectId } = useParams();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchAccessList();
  }, [projectId]);

  const fetchAccessList = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/projects/${projectId}/access-user`);
      setUsers(res.data);
    } catch (err) {
      message.error('Ошибка при получении списка пользователей');
    }
  };

  const updateAccess = async (clientId, newLevel) => {
    try {
      await axios.put(`http://localhost:5000/projects/${projectId}/access/${clientId}`, {
        access_level: newLevel
      });
      message.success('Доступ обновлён');
      fetchAccessList(); // обновим
    } catch (err) {
      message.error('Не удалось обновить доступ');
    }
  };

  const columns = [
    {
      title: 'Имя',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Домен',
      dataIndex: 'domain',
      key: 'domain',
    },
    {
      title: 'Редактировать',
      key: 'edit',
      render: (_, record) => (
        <Select
          value={record.access_level || ''}
          style={{ width: 120 }}
          onChange={(value) => updateAccess(record.id, value || null)}
          allowClear
          placeholder="Нет доступа"
        >
          <Option value="read">Чтение</Option>
          <Option value="write">Запись</Option>
          <Option value="owner">Владелец</Option>
        </Select>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Управление доступом к проекту</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          pagination={false}
        />
      </Space>
    </div>
  );
};

export default ProjectAccessPage;
