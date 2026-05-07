import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './components/Dashboard';
import AddStamp from './components/AddStamp';
import History from './components/History';
import RepeatedStamps from './components/RepeatedStamps';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const DONATION_URL = process.env.REACT_APP_DONATION_URL || 'https://www.buymeacoffee.com/';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const loadUserStats = useCallback(async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/stats/${userId}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser(parsedUser);
      loadUserStats(parsedUser.id);
    }
  }, [loadUserStats]);

  const handleLogin = async (instagram, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/login`, {
        instagram,
        password
      });

      const user = response.data;
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      loadUserStats(user.id);
    } catch (error) {
      console.error('Error iniciando sesión:', error);
      alert('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userName, instagram, password) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/users`, {
        name: userName,
        instagram,
        password
      });

      const newUser = response.data[0];
      setCurrentUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      loadUserStats(newUser.id);
    } catch (error) {
      console.error('Error creando usuario:', error);
      alert('Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="App auth-app">
        <AuthPanel
          onLogin={handleLogin}
          onRegister={handleCreateUser}
          loading={loading}
          donationUrl={DONATION_URL}
        />
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>Control Panini - Mundial 2026</h1>
          <p>Gestiona tu colección de estampas</p>
        </div>
      </header>

      <div className="container">
        <div className="user-info">
          <div>
            <h2>Bienvenido, {currentUser.name}</h2>
            {currentUser.instagram && (
              <p className="instagram-handle">@{currentUser.instagram}</p>
            )}
          </div>
          <button
            className="btn-logout"
            onClick={() => {
              setCurrentUser(null);
              localStorage.removeItem('currentUser');
              setStats(null);
            }}
          >
            Cambiar usuario
          </button>
        </div>

        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Agregar Estampa
          </button>
          <button
            className={`tab ${activeTab === 'repeated' ? 'active' : ''}`}
            onClick={() => setActiveTab('repeated')}
          >
            Repetidas
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Historial
          </button>
        </nav>

        <div className="tab-content">
          {activeTab === 'dashboard' && stats && (
            <Dashboard stats={stats} />
          )}
          {activeTab === 'add' && (
            <AddStamp
              userId={currentUser.id}
              onStampAdded={() => loadUserStats(currentUser.id)}
            />
          )}
          {activeTab === 'repeated' && (
            <RepeatedStamps userId={currentUser.id} />
          )}
          {activeTab === 'history' && (
            <History userId={currentUser.id} />
          )}
        </div>

        <p className="free-version-note">
          Versión gratuita para coleccionistas. Si te ayuda, puedes apoyar el proyecto desde Donaciones.
        </p>
      </div>
    </div>
  );
}

function AuthPanel({ onLogin, onRegister, loading, donationUrl }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (mode === 'login' && instagram && password) {
      onLogin(instagram, password);
      return;
    }

    if (mode === 'register' && name && instagram && password) {
      onRegister(name, instagram, password);
      setName('');
      setInstagram('');
      setPassword('');
    }
  };

  return (
    <main className="auth-shell">
      <section className="login-card">
        <h1>USER LOGIN</h1>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
            <div className="login-field">
              <span className="field-icon">ID</span>
              <input
                type="text"
                placeholder="Nombre"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          )}

          <div className="login-field">
            <span className="field-icon">@</span>
            <input
              type="text"
              placeholder="Usuario de Instagram"
              value={instagram}
              onChange={(event) => setInstagram(event.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <span className="field-icon lock">#</span>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'CARGANDO...' : mode === 'login' ? 'LOGIN' : 'CREAR CUENTA'}
          </button>
        </form>

        <div className="auth-actions">
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Crear usuario' : 'Ya tengo usuario'}
          </button>
          <a href={donationUrl} target="_blank" rel="noreferrer">
            Donaciones
          </a>
        </div>

        <div className="license-badge">Bajo licencia</div>
      </section>

      <p className="auth-note">
        Versión gratuita para controlar tu álbum y encontrar intercambios por Instagram.
      </p>
    </main>
  );
}

export default App;
