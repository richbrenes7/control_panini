import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { COUNTRY_GROUPS, SPECIAL_GROUPS, getCountryCodes, getStampType } from '../albumData';
import './AlbumChecklist.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

function AlbumChecklist({ instagram, onCollectionChanged }) {
  const [stamps, setStamps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [openCountries, setOpenCountries] = useState({});

  const stampsByCode = useMemo(() => {
    return stamps.reduce((acc, stamp) => {
      acc[stamp.stamp_code] = stamp;
      return acc;
    }, {});
  }, [stamps]);

  const loadStamps = useCallback(async () => {
    if (!instagram) return;
    const response = await axios.get(`${API_URL}/stamps/user/${instagram}`);
    setStamps(response.data);
  }, [instagram]);

  useEffect(() => {
    if (instagram) {
      loadStamps();
    }
  }, [loadStamps, instagram]);

  const toggleStamp = async (code) => {
    const existingStamp = stampsByCode[code];
    try {
      setLoading(true);
      if (existingStamp) {
        await axios.delete(`${API_URL}/stamps/remove`, {
          data: {
            user_id: instagram,
            stamp_id: existingStamp.id
          }
        });
      } else {
        await axios.post(`${API_URL}/stamps/add`, {
          user_id: instagram,
          stamp_code: code,
          type: getStampType(code),
          quantity: 1
        });
      }
      await loadStamps();
      if (onCollectionChanged) {
        onCollectionChanged();
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'No se pudo actualizar la estampa');
      setTimeout(() => setMessage(''), 3500);
    } finally {
      setLoading(false);
    }
  };

  const renderCodeButton = (code) => {
    const isOwned = Boolean(stampsByCode[code]);
    return (
      <button
        type="button"
        key={code}
        className={`stamp-cell ${isOwned ? 'owned' : ''}`}
        onClick={() => toggleStamp(code)}
        disabled={loading}
        aria-pressed={isOwned}
      >
        {code}
      </button>
    );
  };

  return (
    <div className="album-checklist">
      <div className="album-header">
        <div>
          <h2>Planilla de control</h2>
          <p>Marca cada casilla para registrar las estampas que ya tienes.</p>
        </div>
        <div className="album-counter">
          {stamps.length} / 995
        </div>
      </div>

      {message && <div className="message">{message}</div>}

      <section className="album-section">
        <h3>Especiales</h3>
        <div className="special-grid">
          {SPECIAL_GROUPS.map((group) => (
            <div key={group.id} className="special-group">
              <h4>{group.name}</h4>
              <div className="stamp-grid special-codes">
                {group.codes.map(renderCodeButton)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="album-section">
        <h3>Países</h3>
        <div className="country-grid">
          {COUNTRY_GROUPS.map((country) => {
            const countryCodes = getCountryCodes(country.prefix);
            const ownedCount = countryCodes.filter((code) => stampsByCode[code]).length;
            const isOpen = openCountries[country.prefix] || false;
            return (
              <article key={country.prefix} className="country-card">
                <div className="country-card-header" style={{cursor:'pointer'}} onClick={() => setOpenCountries(prev => ({...prev, [country.prefix]: !isOpen}))}>
                  <div>
                    <h4>{country.name}</h4>
                    <span>{country.prefix}</span>
                  </div>
                  <strong>{ownedCount}/20</strong>
                  <span style={{marginLeft:8}}>{isOpen ? '▲' : '▼'}</span>
                </div>
                {isOpen && (
                  <div className="stamp-grid">
                    {countryCodes.map(renderCodeButton)}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default AlbumChecklist;
