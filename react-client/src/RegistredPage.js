import { useState } from 'react';
import axios from 'axios';
import './AuthPage.css';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/users/register', { name, email, password });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Ошибка регистрации');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Регистрация</h2>
        {message && <p className="auth-message">{message}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          <input type="text" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} required className="auth-input" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="auth-input" />
          <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required className="auth-input" />
          <button type="submit" className="auth-button">Зарегистрироваться</button>
        </form>
      </div>
    </div>
  );
}
