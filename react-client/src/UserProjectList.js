import React, { Component } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Link } from 'react-router-dom';
import './UserProjectList.css';
import Project from './components/Project';

class UserProjects extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: [],
      loading: true,
      isModalOpen: false,
      isDeleteModalOpen: false,
      newProjectName: '',
      newProjectDescription: '',
      editingProject: null, // Для редактирования
      deletingProjectId: null, // Для удаления
      deletingProjectFilesCount: 0,
    };
  }

  componentDidMount() {
    this.fetchUserProjects();
  }

  fetchProjectFilesCount = async (projectId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/files/count/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      this.setState({
        deletingProjectFilesCount: response.data.count[0].count,
      });
    } catch (error) {
      console.error('Ошибка при получении количества файлов:', error);
    }
  };


  fetchUserProjects = async () => {
    const token = localStorage.getItem('token');
  
    if (!token) {
      alert('Пожалуйста, войдите в систему');
      return;
    }
    try {
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.id;
  
      const response = await axios.get(`http://localhost:5000/projects/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      this.setState({
        projects: response.data,
        loading: false,
      });
    } catch (error) {
      console.error('Ошибка при получении проектов пользователя:', error);
      this.setState({ loading: false });
    }
  };

  handleAddProject = async () => {
    const { newProjectName, newProjectDescription, editingProject } = this.state;
    const token = localStorage.getItem('token');
  
    if (!token) {
      alert('Пожалуйста, войдите в систему');
      return;
    }
  
    if (!newProjectName || !newProjectDescription) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.id;

      if (editingProject) {
        // Если редактируем, отправляем запрос на обновление
        const response = await axios.put(
          `http://localhost:5000/projects/${editingProject.id}`,
          {
            name: newProjectName,
            description: newProjectDescription,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Обновляем проект в состоянии
        this.setState((prevState) => ({
          projects: prevState.projects.map((project) =>
            project.id === editingProject.id ? response.data : project
          ),
          isModalOpen: false,
          newProjectName: '',
          newProjectDescription: '',
          editingProject: null,
        }));
        this.fetchUserProjects();
      } else {
        // Если создаем новый проект
        const response = await axios.post(
          'http://localhost:5000/projects',
          {
            name: newProjectName,
            description: newProjectDescription,
            userId: userId,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        this.setState((prevState) => ({
          projects: [...prevState.projects, response.data],
          isModalOpen: false,
          newProjectName: '',
          newProjectDescription: '',
        }));
      }
      this.fetchUserProjects();
    } catch (error) {
      console.error('Ошибка при добавлении или обновлении проекта:', error);
    }
  };

  openModal = () => {
    this.setState({ isModalOpen: true });
  };

  closeModal = () => {
    this.setState({ isModalOpen: false, newProjectName: '', newProjectDescription: '', editingProject: null });
  };

  openEditModal = (project) => {
    this.setState({
      editingProject: project,
      newProjectName: project.name,
      newProjectDescription: project.description,
      isModalOpen: true,
    });
  };

  openDeleteModal = (projectId) => {
    this.setState({ deletingProjectId: projectId, isDeleteModalOpen: true });
    this.fetchProjectFilesCount(projectId);
  };

  closeDeleteModal = () => {
    this.setState({ deletingProjectId: null, isDeleteModalOpen: false });
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  handleDeleteProject = async () => {
    const { deletingProjectId } = this.state;
    const token = localStorage.getItem('token');
  
    if (!token || !deletingProjectId) {
      return;
    }
  
    try {
      await axios.delete(`http://localhost:5000/projects/-delete${deletingProjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      this.setState((prevState) => ({
        projects: prevState.projects.filter((project) => project.id !== deletingProjectId),
        deletingProjectId: null,
        isDeleteModalOpen: false,
      }));
    } catch (error) {
      console.error('Ошибка при удалении проекта:', error);
    }
  };
  handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login'; // или используй history.push если ты используешь React Router v5
  };
  
  render() {
    const { projects, loading, isModalOpen, isDeleteModalOpen, newProjectName, newProjectDescription, editingProject } = this.state;

    if (loading) {
      return <p>Загрузка...</p>;
    }

    return (
      <div className="user-projects-container">
        <h1>Ваши проекты</h1>
        <button className="add-button" onClick={this.openModal}>Добавить проект</button>
        <button className="logout-button" onClick={this.handleLogout}>Выйти</button>
        <div className="project-list">
          {projects.length > 0 ? (
            projects.map((project) => (
              <Project
                key={project.id}
                project={project}
                onEdit={this.openEditModal}
                onDelete={this.openDeleteModal}
              />
            ))
          ) : (
            <p>У вас нет проектов</p>
          )}
        </div>
        <button className="back-button" onClick={() => window.history.back()}>Назад</button>

        {isModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <h2>{editingProject ? 'Редактировать проект' : 'Новый проект'}</h2>
              <input
                type="text"
                name="newProjectName"
                placeholder="Имя проекта"
                value={newProjectName}
                onChange={this.handleInputChange}
              />
              <textarea
                name="newProjectDescription"
                placeholder="Описание проекта"
                value={newProjectDescription}
                onChange={this.handleInputChange}
              />
              <div className="modal-actions">
                <button onClick={this.handleAddProject}>{editingProject ? 'Сохранить' : 'Добавить'}</button>
                <button onClick={this.closeModal}>Отмена</button>
              </div>
            </div>
          </div>
        )}

        {isDeleteModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <h2>Вы уверены, что хотите удалить проект?</h2>
              <p style={{ fontSize: '0.9rem' }}>При удалении проекта вы удалите ({this.state.deletingProjectFilesCount}) файлов</p>
              <div className="modal-actions">
                <button onClick={this.handleDeleteProject}>Удалить</button>
                <button onClick={this.closeDeleteModal}>Отмена</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default UserProjects;
