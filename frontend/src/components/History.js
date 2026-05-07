import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import './History.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function History({ userId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/history/${userId}`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadHistory();
    }
  }, [userId, loadHistory]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  if (loading) {
    return <div className="history-loading">Cargando historial...</div>;
  }

  return (
    <div className="history-container">
      <h2>Historial de Cambios</h2>
      
      {history.length === 0 ? (
        <p className="empty-history">No hay eventos en el historial</p>
      ) : (
        <div className="history-list">
          {history.map((event, index) => (
            <div key={index} className="history-item">
              <div className="history-action">
                <span className={`action-badge ${event.action.toLowerCase()}`}>
                  {event.action}
                </span>
              </div>
              <div className="history-details">
                <p className="history-code">Estampa: <strong>{event.stamp_code}</strong></p>
                <p className="history-quantity">Cantidad: {event.quantity}</p>
                {event.notes && <p className="history-notes">{event.notes}</p>}
              </div>
              <div className="history-time">
                {formatDate(event.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <button onClick={loadHistory} className="refresh-btn">
        Actualizar Historial
      </button>
    </div>
  );
}

export default History;
