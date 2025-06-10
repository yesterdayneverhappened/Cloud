import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserList.css';
import { useNavigate } from 'react-router-dom';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newApiKey, setNewApiKey] = useState(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10); // Количество пользователей на странице

  // Загрузка пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/users');
        const usersArray = response.data[0]; 
        setUsers(usersArray);
        setFilteredUsers(usersArray);
        setError('');
      } catch (err) {
        setError('Ошибка при получении пользователей: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUsers();
  }, []);

  // Фильтрация пользователей при изменении searchTerm
  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
    setCurrentPage(1); // Сброс на первую страницу при новом поиске
  }, [searchTerm, users]);

  // Получение текущих пользователей для отображения
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Генерация нового API-ключа
  const regenerateApiKey = async (userId) => {
    if (window.confirm('Сгенерировать новый API-ключ для этого пользователя?')) {
      try {
        await axios.put(`http://localhost:5000/api/users/${userId}/api-key`);
        
        const response = await axios.get('http://localhost:5000/api/users');
        const updatedUsers = response.data[0];
        setUsers(updatedUsers);
        
        const updatedUser = updatedUsers.find(user => user.id === userId);
        setNewApiKey(updatedUser.api_key);
        setShowApiKeyModal(true);
        
      } catch (err) {
        setError('Ошибка обновления API-ключа: ' + err.message);
      }
    }
  };

  // Удаление пользователя
  const deleteUser = async (userId) => {
    if (window.confirm('Удалить этого пользователя и ВСЕ связанные данные?')) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${userId}`);
        setUsers(users.filter(user => user.id !== userId));
        setError('');
      } catch (err) {
        setError('Ошибка удаления пользователя: ' + err.message);
      }
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  // Изменение страницы
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return <div className="loading">Загрузка пользователей...</div>;
  }

  return (
    <div className="user-management">
      <button onClick={() => navigate('/projects')}>На главную</button>
      <h1>Управление пользователями</h1>
      
      {error && <div className="error">{error}</div>}

      {/* Поле поиска */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Поиск по имени..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="no-users">
          {searchTerm ? 'Пользователи не найдены' : 'Пользователи не найдены'}
        </div>
      ) : (
        <>
          <table className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Имя</th>
                <th>Домен</th>
                <th>API-ключ</th>
                <th>Дата регистрации</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name || 'N/A'}</td>
                  <td>{user.domain || 'N/A'}</td>
                  <td className="api-key-cell">
                    <div className="api-key">{user.api_key || 'N/A'}</div>
                  </td>
                  <td>{formatDate(user.register_date)}</td>
                  <td className="actions">
                    <button 
                      className="btn-regenerate"
                      onClick={() => regenerateApiKey(user.id)}
                    >
                      Сменить ключ
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => deleteUser(user.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Пагинация */}
          <div className="pagination">
            {currentPage > 1 && (
              <button onClick={() => paginate(currentPage - 1)}>&laquo; Назад</button>
            )}
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={currentPage === number ? 'active' : ''}
              >
                {number}
              </button>
            ))}
            
            {currentPage < totalPages && (
              <button onClick={() => paginate(currentPage + 1)}>Вперед &raquo;</button>
            )}
          </div>

          <div className="page-info">
            Страница {currentPage} из {totalPages} | Пользователи: {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} из {filteredUsers.length}
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagement;