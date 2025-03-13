import React from 'react'
import '../styles-for-compontnts/Project.css'

export default function Project({ name, description }) {
  return (
    <div className='project-item'>
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
