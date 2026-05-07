import React from 'react';
import AlbumChecklist from './AlbumChecklist';

function RepeatedStamps({ instagram, usePlanillaFormat }) {
  // Si usePlanillaFormat, reutiliza AlbumChecklist para ingresar repetidas
  return (
    <div className="repeated-container">
      <h2>Estampas repetidas</h2>
      <p>Marca aquí las estampas que tienes repetidas. El formato es igual al de la planilla principal.</p>
      <AlbumChecklist instagram={instagram} />
    </div>
  );
}

export default RepeatedStamps;
