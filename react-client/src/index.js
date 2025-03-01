import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Router, Routes, Route } from 'react-router-dom';
import App from './App';
import FileList from './FileList';
import AuthPage from './AuthPage'
import RegisterPage from './RegistredPage';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route exact path="/" element={<AuthPage />} />
    </Routes>
</BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
