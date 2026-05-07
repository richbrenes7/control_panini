import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { COUNTRY_GROUPS, SPECIAL_GROUPS, getCountryCodes } from '../albumData';
import './RepeatedStamps.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const ALL_CODES = [
  ...SPECIAL_GROUPS.flatMap((group) => group.codes),
  ...COUNTRY_GROUPS.flatMap((country) => getCountryCodes(country.prefix))
];

function normalizeCode(value) {
  return String(value || '').trim().toUpperCase();
}

function RepeatedStamps({ instagram, onRepeatedChanged }) {
  const [repeated, setRepeated] = useState([]);
  const [codeInput, setCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const repeatedByCode = useMemo(() => {
    return repeated.reduce((acc, row) => {
      acc[row.stamp_code] = row;
      return acc;
    }, {});
  }, [repeated]);

  const loadRepeated = useCallback(async () => {
    if (!instagram) return;
    const response = await axios.get(`${API_URL}/repeated/user/${instagram}`);
    setRepeated(response.data || []);
  }, [instagram]);

  useEffect(() => {
    if (instagram) {
      loadRepeated();
    }
  }, [instagram, loadRepeated]);

  const saveQuantity = async (code, quantity) => {
    const normalizedCode = normalizeCode(code);

    if (!ALL_CODES.includes(normalizedCode)) {
      setMessage('Código inválido para repetidas');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      if (quantity <= 0) {
        const existing = repeatedByCode[normalizedCode];
        if (existing) {
          await axios.delete(`${API_URL}/repeated/${existing.id}`, {
            data: { user_id: instagram }
          });
        }
      } else {
        await axios.post(`${API_URL}/repeated/add`, {
          user_id: instagram,
          stamp_code: normalizedCode,
          quantity
        });
      }

      await loadRepeated();
      if (onRepeatedChanged) {
        onRepeatedChanged();
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'No se pudo actualizar repetidas');
    } finally {
      setLoading(false);
    }
  };

  const addFromInput = async (event) => {
    event.preventDefault();
    const normalizedCode = normalizeCode(codeInput);
    if (!normalizedCode) return;

    const currentQty = repeatedByCode[normalizedCode]?.quantity || 0;
    await saveQuantity(normalizedCode, currentQty + 1);
    setCodeInput('');
  };

  const sortedRepeated = [...repeated].sort((a, b) => a.stamp_code.localeCompare(b.stamp_code));

  return (
    <div className="repeated-container">
      <h2>Estampas repetidas</h2>
      <p>En esta sección puedes tener múltiples de una misma estampa y ajustar la cantidad tras intercambios.</p>

      <form className="repeated-form" onSubmit={addFromInput}>
        <input
          type="text"
          placeholder="Código estampa, ej: MEX1, FWC3, CC2"
          value={codeInput}
          onChange={(event) => setCodeInput(normalizeCode(event.target.value))}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !codeInput.trim()}>Agregar +1</button>
      </form>

      {message && <div className="message">{message}</div>}

      {sortedRepeated.length === 0 ? (
        <p className="empty-state">No tienes repetidas registradas.</p>
      ) : (
        <div className="repeated-list">
          {sortedRepeated.map((row) => (
            <div key={row.id} className="repeated-item">
              <div className="repeated-code">{row.stamp_code}</div>
              <div className="repeated-qty">x{row.quantity}</div>
              <div className="repeated-actions">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => saveQuantity(row.stamp_code, (row.quantity || 0) + 1)}
                >
                  +1
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => saveQuantity(row.stamp_code, (row.quantity || 0) - 1)}
                >
                  -1
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => saveQuantity(row.stamp_code, 0)}
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RepeatedStamps;
