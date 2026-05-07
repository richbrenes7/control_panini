import React, { useState } from 'react';
import './App.css';
import AlbumChecklist from './components/AlbumChecklist';
import AddStamp from './components/AddStamp';
import RepeatedStamps from './components/RepeatedStamps';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [instagram, setInstagram] = useState('');
  const [showMenu, setShowMenu] = useState({
    dashboard: true,
    album: false,
    add: false,
    repeated: false
  });

  // Maneja el despliegue de los menús
  const toggleMenu = (tab) => {
    setShowMenu((prev) => ({ ...prev, [tab]: !prev[tab] }));
    setActiveTab(tab);
  };

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
          <label htmlFor="instagram-input"><b>Nombre de usuario de Instagram</b></label>
          <input
            id="instagram-input"
            type="text"
            placeholder="Tu usuario de Instagram"
            value={instagram}
            onChange={e => setInstagram(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <div style={{ fontSize: '0.95em', color: '#555', marginBottom: 16 }}>
            Este campo es para guardar tu progreso y para que otros usuarios encuentren si tienes repetidas.
          </div>
        </div>

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
        </nav>

        <div className="tab-content">
          {activeTab === 'dashboard' && showMenu.dashboard && (
            <div>
              <h2>Bienvenido a tu álbum Panini</h2>
              <p>Selecciona una opción del menú para comenzar.</p>
            </div>
          )}
          {activeTab === 'album' && showMenu.album && (
            <AlbumChecklist
              instagram={instagram}
            />
          )}
          {activeTab === 'add' && showMenu.add && (
            <AddStamp
              instagram={instagram}
            />
          )}
          {activeTab === 'repeated' && showMenu.repeated && (
            <RepeatedStamps
              instagram={instagram}
              usePlanillaFormat={true}
            />
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
