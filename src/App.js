import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import './App.css';

export default function App() {
  const [buses, setBuses] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'buses'));
        const busesData = [];
        querySnapshot.forEach((doc) => {
          busesData.push(doc.data());
        });
        setBuses(busesData.sort((a, b) => a.id - b.id));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching buses:', error);
        setLoading(false);
      }
    };

    fetchBuses();
  }, []);

  const toggleFavorite = (bus) => {
    if (favorites.find(b => b.id === bus.id)) {
      setFavorites(favorites.filter(b => b.id !== bus.id));
    } else {
      setFavorites([...favorites, bus]);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>🚌 Malta Transport</h1>
        </div>
        <div style={styles.content}>
          <p style={styles.loading}>Loading buses...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🚌 Malta Transport</h1>
        <p style={styles.subtitle}>{buses.length} buses available</p>
      </div>

      <div style={styles.content}>
        {buses.map(bus => (
          <div key={bus.id} style={styles.busCard}>
            <div style={styles.busLine}>
              <span style={styles.busLineText}>{bus.line}</span>
            </div>
            <div style={styles.busDetails}>
              <p style={styles.busName}>{bus.name}</p>
              <p style={styles.busEta}>ETA: {Math.round(bus.eta)} mins</p>
              {bus.delay > 0 && <p style={styles.delay}>⚠️ {bus.delay} min delayed</p>}
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
    margin: '0 0 8px 0',
    fontSize: '28px',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    opacity: 0.9,
  },
  content: {
    padding: '16px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    fontSize: '16px',
    color: '#666',
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
    margin: '0 0 4px 0',
    fontSize: '12px',
    color: '#666',
  },
  delay: {
    margin: 0,
    fontSize: '12px',
    color: '#D85A30',
    fontWeight: 'bold',
  },
  heart: {
    fontSize: '24px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '8px',
  },
};