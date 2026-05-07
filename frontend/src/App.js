import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './components/Dashboard';
import AddStamp from './components/AddStamp';
import History from './components/History';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
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
  }, []);

  // Cargar estadísticas del usuario
  const loadUserStats = async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/stats/${userId}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  // Crear nuevo usuario
  const handleCreateUser = async (userName, userEmail) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/users`, {
        name: userName,
        email: userEmail
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

  // Agregar estampa
  const handleAddStamp = async (stampCode, team, type, quantity, notes) => {
    if (!currentUser) {
      alert('Por favor selecciona un usuario primero');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/stamps/add`, {
        user_id: currentUser.id,
        stamp_code: stampCode,
        team_id: team,
        type: type,
        quantity: quantity,
        notes: notes
      });

      alert('Estampa agregada correctamente');
      loadUserStats(currentUser.id);
    } catch (error) {
      console.error('Error agregando estampa:', error);
      alert('Error al agregar estampa');
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
              <h2>Bienvenido, {currentUser.name}</h2>
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
                <AddStamp onAddStamp={handleAddStamp} loading={loading} />
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
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && email) {
      onSelectUser(name, email);
      setName('');
      setEmail('');
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
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
