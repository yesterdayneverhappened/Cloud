import React, { useState, useRef, useEffect } from 'react';
import '../styles-for-compontnts/Project.css';
import axios from 'axios';

export default function File({ file, deleteFile, onOpenContextMenu, renameFile, userId, moveFile }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showModal, setShowModal] = useState(false); // Модальное окно для информации
  const [projects, setProjects] = useState([]); // Список проектов
  const menuRef = useRef(null);
  const [showMoveModal, setShowMoveModal] = useState(false); // Модальное окно для перемещения

  // Показать/скрыть контекстное меню
  const toggleMenu = (e) => {
    e.stopPropagation();
    onOpenContextMenu();
    setIsMenuVisible(!isMenuVisible);
  };

  // Закрытие меню при клике вне него
  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setIsMenuVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Копирование ссылки на файл в буфер обмена
  const copyToClipboard = () => {
    const fileUrl = `http://localhost:5000/files/download/${file.id}`;
    navigator.clipboard.writeText(fileUrl)
      .then(() => alert(`Ссылка на файл скопирована:\n${fileUrl}`))
      .catch((err) => console.error('Ошибка при копировании:', err));
  };

  // Открыть модальное окно с проектами для перемещения
  const openMoveModal = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/projects/user/${userId}`); // Получаем список проектов
      setProjects(response.data);
      setShowMoveModal(true); // Показываем модальное окно
    } catch (error) {
      console.error('Ошибка при получении проектов:', error);
      alert('Ошибка при получении списка проектов');
    }
  };

  // Действия для пунктов меню
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
        openMoveModal(); // Показать модальное окно для перемещения
        break;
      case 'copy':
        copyToClipboard(); // Копировать в буфер обмена
        break;
      default:
        break;
    }
    setIsMenuVisible(false);
  };


  const moveFileSystem = (fileId, projectId) => {
    console.log(projectId)
    try{
      moveFile(fileId, projectId)
      setShowMoveModal(false);
    } catch {
      alert("Упс, возникла ошибка при перемещении файла")
    }
  }
  return (
    <div className="file-card">
      <div className="file-content">
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

        {/* Модальное окно с информацией */}
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

        {/* Модальное окно для перемещения файла */}
        {showMoveModal && (
          <div className="modal-overlay" onClick={() => setShowMoveModal(false)}>
            <div className="move-file-modal" onClick={(e) => e.stopPropagation()}>
              <button 
                className="move-file-close"
                onClick={() => setShowMoveModal(false)}
              >
                ✖
              </button>
              <h2 className="move-file-title">Переместить файл</h2>
              <p className="move-file-description">Выберите проект:</p>
              <ul className="move-file-list">
                {projects.map((project) => (
                  <li key={project.id} className="move-file-item">
                    <button 
                      className="move-file-button" 
                      onClick={() => moveFileSystem(file.id, project.id)}
                    >
                      {project.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
