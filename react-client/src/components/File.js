import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx'; // For working with spreadsheets
import '../styles-for-compontnts/Project.css';
import mammoth from 'mammoth';

export default function File({ file, deleteFile, onOpenContextMenu, renameFile, userId, moveFile }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showModal, setShowModal] = useState(false); // Modal for file info
  const [showMoveModal, setShowMoveModal] = useState(false); // Modal for file move
  const [projects, setProjects] = useState([]); // List of projects
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef(null);

  const fileColors = {
    'xls': 'green',
    'xlsx': 'green',
    'ppt': 'orange',
    'pptx': 'orange',
    'doc': 'blue',
    'docx': 'blue',
    'pdf': 'red',
    'txt': 'gray',
    'csv': 'purple'
  };

  const getFileBorderColor = (extension) => fileColors[extension.toLowerCase()] || 'black';

  // Show/hide context menu
  const toggleMenu = (e) => {
    e.stopPropagation();
    onOpenContextMenu();
    setIsMenuVisible(!isMenuVisible);
  };

  // Fetch file preview
  const handleFilePreview = async () => {
    setIsLoading(true); // Начинаем загрузку
  
    try {
      const response = await axios.get(`http://localhost:5000/files/download/${file.id}`, {
        responseType: 'arraybuffer', // Получаем файл в бинарном формате
      });
  
      const fileType = file.file_extension.toLowerCase();
  
      if (['txt'].includes(fileType)) {
        // Обработка текстовых файлов
        const textContent = new TextDecoder('utf-8').decode(response.data);
        setModalContent(<pre>{textContent}</pre>);
        setModalTitle('Просмотр текста');
      } else if (['doc', 'docx'].includes(fileType)) {
        // Обработка Word файлов с использованием Mammoth
        const arrayBuffer = response.data;
  
        mammoth.convertToHtml({ arrayBuffer })
          .then(result => {
            setModalContent(<div dangerouslySetInnerHTML={{ __html: result.value }} />);
            setModalTitle('Просмотр документа Word');
          })
          .catch(error => {
            console.error('Ошибка при конвертации Word файла:', error);
            alert('Не удалось загрузить содержимое Word файла.');
          });
      } else if (['png', 'jpg', 'jpeg'].includes(fileType)) {
        // Обработка изображений
        const imageUrl = URL.createObjectURL(new Blob([response.data]));
        setModalContent(
          <img src={imageUrl} alt={file.filename} style={{ maxWidth: '100%' }} />
        );
        setModalTitle('Просмотр изображения');
      } else if (fileType === 'xlsx') {
        // Обработка Excel файлов
        const workbook = XLSX.read(new Uint8Array(response.data), { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const htmlTable = XLSX.utils.sheet_to_html(sheet);
        setModalContent(<div dangerouslySetInnerHTML={{ __html: htmlTable }} />);
        setModalTitle('Просмотр таблицы');
      } else if (fileType === 'pdf') {
        // Обработка PDF файлов
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(blob);
        setModalContent(
          <iframe src={pdfUrl} style={{ width: '100%', height: '500px' }} title="PDF Preview" />
        );
        setModalTitle('Просмотр PDF');
      } else {
        alert('Формат файла не поддерживается для предварительного просмотра.');
        return;
      }
  
      setIsModalVisible(true); // Показываем модальное окно
    } catch (error) {
      console.error('Ошибка при получении данных файла:', error);
      alert('Не удалось загрузить содержимое файла.');
    } finally {
      setIsLoading(false); // Останавливаем индикатор загрузки
    }
  };

  // Close context menu if clicked outside
  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setIsMenuVisible(false);
    }
  };

  // Copy file URL to clipboard
  const copyToClipboard = () => {
    const fileUrl = `http://localhost:5000/files/download/${file.id}`;
    navigator.clipboard.writeText(fileUrl)
      .then(() => alert(`Ссылка на файл скопирована:\n${fileUrl}`))
      .catch((err) => console.error('Ошибка при копировании:', err));
  };

  // Open modal for file move
  const openMoveModal = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/projects/user/${userId}`);
      setProjects(response.data);
      setShowMoveModal(true);
    } catch (error) {
      console.error('Ошибка при получении проектов:', error);
      alert('Ошибка при получении списка проектов');
    }
  };

  // Handle menu actions
  const handleMenuAction = async (action) => {
    switch (action) {
      case 'info':
        setShowModal(true);
        break;
      case 'rename':
        await renameFile(file);
        break;
      case 'delete':
        deleteFile(file.id);
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
    setIsMenuVisible(false);
  };

  // Move file between projects
  const moveFileSystem = (fileId, projectId) => {
    try {
      moveFile(fileId, projectId);
      setShowMoveModal(false);
    } catch {
      alert("Упс, возникла ошибка при перемещении файла");
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="file-card" style={{ border: `1px solid ${getFileBorderColor(file.file_extension)}` }}>
      <div className="file-content"
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '200px'
        }}
        onClick={handleFilePreview}
      >
        <strong>{file.filename}</strong>
      </div>

      <div className="file-actions">
        <button
          onClick={() => window.open(`http://localhost:5000/files/download/${file.id}`, '_blank')}
          className="download-button"
        >
          Скачать
        </button>

        <button className="menu-button" onClick={toggleMenu}>⋮</button>

        {isMenuVisible && (
          <div ref={menuRef} className="context-menu">
            <div onClick={() => handleMenuAction('info')}>ℹ️ Информация</div>
            <div onClick={() => handleMenuAction('rename')}>✏️ Переименовать</div>
            <div onClick={() => handleMenuAction('delete')}>❌ Удалить</div>
            <div onClick={() => handleMenuAction('move')}>📂 Переместить</div>
            <div onClick={() => handleMenuAction('copy')}>📄 Копировать</div>
          </div>
        )}

        {/* File info modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowModal(false)}>✖</button>
              <h2>Информация о файле</h2>
              <p><strong>Название:</strong> {file.filename}</p>
              <p><strong>Размер:</strong> {file.file_size} байт</p>
              <p><strong>Расширение:</strong> {file.file_extension}</p>
              <p><strong>Дата загрузки:</strong> {new Date(file.created_at).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Move file modal */}
        {showMoveModal && (
          <div className="modal-overlay" onClick={() => setShowMoveModal(false)}>
            <div className="move-file-modal" onClick={(e) => e.stopPropagation()}>
              <button className="move-file-close" onClick={() => setShowMoveModal(false)}>✖</button>
              <h2 className="move-file-title">Переместить файл</h2>
              <p className="move-file-description">Выберите проект:</p>
              <ul className="move-file-list">
                {projects.map((project) => (
                  <li key={project.id} className="move-file-item">
                    <button className="move-file-button" onClick={() => moveFileSystem(file.id, project.id)}>
                      {project.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner">Загрузка...</div> {/* Индикатор загрузки */}
          </div>
        )}
        {/* File preview modal */}
        {isModalVisible && (
          <div className="modal-overlay" onClick={() => setIsModalVisible(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setIsModalVisible(false)}>✖</button>
              <h2>{modalTitle}</h2>
              <div className="modal-body">{modalContent}</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
