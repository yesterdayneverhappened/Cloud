import React, { Component } from 'react';
import axios from 'axios';
import './ProjectList.css';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';  // Импортируем библиотеку для работы с Excel

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

    // Фильтры
    if (searchTerm) {
      filteredProjects = filteredProjects.filter((project) =>
        project.name.toLowerCase().includes(searchTerm)
      );
    }
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

  // Функция для создания и скачивания Excel файла
  exportToExcel = () => {
    const { filteredProjects } = this.state;

    // Преобразуем данные в формат для таблицы Excel
    const data = filteredProjects.map(project => ({
      "Client Name": project.client_name,
      "Client Email": project.client_email,
      "Project Name": project.name,
      "Total Size (bytes)": project.total_size,
      "Created At": new Date(project.created_at).toLocaleDateString(),
    }));

    // Создание таблицы Excel
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Project Report');

    // Генерация файла и скачивание
    XLSX.writeFile(wb, 'project_report.xlsx');
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
          <Link to={`/charts`}>
            <button>Диаграммы</button>
          </Link>
          <div>
            <button onClick={this.exportToExcel}>Скачать отчет в Excel</button>
          </div>
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
                  <p className="project-size">Занимаемое место: {project.total_size} байт</p> {/* Добавил отображение размера */}
                </div>
              </div>
            ))
          ) : (
            <p>Проекты не найдены</p>
          )}
        </div>
      </div>
    );
  }
}

export default ProjectList;
