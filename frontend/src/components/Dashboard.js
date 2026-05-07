import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

function Dashboard({ stats }) {
  if (!stats) {
    return <div className="dashboard-loading">Cargando estadísticas...</div>;
  }

  const completionPercent = stats.completion_percent || 0;
  const categoryData = [
    { name: 'Especial (A)', value: stats.by_category?.A || 0 },
    { name: 'Grupal/Escudo (B)', value: stats.by_category?.B || 0 },
    { name: 'Jugador (C)', value: stats.by_category?.C || 0 }
  ];

  const typeData = [
    { name: 'Especiales', value: stats.by_type?.special || 0 },
    { name: 'Escudos', value: stats.by_type?.shield || 0 },
    { name: 'Fotos Grupales', value: stats.by_type?.group || 0 },
    { name: 'Jugadores', value: stats.by_type?.player || 0 }
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  return (
    <div className="dashboard-container">
      <h2>Mi Colección de Estampas</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Coleccionadas</h3>
          <p className="stat-value">{stats.total_collected}</p>
        </div>

        <div className="stat-card">
          <h3>Estampas Únicas</h3>
          <p className="stat-value">{stats.unique_stamps}</p>
        </div>

        <div className="stat-card">
          <h3>Progreso</h3>
          <p className="stat-value">{completionPercent.toFixed(1)}%</p>
        </div>

        <div className="stat-card">
          <h3>Faltantes</h3>
          <p className="stat-value">{stats.missing_count || 980}</p>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${Math.min(completionPercent, 100)}%` }}
          ></div>
        </div>
        <p className="progress-text">{completionPercent.toFixed(1)}% completado</p>
      </div>

      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>Estampas por Categoría ABC</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrapper">
          <h3>Estampas por Tipo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="category-details">
        <h3>Desglose por Categoría</h3>
        <div className="category-grid">
          <div className="category-card category-a">
            <h4>Categoría A - Especiales</h4>
            <p className="category-count">{stats.by_category?.A || 0} estampas</p>
            <small>00-08, 09-19, CC1-CC14</small>
          </div>
          <div className="category-card category-b">
            <h4>Categoría B - Grupal/Escudo</h4>
            <p className="category-count">{stats.by_category?.B || 0} estampas</p>
            <small>Escudos y fotos grupales</small>
          </div>
          <div className="category-card category-c">
            <h4>Categoría C - Jugadores</h4>
            <p className="category-count">{stats.by_category?.C || 0} estampas</p>
            <small>Estampas de jugadores</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
