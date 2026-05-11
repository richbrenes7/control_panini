import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import AlbumChecklist from './components/AlbumChecklist';
import AddStamp from './components/AddStamp';
import RepeatedStamps from './components/RepeatedStamps';
import History from './components/History';
import Dashboard from './components/Dashboard';
import ExportList from './components/ExportList';

const API_URL = process.env.REACT_APP_API_URL || '/api';

function App() {
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [instagramInput, setInstagramInput] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [showMenu, setShowMenu] = useState({
    dashboard: true,
    album: false,
    add: false,
    repeated: false,
    export: false,
    history: false
  });

  useEffect(() => {
    if (!token) {
      delete axios.defaults.headers.common.Authorization;
      return;
    }

    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem('token', token);
  }, [token]);

  useEffect(() => {
    const bootstrapSession = async () => {
      if (!token) {
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/auth/me`);
        setCurrentUser(response.data.user);
      } catch (error) {
        setToken('');
        setCurrentUser(null);
        localStorage.removeItem('token');
      }
    };

    bootstrapSession();
  }, [token]);

  // Maneja el despliegue de los menús
  const toggleMenu = (tab) => {
    setShowMenu({
      dashboard: tab === 'dashboard',
      album: tab === 'album',
      add: tab === 'add',
      repeated: tab === 'repeated',
      export: tab === 'export',
      history: tab === 'history'
    });
    setActiveTab(tab);
  };

  const loadStats = async (instagram) => {
    if (!instagram) {
      setStats(null);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/stats/${instagram}`);
      setStats(response.data);
    } catch (error) {
      setStats(null);
    }
  };

  const clearAuthForm = () => {
    setName('');
    setEmail('');
    setInstagramInput('');
    setPassword('');
    setNewPassword('');
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage('');
    try {
      const payload = {
        password
      };
      const identifier = instagramInput.trim();
      if (identifier.includes('@')) {
        payload.email = identifier;
      } else {
        payload.instagram = identifier;
      }

      const response = await axios.post(`${API_URL}/auth/login`, payload);
      setToken(response.data.token);
      setCurrentUser(response.data.user);
      await loadStats(response.data.user.instagram);
      setAuthMode('login');
      clearAuthForm();
    } catch (error) {
      setAuthMessage(error.response?.data?.error || 'No se pudo iniciar sesión');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage('');
    try {
      const response = await axios.post(`${API_URL}/users`, {
        name,
        email,
        instagram: instagramInput,
        password
      });
      setToken(response.data.token);
      setCurrentUser(response.data.user);
      await loadStats(response.data.user.instagram);
      clearAuthForm();
    } catch (error) {
      setAuthMessage(error.response?.data?.error || 'No se pudo registrar el usuario');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage('');
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        instagram: instagramInput,
        new_password: newPassword
      });
      setAuthMessage(response.data.message || 'Contraseña actualizada, ahora puedes iniciar sesión');
      setAuthMode('login');
      setPassword('');
      setNewPassword('');
    } catch (error) {
      setAuthMessage(error.response?.data?.error || 'No se pudo restablecer la contraseña');
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    setCurrentUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common.Authorization;
    setStats(null);
  };

  useEffect(() => {
    if (currentUser?.instagram) {
      loadStats(currentUser.instagram);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <main className="auth-shell">
        <section className="login-card">
          <h1>
            {authMode === 'login' && 'Inicio de sesión'}
            {authMode === 'register' && 'Crear cuenta'}
            {authMode === 'reset' && 'Restablecer contraseña'}
          </h1>

          {authMessage && <p className="auth-note">{authMessage}</p>}

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="login-form">
              <div className="login-field">
                <span className="field-icon">@</span>
                <input
                  type="text"
                  placeholder="Instagram o correo"
                  value={instagramInput}
                  onChange={(event) => setInstagramInput(event.target.value)}
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

              <button type="submit" disabled={authLoading}>
                {authLoading ? 'CARGANDO...' : 'LOGIN'}
              </button>
            </form>
          )}

          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="login-form">
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

              <div className="login-field">
                <span className="field-icon">@</span>
                <input
                  type="email"
                  placeholder="Correo"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="login-field">
                <span className="field-icon">IG</span>
                <input
                  type="text"
                  placeholder="Instagram"
                  value={instagramInput}
                  onChange={(event) => setInstagramInput(event.target.value)}
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

              <button type="submit" disabled={authLoading}>
                {authLoading ? 'CARGANDO...' : 'CREAR CUENTA'}
              </button>
            </form>
          )}

          {authMode === 'reset' && (
            <form onSubmit={handleResetPassword} className="login-form">
              <div className="login-field">
                <span className="field-icon">@</span>
                <input
                  type="email"
                  placeholder="Correo"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="login-field">
                <span className="field-icon">IG</span>
                <input
                  type="text"
                  placeholder="Instagram"
                  value={instagramInput}
                  onChange={(event) => setInstagramInput(event.target.value)}
                  required
                />
              </div>

              <div className="login-field">
                <input
                  type="password"
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
                <span className="field-icon lock">#</span>
              </div>

              <button type="submit" disabled={authLoading}>
                {authLoading ? 'CARGANDO...' : 'ACTUALIZAR'}
              </button>
            </form>
          )}

          <div className="auth-actions">
            <button type="button" onClick={() => setAuthMode('login')}>Login</button>
            <button type="button" onClick={() => setAuthMode('register')}>Crear usuario</button>
            <button type="button" onClick={() => setAuthMode('reset')}>Olvidé clave</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>Control Panini - Mundial 2026</h1>
          <p>Gestiona tu colección de estampas</p>
          <p>Sesión: @{currentUser.instagram}</p>
          <button className="tab" onClick={logout} style={{ marginTop: 12 }}>Cerrar sesión</button>
        </div>
      </header>

      <div className="container">
        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => toggleMenu('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`tab ${activeTab === 'album' ? 'active' : ''}`}
            onClick={() => toggleMenu('album')}
          >
            Planilla
          </button>
          <button
            className={`tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => toggleMenu('add')}
          >
            Agregar Estampa
          </button>
          <button
            className={`tab ${activeTab === 'repeated' ? 'active' : ''}`}
            onClick={() => toggleMenu('repeated')}
          >
            Repetidas
          </button>
          <button
            className={`tab ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => toggleMenu('export')}
          >
            Exportar
          </button>
          <button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => toggleMenu('history')}
          >
            Historial
          </button>
        </nav>

        <div className="tab-content">
          {activeTab === 'dashboard' && showMenu.dashboard && (
            <Dashboard stats={stats} />
          )}
          {activeTab === 'album' && showMenu.album && (
            <AlbumChecklist
              instagram={currentUser.instagram}
              onCollectionChanged={() => loadStats(currentUser.instagram)}
            />
          )}
          {activeTab === 'add' && showMenu.add && (
            <AddStamp
              instagram={currentUser.instagram}
              onStampAdded={() => loadStats(currentUser.instagram)}
            />
          )}
          {activeTab === 'repeated' && showMenu.repeated && (
            <RepeatedStamps
              instagram={currentUser.instagram}
              usePlanillaFormat={true}
              onRepeatedChanged={() => loadStats(currentUser.instagram)}
            />
          )}
          {activeTab === 'export' && showMenu.export && (
            <ExportList instagram={currentUser.instagram} />
          )}
          {activeTab === 'history' && showMenu.history && (
            <History userId={currentUser.instagram} />
          )}
        </div>

        <p className="free-version-note">
          Versión gratuita para coleccionistas. Si te ayuda, puedes apoyar el proyecto desde Donaciones.
        </p>
      </div>
    </div>
  );
}

export default App;
