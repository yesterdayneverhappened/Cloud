import React, { Component } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Импортируем Link для создания ссылок
import './ProjectList.css'; // Подключаем стили (создайте этот файл)

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

  handleAddProject = async () => {
    const { newProjectName, newProjectDescription } = this.state;

    if (!newProjectName || !newProjectDescription) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/add-projects', {
        name: newProjectName,
        description: newProjectDescription,
      });

      this.setState((prevState) => ({
        projects: [...prevState.projects, response.data],
        isModalOpen: false,
        newProjectName: '',
        newProjectDescription: '',
      }));
    } catch (error) {
      console.error('Ошибка при добавлении проекта:', error);
    }

    this.fetchProjects();
  };

  deleteProject = async (id) => {
    try{
      const response = await axios.delete(`http://localhost:5000/delete-project/${id}`);
      console.log("Проект удалён");
      this.fetchProjects()
    } catch (err) {
      console.error('Ошибка при удалении проекта:', err);
    }
  }
  render() {
    const { projects, loading, isModalOpen, newProjectName, newProjectDescription } = this.state;

    if (loading) {
      return <p>Загрузка...</p>;
    }

    return (
      <div>
        <div>
          <button onClick={this.openModal}>Добавить</button>
        </div>

        <h1>Список проектов</h1>
        <ul>
          {projects.length > 0 ? (
            projects.map((project) => (
              <div>
                <li key={project.id}>
                  <strong>{project.name}</strong>
                  <br />
                  Описание: {project.description}
                  <br />
                  <Link to={`/files/${project.id}`}>Перейти к файлам проекта</Link>
                </li>
                <button onClick={() => this.deleteProject(project.id)}>Удалить</button>
              </div>
            ))
          ) : (
            <p>Проекты не найдены</p>
          )}
        </ul>

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

export default ProjectList;
