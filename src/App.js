import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [favorites, setFavorites] = useState([]);

  const buses = [
    { id: 1, line: '1', name: 'Valletta - Paola', eta: 3 },
    { id: 2, line: '2', name: 'Sliema - Mosta', eta: 8 },
    { id: 3, line: '12', name: 'St Julians - Valletta', eta: 5 },
    { id: 4, line: '3', name: 'Naxxar - Msida', eta: 12 },
  ];

  const toggleFavorite = (bus) => {
    if (favorites.find(b => b.id === bus.id)) {
      setFavorites(favorites.filter(b => b.id !== bus.id));
    } else {
      setFavorites([...favorites, bus]);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🚌 Malta Transport</h1>
      </div>

      <div style={styles.content}>
        {buses.map(bus => (
          <div key={bus.id} style={styles.busCard}>
            <div style={styles.busLine}>
              <span style={styles.busLineText}>{bus.line}</span>
            </div>
            <div style={styles.busDetails}>
              <p style={styles.busName}>{bus.name}</p>
              <p style={styles.busEta}>ETA: {bus.eta} mins</p>
            </div>
            <button
              onClick={() => toggleFavorite(bus)}
              style={styles.heart}
            >
              {favorites.find(b => b.id === bus.id) ? '❤️' : '🤍'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#0066cc',
    padding: '20px',
    color: 'white',
  },
  title: {
    margin: 0,
    fontSize: '28px',
  },
  content: {
    padding: '16px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  busCard: {
    backgroundColor: 'white',
    padding: '16px',
    marginBottom: '12px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  busLine: {
    backgroundColor: '#D85A30',
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
  },
  busLineText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  busDetails: {
    flex: 1,
  },
  busName: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  busEta: {
    margin: 0,
    fontSize: '12px',
    color: '#666',
  },
  heart: {
    fontSize: '24px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '8px',
  },
};