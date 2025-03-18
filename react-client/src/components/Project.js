import React from 'react';
import '../styles-for-compontnts/File.css';

export default function Project({ project, onEdit, onDelete }) {
  return (
    <div className="project-item">
      <div className="project-info">
        <h3 className="project-name">{project.name}</h3>
        <p className="project-description">{project.description}</p>
      </div>
      <div className="project-info">
        <button className="back-button" onClick={() => onEdit(project)}>
          Редактировать
        </button>
        <button
          className="back-button"
          onClick={() => onDelete(project.id)}
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
