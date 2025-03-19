import React, { Component } from 'react';
import axios from 'axios';
import './ProjectList.css';

class ProjectList extends Component {
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
    this.fetchProjects();
  }

  fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/projects');
      this.setState({
        projects: response.data,
        loading: false,
      });
    } catch (error) {
      console.error('Ошибка при получении проектов:', error);
    }
  };

  downloadLogFile = async () => {
    try {
      const response = await axios.get('http://localhost:5000/files/download-log', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'log.txt');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Ошибка при скачивании лог-файла:', error);
    }
  };

  render() {
    const { projects, loading } = this.state;

    if (loading) {
      return <p>Загрузка...</p>;
    }

    return (
      <div className="project-list-container">
        <div className="add-project-button">
          <button onClick={this.openModal}>Добавить проект</button>
        </div>

        <h1>Список проектов</h1>

        <ul>
          {projects.length > 0 ? (
            projects.map((project) => (
              <div key={project.id} className="project-item">
                <li>
                  <strong>{project.name}</strong>
                  <br />
                  Описание: {project.description}
                </li>
              </div>
            ))
          ) : (
            <p>Проекты не найдены</p>
          )}
        </ul>

        {/* Кнопка для скачивания лог-файла */}
        <div>
          <button onClick={this.downloadLogFile}>Скачать лог-файл</button>
        </div>
      </div>
    );
  }
}

export default ProjectList;
