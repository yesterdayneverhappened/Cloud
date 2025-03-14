import React, { Component } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './UserProjectList.css';
import Project from './components/Project';

class UserProjects extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: [],
      loading: true,
      isModalOpen: false,
      newProjectName: '',
      newProjectDescription: '',
    };
  }

  componentDidMount() {
    this.fetchUserProjects();
  }

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
    const { newProjectName, newProjectDescription } = this.state;
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
    } catch (error) {
      console.error('Ошибка при добавлении проекта:', error);
    }
  };
  
  openModal = () => {
    this.setState({ isModalOpen: true });
  };

  closeModal = () => {
    this.setState({ isModalOpen: false, newProjectName: '', newProjectDescription: '' });
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  render() {
    const { projects, loading, isModalOpen, newProjectName, newProjectDescription } = this.state;

    if (loading) {
      return <p>Загрузка...</p>;
    }

    return (
      <div className="user-projects-container">
        <h1>Ваши проекты</h1>
        <button className="add-button" onClick={this.openModal}>Добавить проект</button>
        <ul className="project-list">
          {projects.length > 0 ? (
            projects.map((project) => (
              <Project name={project.name} description={project.description} id={project.id} />
            ))
          ) : (
            <p>У вас нет проектов</p>
          )}
        </ul>
        <button className="back-button" onClick={() => window.history.back()}>Назад</button>

        {isModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <h2>Новый проект</h2>
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
                <button onClick={this.handleAddProject}>Добавить</button>
                <button onClick={this.closeModal}>Отмена</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default UserProjects;
