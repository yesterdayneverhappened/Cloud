import React, { useState, useRef, useEffect } from 'react';
import '../styles-for-compontnts/Project.css';

export default function File({ file, deleteFile, onOpenContextMenu }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const menuRef = useRef(null);

  // Показать/скрыть контекстное меню
  const toggleMenu = (e) => {
    e.stopPropagation(); // Предотвращаем закрытие меню при клике по троеточию
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

  // Действия для пунктов меню
  const handleMenuAction = (action) => {
    switch (action) {
      case 'info':
        alert(`Информация о файле:\nНазвание: ${file.filename}\nДата: ${new Date(file.created_at).toLocaleString()}`);
        break;
      case 'rename':
        const newName = prompt('Введите новое имя файла:', file.filename);
        if (newName) {
          alert(`Файл переименован в: ${newName}`);
        }
        break;
      case 'delete':
        deleteFile(file.id);
        break;
      case 'move':
        alert(`Файл "${file.filename}" перемещён`);
        break;
      case 'copy':
        alert(`Файл "${file.filename}" скопирован`);
        break;
      default:
        break;
    }
    setIsMenuVisible(false); // Закрытие меню после действия
  };

  return (
    <div className="file-card">
      <div className="file-content">
        <strong>{file.filename}</strong>
        <p>Загружено: {new Date(file.created_at).toLocaleString()}</p>
      </div>

      <div className="file-actions">
        {/* Кнопка скачать */}
        <button
          onClick={() => window.open(`http://localhost:5000/files/download/${file.id}`, '_blank')}
          className="download-button"
        >
          Скачать
        </button>

        {/* Троеточие для вызова контекстного меню */}
        <button className="menu-button" onClick={toggleMenu}>⋮</button>

        {/* Контекстное меню */}
        {isMenuVisible && (
          <div ref={menuRef} className="context-menu">
            <div onClick={() => handleMenuAction('info')}>ℹ️ Информация</div>
            <div onClick={() => handleMenuAction('rename')}>✏️ Переименовать</div>
            <div onClick={() => handleMenuAction('delete')}>❌ Удалить</div>
            <div onClick={() => handleMenuAction('move')}>📂 Переместить</div>
            <div onClick={() => handleMenuAction('copy')}>📄 Копировать</div>
          </div>
        )}
      </div>
    </div>
  );
}
