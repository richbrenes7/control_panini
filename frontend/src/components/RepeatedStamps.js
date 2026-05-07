import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import './RepeatedStamps.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

function RepeatedStamps({ userId }) {
  const [stampCode, setStampCode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [repeated, setRepeated] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadRepeated = useCallback(async () => {
    const response = await axios.get(`${API_URL}/repeated/user/${userId}`);
    setRepeated(response.data);
  }, [userId]);

  const loadMatches = useCallback(async () => {
    const response = await axios.get(`${API_URL}/repeated/matches/${userId}`);
    setMatches(response.data);
  }, [userId]);

  const refreshData = useCallback(async () => {
    if (!userId) {
      return;
    }
    try {
      setLoading(true);
      await Promise.all([loadRepeated(), loadMatches()]);
    } catch (error) {
      setMessage('No se pudo cargar la información de intercambio');
    } finally {
      setLoading(false);
    }
  }, [loadMatches, loadRepeated, userId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stampCode) {
      setMessage('Ingresa el código de la estampa');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/repeated/add`, {
        user_id: userId,
        stamp_code: stampCode,
        quantity: parseInt(quantity, 10),
        notes
      });
      setStampCode('');
      setQuantity(1);
      setNotes('');
      setMessage('Estampa repetida guardada');
      await refreshData();
    } catch (error) {
      setMessage('No se pudo guardar la estampa repetida');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (repeatedId) => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/repeated/${repeatedId}`, {
        data: { user_id: userId }
      });
      await refreshData();
    } catch (error) {
      setMessage('No se pudo eliminar la estampa repetida');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="repeated-container">
      <section className="repeated-panel">
        <h2>Estampas repetidas</h2>
        {message && <div className="message">{message}</div>}

        <form onSubmit={handleSubmit} className="repeated-form">
          <div className="form-group">
            <label>Código de estampa</label>
            <input
              type="text"
              value={stampCode}
              onChange={(event) => setStampCode(event.target.value.toUpperCase())}
              placeholder="ej: 001, CC1"
              maxLength="6"
              required
            />
          </div>

          <div className="form-group">
            <label>Cantidad</label>
            <input
              type="number"
              value={quantity}
              min="1"
              max="99"
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Notas</label>
            <input
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Estado, versión, detalle opcional"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar repetida'}
          </button>
        </form>

        <div className="repeated-list">
          {repeated.length === 0 ? (
            <p className="empty-state">Todavía no has registrado repetidas.</p>
          ) : (
            repeated.map((stamp) => (
              <div key={stamp.id} className="repeated-item">
                <div>
                  <strong>{stamp.stamp_code}</strong>
                  <span>Cantidad: {stamp.quantity}</span>
                  {stamp.notes && <small>{stamp.notes}</small>}
                </div>
                <button type="button" onClick={() => handleDelete(stamp.id)} disabled={loading}>
                  Eliminar
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="matches-panel">
        <div className="matches-header">
          <h2>Posibles intercambios</h2>
          <button type="button" onClick={refreshData} disabled={loading}>
            Actualizar
          </button>
        </div>

        {matches.length === 0 ? (
          <p className="empty-state">Aún no hay coincidencias mutuas.</p>
        ) : (
          <div className="match-list">
            {matches.map((match) => (
              <div key={match.user.id} className="match-card">
                <div className="match-user">
                  <h3>{match.user.name}</h3>
                  <a
                    href={`https://instagram.com/${match.user.instagram}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    @{match.user.instagram}
                  </a>
                </div>

                <div className="trade-columns">
                  <div>
                    <h4>Le puedes dar</h4>
                    <p>{match.you_can_give.map((stamp) => stamp.stamp_code).join(', ')}</p>
                  </div>
                  <div>
                    <h4>Te puede dar</h4>
                    <p>{match.you_can_receive.map((stamp) => stamp.stamp_code).join(', ')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default RepeatedStamps;
