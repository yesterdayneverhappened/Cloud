import React, { Component } from 'react';
import axios from 'axios';
import './UserProjectList.css'; // Подключаем стили

class UserProjects extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: [],
      loading: true,
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
      const response = await axios.get('http://localhost:5000/api/user-projects', {
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

  render() {
    const { projects, loading } = this.state;

    if (loading) {
      return <p>Загрузка...</p>;
    }

    return (
      <div className="user-projects-container">
        <h1>Ваши проекты</h1>
        <ul className="project-list">
          {projects.length > 0 ? (
            projects.map((project) => (
              <li key={project.id} className="project-item">
                <span className="project-name">{project.name}</span>
                <p className="project-description">{project.description}</p>
              </li>
            ))
          ) : (
            <p>У вас нет проектов</p>
          )}
        </ul>
        <button className="back-button" onClick={() => window.history.back()}>Назад</button>
      </div>
    );
  }
}

export default UserProjects;
