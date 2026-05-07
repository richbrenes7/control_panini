import React, { useState } from 'react';
import axios from 'axios';
import './AddStamp.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const TEAMS = [
  { id: 1, name: 'México', country: 'MEX' },
  { id: 2, name: 'Canadá', country: 'CAN' },
  { id: 3, name: 'Estados Unidos', country: 'USA' },
  // ... agregar los 48 equipos
];

const STAMP_TYPES = [
  { value: 'special', label: 'Especial' },
  { value: 'shield', label: 'Escudo' },
  { value: 'group', label: 'Foto Grupal' },
  { value: 'player', label: 'Jugador' }
];

function AddStamp({ userId, onStampAdded }) {
  const [stampCode, setStampCode] = useState('');
  const [teamId, setTeamId] = useState(1);
  const [type, setType] = useState('player');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stampCode || !userId) {
      setMessage('Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/stamps/add`, {
        user_id: userId,
        stamp_code: stampCode,
        team_id: teamId,
        type: type,
        quantity: parseInt(quantity)
      });

      setMessage('Estampa agregada correctamente');
      setStampCode('');
      setQuantity(1);
      
      if (onStampAdded) {
        onStampAdded();
      }

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error al agregar estampa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-stamp-container">
      <h2>Agregar Estampa</h2>
      
      {message && <div className="message">{message}</div>}
      
      <form onSubmit={handleSubmit} className="stamp-form">
        <div className="form-group">
          <label>Código de Estampa:</label>
          <input
            type="text"
            value={stampCode}
            onChange={(e) => setStampCode(e.target.value.toUpperCase())}
            placeholder="ej: FWC, MEX1, FWC9, CC1"
            maxLength="6"
          />
          <small>Ej: FWC, 00, FWC1-FWC19, MEX1-MEX20, CC1-CC14</small>
        </div>

        <div className="form-group">
          <label>Equipo:</label>
          <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            {TEAMS.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Tipo:</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {STAMP_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Cantidad:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            max="10"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Agregando...' : 'Agregar Estampa'}
        </button>
      </form>
    </div>
  );
}

export default AddStamp;
