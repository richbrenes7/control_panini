import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './components/Dashboard';
import AddStamp from './components/AddStamp';
import History from './components/History';
import RepeatedStamps from './components/RepeatedStamps';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Cargar usuario del localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      loadUserStats(JSON.parse(savedUser).id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar estadísticas del usuario
  const loadUserStats = useCallback(async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/stats/${userId}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }, []);

  // Crear nuevo usuario
  const handleCreateUser = async (userName, instagram) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/users`, {
        name: userName,
        instagram
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

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>🏆 Control Panini - Mundial 2026</h1>
          <p>Gestiona tu colección de estampas</p>
        </div>
      </header>

      <div className="container">
        {!currentUser ? (
          <UserSelector onSelectUser={handleCreateUser} loading={loading} />
        ) : (
          <>
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
                📊 Dashboard
              </button>
              <button
                className={`tab ${activeTab === 'add' ? 'active' : ''}`}
                onClick={() => setActiveTab('add')}
              >
                ➕ Agregar Estampa
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
                📜 Historial
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
          </>
        )}
      </div>
    </div>
  );
}

function UserSelector({ onSelectUser, loading }) {
  const [name, setName] = useState('');
  const [instagram, setInstagram] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && instagram) {
      onSelectUser(name, instagram);
      setName('');
      setInstagram('');
    }
  };

  return (
    <div className="user-selector">
      <div className="selector-card">
        <h2>Nuevo Usuario</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Usuario de Instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
