import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { COUNTRY_GROUPS, SPECIAL_GROUPS, getCountryCodes } from '../albumData';
import './AlbumChecklist.css';
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
  const [matches, setMatches] = useState([]);
  const [codeInput, setCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [openSpecialGroups, setOpenSpecialGroups] = useState({});
  const [openCountries, setOpenCountries] = useState({});
  const [selectedCode, setSelectedCode] = useState('');

  const repeatedByCode = useMemo(() => {
    return repeated.reduce((acc, row) => {
      acc[row.stamp_code] = row;
      return acc;
    }, {});
  }, [repeated]);

  const repeatedTotal = useMemo(() => {
    return repeated.reduce((total, row) => total + Number(row.quantity || 0), 0);
  }, [repeated]);

  const loadRepeated = useCallback(async () => {
    if (!instagram) return [];
    const response = await axios.get(`${API_URL}/repeated/user/${instagram}`);
    setRepeated(response.data || []);
    return response.data || [];
  }, [instagram]);

  const loadMatches = useCallback(async () => {
    if (!instagram) return [];
    const response = await axios.get(`${API_URL}/repeated/matches/${instagram}`);
    setMatches(response.data || []);
    return response.data || [];
  }, [instagram]);

  const refreshData = useCallback(async () => {
    await Promise.all([loadRepeated(), loadMatches()]);
  }, [loadRepeated, loadMatches]);

  useEffect(() => {
    if (instagram) {
      refreshData();
    }
  }, [instagram, refreshData]);

  const saveQuantity = async (code, quantity) => {
    const normalizedCode = normalizeCode(code);

    if (!ALL_CODES.includes(normalizedCode)) {
      setMessage('Codigo invalido para repetidas');
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

      await refreshData();
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
    setSelectedCode(normalizedCode);
  };

  const renderRepeatedCell = (code) => {
    const quantity = Number(repeatedByCode[code]?.quantity || 0);
    const isSelected = selectedCode === code;
    return (
      <button
        type="button"
        key={code}
        className={`stamp-cell repeated-cell ${quantity > 0 ? 'owned repeated-owned' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={() => setSelectedCode(code)}
        disabled={loading}
        aria-pressed={isSelected}
        aria-label={`Seleccionar repetida ${code}`}
      >
        <span>{code}</span>
        {quantity > 0 && <span className="stamp-qty-badge">x{quantity}</span>}
      </button>
    );
  };

  const renderMatchCodes = (codes) => {
    if (!codes || codes.length === 0) {
      return <span className="match-empty">Sin coincidencias</span>;
    }

    return codes.map((stamp) => (
      <span key={`${stamp.stamp_code}-${stamp.quantity}`} className="match-code">
        {stamp.stamp_code} x{stamp.quantity || 1}
      </span>
    ));
  };

  const renderSelectedControls = () => {
    if (!selectedCode) return null;

    return (
      <section className="selected-repeated-panel">
        <div>
          <span className="selected-label">Seleccionada</span>
          <h3>{selectedCode}</h3>
          <p>Tienes {selectedQuantity} repetida{selectedQuantity === 1 ? '' : 's'} de esta estampa.</p>
        </div>
        <div className="selected-actions">
          <button
            type="button"
            disabled={loading}
            onClick={() => saveQuantity(selectedCode, selectedQuantity + 1)}
          >
            Agregar +1
          </button>
          <button
            type="button"
            disabled={loading || selectedQuantity <= 0}
            onClick={() => saveQuantity(selectedCode, selectedQuantity - 1)}
          >
            Eliminar -1
          </button>
          <button
            type="button"
            className="danger"
            disabled={loading || selectedQuantity <= 0}
            onClick={() => saveQuantity(selectedCode, 0)}
          >
            Quitar todas
          </button>
        </div>
      </section>
    );
  };

  const sortedRepeated = [...repeated].sort((a, b) => a.stamp_code.localeCompare(b.stamp_code));
  const selectedQuantity = Number(repeatedByCode[selectedCode]?.quantity || 0);

  return (
    <div className="repeated-container album-checklist">
      <div className="album-header repeated-header">
        <div>
          <h2>Estampas repetidas</h2>
          <p>Controla tus repetidas en formato de planilla y revisa con quien puedes intercambiar.</p>
        </div>
        <div className="repeated-counters">
          <span>{repeatedTotal} repetidas</span>
          <span>{repeated.length} codigos</span>
          <span>{matches.length} matches</span>
        </div>
      </div>

      <section className="repeated-step">
        <div className="step-label">Paso 1</div>
        <div>
          <h3>Control de repetidas</h3>
          <p>Pulsa una casilla para ver su conteo y ajustar cuantas repetidas tienes.</p>
        </div>
      </section>

      <form className="repeated-form" onSubmit={addFromInput}>
        <input
          type="text"
          placeholder="Codigo estampa, ej: MEX1, FWC3, CC2"
          value={codeInput}
          onChange={(event) => setCodeInput(normalizeCode(event.target.value))}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !codeInput.trim()}>Agregar +1</button>
      </form>

      {message && <div className="message">{message}</div>}

      <section className="album-section">
        <h3>Especiales</h3>
        <div className="special-grid">
          {SPECIAL_GROUPS.map((group) => {
            const groupTotal = group.codes.reduce(
              (total, code) => total + Number(repeatedByCode[code]?.quantity || 0),
              0
            );
            const groupUnique = group.codes.filter((code) => repeatedByCode[code]).length;
            const isOpen = openSpecialGroups[group.id] ?? groupTotal > 0;
            return (
              <article key={group.id} className="special-group repeated-group">
                <button
                  type="button"
                  className="country-card-header repeated-country-toggle"
                  onClick={() => setOpenSpecialGroups((prev) => ({ ...prev, [group.id]: !isOpen }))}
                >
                  <div>
                    <h4>{group.name}</h4>
                    <span>{group.id === 'collectors' ? 'CC' : 'FWC'}</span>
                  </div>
                  <strong>{groupUnique}/{group.codes.length} | x{groupTotal}</strong>
                  <span>{isOpen ? '-' : '+'}</span>
                </button>
                {isOpen && (
                  <>
                    <div className="stamp-grid special-codes">
                      {group.codes.map(renderRepeatedCell)}
                    </div>
                    {group.codes.includes(selectedCode) && renderSelectedControls()}
                  </>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="album-section">
        <h3>Paises</h3>
        <div className="country-grid">
          {COUNTRY_GROUPS.map((country) => {
            const countryCodes = getCountryCodes(country.prefix);
            const repeatedCount = countryCodes.reduce(
              (total, code) => total + Number(repeatedByCode[code]?.quantity || 0),
              0
            );
            const repeatedUnique = countryCodes.filter((code) => repeatedByCode[code]).length;
            const isOpen = openCountries[country.prefix] ?? repeatedCount > 0;

            return (
              <article key={country.prefix} className="country-card">
                <button
                  type="button"
                  className="country-card-header repeated-country-toggle"
                  onClick={() => setOpenCountries((prev) => ({ ...prev, [country.prefix]: !isOpen }))}
                >
                  <div>
                    <h4>{country.name}</h4>
                    <span>{country.prefix}</span>
                  </div>
                  <strong>{repeatedUnique}/20 | x{repeatedCount}</strong>
                  <span>{isOpen ? '-' : '+'}</span>
                </button>
                {isOpen && (
                  <>
                    <div className="stamp-grid">
                      {countryCodes.map(renderRepeatedCell)}
                    </div>
                    {countryCodes.includes(selectedCode) && renderSelectedControls()}
                  </>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="quick-adjust">
        <h3>Resumen de repetidas</h3>
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
      </section>

      <section className="repeated-step exchange-step">
        <div className="step-label">Paso 2</div>
        <div>
          <h3>Recuento y matcheo</h3>
          <p>Estos usuarios tienen repetidas que te faltan y tambien necesitan repetidas tuyas.</p>
        </div>
      </section>

      <section className="matches-panel">
        {matches.length === 0 ? (
          <p className="empty-state">Aun no hay matches de intercambio. Agrega repetidas y marca tu planilla para cruzar datos.</p>
        ) : (
          <div className="matches-grid">
            {matches.map((match) => {
              const instagramUser = match.user?.instagram || match.user?.name || 'usuario';
              return (
                <article key={match.user?.id || instagramUser} className="match-card">
                  <div className="match-user">
                    <div>
                      <h4>@{instagramUser}</h4>
                      <span>{match.user?.name || instagramUser}</span>
                    </div>
                    <a
                      href={`https://instagram.com/${instagramUser.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Instagram
                    </a>
                  </div>
                  <div className="match-columns">
                    <div>
                      <h5>Te puede dar</h5>
                      <div className="match-code-list">{renderMatchCodes(match.you_can_receive)}</div>
                    </div>
                    <div>
                      <h5>Le sirven tuyas</h5>
                      <div className="match-code-list">{renderMatchCodes(match.you_can_give)}</div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default RepeatedStamps;
