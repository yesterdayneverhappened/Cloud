import { useState } from 'react';
import { Link } from 'react-router-dom'; // импортируем Link для перехода на страницу регистрации
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './AuthPage.css'; 

export default function AuthPage() {
    const location = useLocation();
    const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/login', { email, password, client_id: 1 });
      setMessage('Login successful!');
      localStorage.setItem('token', response.data.token);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Login</h2>
        {message && <p className="auth-message">{message}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
          />
          <button type="submit" className="auth-button">
            Login
          </button>
        </form>
        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register" className="auth-switch-button">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
