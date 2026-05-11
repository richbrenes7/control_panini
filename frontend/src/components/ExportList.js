import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './ExportList.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

function formatRepeated(rows) {
  return rows
    .map((row) => `${row.stamp_code} x${row.quantity || 1}`)
    .join(', ');
}

function formatCodes(codes) {
  return codes.join(', ');
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function ExportList({ instagram }) {
  const [missing, setMissing] = useState([]);
  const [repeated, setRepeated] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const loadExportData = useCallback(async () => {
    if (!instagram) return;

    setLoading(true);
    setMessage('');
    try {
      const [missingResponse, repeatedResponse] = await Promise.all([
        axios.get(`${API_URL}/stamps/missing/${instagram}`),
        axios.get(`${API_URL}/repeated/user/${instagram}`)
      ]);

      setMissing(missingResponse.data?.missing_stamps || []);
      setRepeated(repeatedResponse.data || []);
    } catch (error) {
      setMessage(error.response?.data?.error || 'No se pudo preparar el listado');
    } finally {
      setLoading(false);
    }
  }, [instagram]);

  useEffect(() => {
    loadExportData();
  }, [loadExportData]);

  const sortedRepeated = useMemo(() => {
    return [...repeated].sort((a, b) => a.stamp_code.localeCompare(b.stamp_code));
  }, [repeated]);

  const exportText = useMemo(() => {
    const missingText = missing.length > 0 ? formatCodes(missing) : 'No tengo faltantes registradas.';
    const repeatedText = sortedRepeated.length > 0 ? formatRepeated(sortedRepeated) : 'No tengo repetidas registradas.';

    return [
      `Hola, soy @${instagram}. Estoy intercambiando estampas del Mundial 2026.`,
      '',
      `Las que me faltan (${missing.length}):`,
      missingText,
      '',
      `Las que tengo repetidas (${sortedRepeated.length} codigos):`,
      repeatedText,
      '',
      'Si tienes alguna que me falte y te sirve alguna repetida mia, escribeme para intercambiar.'
    ].join('\n');
  }, [instagram, missing, sortedRepeated]);

  const handleCopy = async () => {
    setCopied(false);
    setMessage('');
    try {
      await copyText(exportText);
      setCopied(true);
      setMessage('Listado copiado al portapapeles');
      setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      setMessage('No se pudo copiar automaticamente. Mantén presionado el texto para copiarlo.');
    }
  };

  return (
    <div className="export-container">
      <div className="export-header">
        <div>
          <h2>Exportar listado</h2>
          <p>Copia un mensaje listo para compartir con las estampas que te faltan y tus repetidas.</p>
        </div>
        <button type="button" onClick={loadExportData} disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <div className="export-summary">
        <div>
          <strong>{missing.length}</strong>
          <span>faltantes</span>
        </div>
        <div>
          <strong>{sortedRepeated.length}</strong>
          <span>codigos repetidos</span>
        </div>
        <div>
          <strong>{sortedRepeated.reduce((total, row) => total + Number(row.quantity || 0), 0)}</strong>
          <span>repetidas total</span>
        </div>
      </div>

      {message && <div className={`export-message ${copied ? 'success' : ''}`}>{message}</div>}

      <textarea
        className="export-preview"
        value={exportText}
        readOnly
        rows={14}
        aria-label="Listado para copiar"
      />

      <div className="export-actions">
        <button type="button" onClick={handleCopy} disabled={loading}>
          Copiar al portapapeles
        </button>
      </div>
    </div>
  );
}

export default ExportList;
