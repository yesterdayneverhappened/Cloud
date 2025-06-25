import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { Modal, Menu, Dropdown, Button, List, message, Input } from 'antd';
import { MoreOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

export default function File({ file, deleteFile, renameFile, userId, moveFile }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState(null);
  const [loading, setLoading] = useState(false);

  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [projects, setProjects] = useState([]);

  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newFileName, setNewFileName] = useState(file.filename);

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const fileColors = {
    xls: 'green',
    xlsx: 'green',
    ppt: 'orange',
    pptx: 'orange',
    doc: 'blue',
    docx: 'blue',
    pdf: 'red',
    txt: 'gray',
    csv: 'purple',
  };

  const getFileBorderColor = (ext) => fileColors[ext.toLowerCase()] || 'black';

  const handleFilePreview = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/files/download/${file.id}`, {
        responseType: 'arraybuffer',
      });

      const fileType = file.file_extension.toLowerCase();

      if (fileType === 'txt') {
        const textContent = new TextDecoder('utf-8').decode(response.data);
        setModalContent(<pre style={{ whiteSpace: 'pre-wrap' }}>{textContent}</pre>);
        setModalTitle('Просмотр текста');
      } else if (fileType === 'doc' || fileType === 'docx') {
        const arrayBuffer = response.data;
        mammoth
          .convertToHtml({ arrayBuffer })
          .then((result) => {
            setModalContent(<div dangerouslySetInnerHTML={{ __html: result.value }} />);
            setModalTitle('Просмотр документа Word');
          })
          .catch(() => {
            message.error('Не удалось загрузить содержимое Word файла.');
          });
      } else if (['png', 'jpg', 'jpeg', 'gif'].includes(fileType)) {
        const imageUrl = URL.createObjectURL(new Blob([response.data]));
        setModalContent(<img src={imageUrl} alt={file.filename} style={{ maxWidth: '100%' }} />);
        setModalTitle('Просмотр изображения');
      } else if (fileType === 'xlsx') {
        const workbook = XLSX.read(new Uint8Array(response.data), { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const htmlTable = XLSX.utils.sheet_to_html(sheet);
        setModalContent(<div dangerouslySetInnerHTML={{ __html: htmlTable }} />);
        setModalTitle('Просмотр таблицы');
      } else if (fileType === 'pdf') {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(blob);
        setModalContent(
          <iframe src={pdfUrl} style={{ width: '100%', height: 500 }} title="PDF Preview" />
        );
        setModalTitle('Просмотр PDF');
      } else {
        message.info('Формат файла не поддерживается для предварительного просмотра.');
        setLoading(false);
        return;
      }

      setModalVisible(true);
    } catch (error) {
      message.error('Не удалось загрузить содержимое файла.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const fileUrl = `http://localhost:5000/files/download/${file.id}`;
    navigator.clipboard
      .writeText(fileUrl)
      .then(() => message.success('Ссылка на файл скопирована'))
      .catch(() => message.error('Ошибка при копировании ссылки'));
  };

  const openMoveModal = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/projects/user/${userId}`);
      setProjects(response.data);
      setMoveModalVisible(true);
    } catch {
      message.error('Ошибка при получении списка проектов');
    }
  };

  const handleMenuClick = ({ key }) => {
    switch (key) {
      case 'info':
        setModalContent(
          <>
            <p><b>Название:</b> {file.filename}</p>
            <p><b>Размер:</b> {file.file_size} байт</p>
            <p><b>Расширение:</b> {file.file_extension}</p>
            <p><b>Дата загрузки:</b> {new Date(file.created_at).toLocaleString()}</p>
          </>
        );
        setModalTitle('Информация о файле');
        setModalVisible(true);
        break;

      case 'rename':
        setNewFileName(file.filename);
        setRenameModalVisible(true);
        break;

      case 'delete':
        setDeleteConfirmVisible(true);
        break;

      case 'move':
        openMoveModal();
        break;

      case 'copy':
        copyToClipboard();
        break;

      default:
        break;
    }
  };

  const moveFileSystem = (projectId) => {
    try {
      moveFile(file.id, projectId);
      setMoveModalVisible(false);
      message.success('Файл перемещён');
    } catch {
      message.error('Ошибка при перемещении файла');
    }
  };

  const submitRename = async () => {
    if (!newFileName.trim()) {
      message.warning('Имя файла не может быть пустым');
      return;
    }
    if (newFileName === file.filename) {
      setRenameModalVisible(false);
      return;
    }
    try {
      await renameFile(file.id, newFileName );
      message.success('Файл переименован');
      setRenameModalVisible(false);
    } catch {
      message.error('Ошибка при переименовании файла');
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteFile(file.id);
      message.success('Файл удалён');
      setDeleteConfirmVisible(false);
    } catch {
      message.error('Ошибка при удалении файла');
    }
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="info">ℹ️ Информация</Menu.Item>
      <Menu.Item key="rename">✏️ Переименовать</Menu.Item>
      <Menu.Item key="delete">❌ Удалить</Menu.Item>
      <Menu.Item key="move">📂 Переместить</Menu.Item>
      <Menu.Item key="copy">📄 Копировать</Menu.Item>
    </Menu>
  );

  return (
    <div
      className="file-card"
      style={{
        border: `1px solid ${getFileBorderColor(file.file_extension)}`,
        padding: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 400,
        marginBottom: 8,
        width: '100%'
      }}
    >
      <div
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 200,
          cursor: 'pointer',
        }}
        onClick={handleFilePreview}
        title="Клик для просмотра"
      >
        <strong>{file.filename}</strong>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          type="link"
          onClick={() => window.open(`http://localhost:5000/files/download/${file.id}`, '_blank')}
          style={{ padding: 0 }}
        >
          Скачать
        </Button>

        <Dropdown overlay={menu} trigger={['click']}>
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      </div>

      {/* Просмотр/информация */}
      <Modal
        open={modalVisible}
        title={modalTitle}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={modalTitle === 'Просмотр PDF' ? 900 : 700}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
        centered
        confirmLoading={loading}
      >
        {loading ? <p>Загрузка...</p> : modalContent}
      </Modal>

      {/* Перемещение файла */}
      <Modal
        open={moveModalVisible}
        title="Переместить файл"
        onCancel={() => setMoveModalVisible(false)}
        footer={null}
        centered
      >
        <List
          dataSource={projects}
          renderItem={(project) => (
            <List.Item key={project.id}>
              <Button type="link" onClick={() => moveFileSystem(project.id)}>
                {project.name}
              </Button>
            </List.Item>
          )}
        />
      </Modal>

      {/* Переименование файла */}
      <Modal
        open={renameModalVisible}
        title="Переименовать файл"
        onCancel={() => setRenameModalVisible(false)}
        onOk={submitRename}
        okText="Сохранить"
        cancelText="Отмена"
        centered
      >
        <Input
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          onPressEnter={submitRename}
          maxLength={255}
          autoFocus
        />
      </Modal>

      {/* Подтверждение удаления */}
      <Modal
        open={deleteConfirmVisible}
        title="Подтверждение удаления"
        onCancel={() => setDeleteConfirmVisible(false)}
        onOk={confirmDelete}
        okText="Удалить"
        okButtonProps={{ danger: true }}
        cancelText="Отмена"
        centered
      >
        <ExclamationCircleOutlined style={{ color: 'red', marginRight: 8 }} />
        Вы уверены, что хотите удалить файл <b>{file.filename}</b>?
      </Modal>
    </div>
  );
}
