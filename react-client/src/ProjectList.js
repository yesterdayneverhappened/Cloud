import React, { Component } from 'react';
import axios from 'axios';
import './ProjectList.css';

class ProjectList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: [],
      filteredProjects: [],
      loading: true,
      searchTerm: '',
      searchByEmail: '',
      sortType: '',
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
        filteredProjects: response.data,
        loading: false,
      });
    } catch (error) {
      console.error('Ошибка при получении проектов:', error);
    }
  };

  handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    this.setState({ searchTerm }, this.filterProjects);
  };

  handleSearchByEmail = (e) => {
    const searchByEmail = e.target.value.toLowerCase();
    this.setState({ searchByEmail }, this.filterProjects);
  };

  handleSortChange = (e) => {
    this.setState({ sortType: e.target.value }, this.filterProjects);
  };

  filterProjects = () => {
    const { projects, searchTerm, searchByEmail, sortType } = this.state;
    let filteredProjects = [...projects];

    // Фильтр по названию проекта
    if (searchTerm) {
      filteredProjects = filteredProjects.filter((project) =>
        project.name.toLowerCase().includes(searchTerm)
      );
    }

    // Фильтр по почте
    if (searchByEmail) {
      filteredProjects = filteredProjects.filter((project) =>
        project.client_email.toLowerCase().includes(searchByEmail)
      );
    }

    // Сортировка
    switch (sortType) {
      case 'nameAsc':
        filteredProjects.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameDesc':
        filteredProjects.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'dateAsc':
        filteredProjects.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'dateDesc':
        filteredProjects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      default:
        break;
    }

    this.setState({ filteredProjects });
  };

  render() {
    const { filteredProjects, loading, searchTerm, searchByEmail, sortType } = this.state;

    if (loading) {
      return <p>Загрузка...</p>;
    }

    return (
      <div className="project-list-container">
        {/* Фильтры */}
        <div className="filter-section">
          <input
            type="text"
            value={searchTerm}
            onChange={this.handleSearch}
            placeholder="Поиск по названию проекта..."
            className="search-input"
          />

          <input
            type="text"
            value={searchByEmail}
            onChange={this.handleSearchByEmail}
            placeholder="Поиск по почте клиента..."
            className="search-input"
          />

          <select
            value={sortType}
            onChange={this.handleSortChange}
            className="sort-select"
          >
            <option value="">Сортировка</option>
            <option value="nameAsc">По имени (A-Z)</option>
            <option value="nameDesc">По имени (Z-A)</option>
            <option value="dateAsc">По дате (старые сначала)</option>
            <option value="dateDesc">По дате (новые сначала)</option>
          </select>
        </div>

        {/* Список проектов */}
        <div className="project-list">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <div key={project.id} className="project-item">
                <div className="project-card">
                  <h2>{project.name}</h2>
                  <p>{project.description}</p>
                  <p className="project-email">{project.client_email}</p>
                  <p className="project-date">Создано: {new Date(project.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          ) : (
            <p>Проекты не найдены</p>
          )}
        </div>

        <div>
          <button onClick={this.downloadLogFile}>Скачать лог-файл</button>
        </div>
      </div>
    );
  }
}

export default ProjectList;
