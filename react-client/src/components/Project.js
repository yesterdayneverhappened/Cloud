import React from 'react'
import '../styles-for-compontnts/Project.css'
import { useNavigate } from 'react-router-dom';
export default function Project({ name, description, id }) {
    const navigate = useNavigate();
  return (
    <div className='project-item' onClick={() => navigate(`/projects/${id}`)}>
        <div className='project-info'>
            <p className='project-name'>{name}</p>
            <p className='project-description'>{description}</p>
        </div>
        <div className='project-info'>
            <button className='back-button'>Редактировать</button>
            <button className='back-button:hover'>Удалить</button>
        </div>
    </div>
  )
}
