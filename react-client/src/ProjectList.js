import React, { Component } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Импортируем Link для создания ссылок

class ProjectList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: [],
      loading: true,
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

  render() {
    const { projects, loading } = this.state;

    if (loading) {
      return <p>Загрузка...</p>;
    }

    return (
      <div>
        <h1>Список проектов</h1>
        <ul>
          {projects.length > 0 ? (
            projects.map((project) => (
              <li key={project.id}>
                <strong>{project.name}</strong>
                <br />
                Описание: {project.description}
                <br />
                <Link to={`/files/${project.id}`}>Перейти к файлам проекта</Link>
              </li>
            ))
          ) : (
            <p>Проекты не найдены</p>
          )}
        </ul>
      </div>
    );
  }
}

export default ProjectList;
