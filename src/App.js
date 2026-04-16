import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import wasaltLogo from './wasalt-icon.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const BUS_COLORS = {
  '1': '#f97316',
  '2': '#10b981',
  '3': '#3b82f6',
  '12': '#f59e0b',
};

export default function App() {
  const [buses, setBuses] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map');
  const [selectedBus, setSelectedBus] = useState(null);

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

  const reportCrowding = async (busId, level) => {
    try {
      const fieldMap = {
        'empty': 'crowdingEmpty',
        'normal': 'crowdingNormal',
        'crowded': 'crowdingCrowded'
      };

      const fieldName = fieldMap[level];
      const querySnapshot = await getDocs(collection(db, 'buses'));
      
      querySnapshot.forEach(async (docSnap) => {
        if (docSnap.data().id === busId) {
          const currentValue = docSnap.data()[fieldName] || 0;
          const busDocRef = doc(db, 'buses', docSnap.id);
          await updateDoc(busDocRef, {
            [fieldName]: currentValue + 1
          });
        }
      });

      setTimeout(async () => {
        const freshSnapshot = await getDocs(collection(db, 'buses'));
        const busesData = [];
        freshSnapshot.forEach((doc) => {
          busesData.push(doc.data());
        });
        setBuses(busesData.sort((a, b) => a.id - b.id));
      }, 500);

    } catch (error) {
      console.error('Error reporting crowding:', error);
    }
  };

  const MapView = () => (
    <div style={styles.mapContainer}>
      <MapContainer 
        center={[35.8989, 14.3754]} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {buses.map(bus => (
          <Marker 
            key={bus.id}
            position={[bus.latitude, bus.longitude]}
            eventHandlers={{
              click: () => setSelectedBus(bus),
            }}
          >
            <Popup>
              <div>
                <strong>Line {bus.line}</strong><br/>
                {bus.name}<br/>
                ETA: {Math.round(bus.eta)} mins
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {selectedBus && (
        <div style={styles.busDetailsCard}>
          <div style={styles.cardHeader}>
            <div style={{ ...styles.busLine, backgroundColor: BUS_COLORS[selectedBus.line] }}>
              <span style={styles.busLineText}>{selectedBus.line}</span>
            </div>
            <button
              onClick={() => toggleFavorite(selectedBus)}
              style={styles.favoriteBtn}
            >
              {favorites.find(b => b.id === selectedBus.id) ? '❤️' : '🤍'}
            </button>
          </div>
          <p style={styles.busName}>{selectedBus.name}</p>
          <p style={styles.busEta}>ETA: {Math.round(selectedBus.eta)} mins</p>
          {selectedBus.delay > 0 && <p style={styles.delay}>⚠️ {selectedBus.delay} min delayed</p>}
          <button onClick={() => setSelectedBus(null)} style={styles.closeBtn}>Close</button>
        </div>
      )}
    </div>
  );

  const ListView = () => (
    <div style={styles.container}>
      <div style={styles.content}>
        {buses.map(bus => (
          <div key={bus.id} style={styles.busCardWrapper}>
            <div style={styles.busCard}>
              <div style={{ ...styles.busLine, backgroundColor: BUS_COLORS[bus.line] }}>
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

            <div style={styles.crowdingSection}>
              <p style={styles.crowdingLabel}>👥 How crowded?</p>
              <div style={styles.crowdingButtons}>
                <button style={styles.crowdingBtn} onClick={() => reportCrowding(bus.id, 'empty')}>
                  😊 Empty ({bus.crowdingEmpty || 0})
                </button>
                <button style={styles.crowdingBtn} onClick={() => reportCrowding(bus.id, 'normal')}>
                  😐 Normal ({bus.crowdingNormal || 0})
                </button>
                <button style={styles.crowdingBtn} onClick={() => reportCrowding(bus.id, 'crowded')}>
                  🚴 Crowded ({bus.crowdingCrowded || 0})
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TouristPage = () => (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.touristCard}>
          <h2 style={styles.touristTitle}>🇲🇹 Welcome to Malta</h2>
          <p>Explore Malta with Wasalt public transportation!</p>
        </div>

        <div style={styles.touristCard}>
          <h3 style={styles.cardTitle}>🏛️ Popular Landmarks</h3>
          <p><strong>Valletta</strong> - Capital city with historic sites</p>
          <p><strong>Sliema</strong> - Beach town and shopping hub</p>
          <p><strong>St Julians</strong> - Nightlife and restaurants</p>
          <p><strong>Mdina</strong> - Ancient walled city</p>
        </div>

        <div style={styles.touristCard}>
          <h3 style={styles.cardTitle}>🚌 Getting Around</h3>
          <p>Take the bus to explore! All buses accept:</p>
          <p>• Daily pass: €21</p>
          <p>• 7-day pass: €26</p>
          <p>• 12-trip carnet: €15</p>
        </div>

        <div style={styles.touristCard}>
          <h3 style={styles.cardTitle}>ℹ️ Tips</h3>
          <p>✓ Buy tickets at kiosks or on the bus</p>
          <p>✓ Check bus schedules at bus stops</p>
          <p>✓ Use Wasalt to find your route</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <img src={wasaltLogo} alt="Wasalt" style={styles.logo} />
            <h1 style={styles.title}>Wasalt</h1>
          </div>
        </div>
        <div style={styles.content}>
          <p style={styles.loading}>Loading buses...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <img src={wasaltLogo} alt="Wasalt" style={styles.logo} />
          <div>
            <h1 style={styles.title}>Wasalt</h1>
            <p style={styles.subtitle}>Malta Transport, Reimagined</p>
          </div>
        </div>
      </div>

      {activeTab === 'map' && <MapView />}
      {activeTab === 'list' && <ListView />}
      {activeTab === 'tourist' && <TouristPage />}
      {activeTab === 'favorites' && (
        <div style={styles.container}>
          <div style={styles.content}>
            {favorites.length > 0 ? (
              favorites.map(bus => (
                <div key={bus.id} style={styles.busCard}>
                  <div style={{ ...styles.busLine, backgroundColor: BUS_COLORS[bus.line] }}>
                    <span style={styles.busLineText}>{bus.line}</span>
                  </div>
                  <div style={styles.busDetails}>
                    <p style={styles.busName}>{bus.name}</p>
                    <p style={styles.busEta}>ETA: {Math.round(bus.eta)} mins</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(bus)}
                    style={styles.heart}
                  >
                    ❤️
                  </button>
                </div>
              ))
            ) : (
              <p style={styles.emptyText}>No saved routes yet</p>
            )}
          </div>
        </div>
      )}

      <div style={styles.tabBar}>
        <button
          onClick={() => setActiveTab('map')}
          style={{ ...styles.tabBtn, ...(activeTab === 'map' && styles.tabBtnActive) }}
        >
          🗺️ Map
        </button>
        <button
          onClick={() => setActiveTab('list')}
          style={{ ...styles.tabBtn, ...(activeTab === 'list' && styles.tabBtnActive) }}
        >
          📋 List
        </button>
        <button
          onClick={() => setActiveTab('tourist')}
          style={{ ...styles.tabBtn, ...(activeTab === 'tourist' && styles.tabBtnActive) }}
        >
          🎫 Tourist
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          style={{ ...styles.tabBtn, ...(activeTab === 'favorites' && styles.tabBtnActive) }}
        >
          ❤️ Saved
        </button>
      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    overflow: 'auto',
  },
  header: {
    background: 'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)',
    padding: '20px',
    color: 'white',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
  },
  title: {
    margin: '0',
    fontSize: '28px',
    fontWeight: '700',
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '12px',
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  busCardWrapper: {
    marginBottom: '12px',
  },
  busCard: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '12px 12px 0 0',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  busDetailsCard: {
    position: 'absolute',
    bottom: '80px',
    left: '16px',
    right: '16px',
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    zIndex: 1000,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  busLine: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  busLineText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  busDetails: {
    flex: 1,
    marginLeft: '12px',
  },
  busName: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  busEta: {
    margin: '0 0 4px 0',
    fontSize: '12px',
    color: '#666',
  },
  delay: {
    margin: 0,
    fontSize: '12px',
    color: '#ef4444',
    fontWeight: 'bold',
  },
  heart: {
    fontSize: '24px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '8px',
  },
  favoriteBtn: {
    fontSize: '24px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
  },
  closeBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#0891b2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '12px',
    fontWeight: '600',
  },
  touristCard: {
    backgroundColor: 'white',
    padding: '16px',
    marginBottom: '12px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  touristTitle: {
    margin: '0 0 12px 0',
    fontSize: '20px',
    color: '#0891b2',
  },
  cardTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    color: '#1a1a1a',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
  },
  crowdingSection: {
    backgroundColor: '#f5f5f5',
    padding: '12px 16px',
    borderRadius: '0 0 12px 12px',
    borderTop: '1px solid #e0e0e0',
  },
  crowdingLabel: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
  },
  crowdingButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  crowdingBtn: {
    flex: 1,
    minWidth: '80px',
    padding: '8px',
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '500',
    color: '#1a1a1a',
  },
  tabBar: {
    display: 'flex',
    backgroundColor: 'white',
    borderTop: '1px solid #e0e0e0',
    padding: '8px 0',
    boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
  },
  tabBtn: {
    flex: 1,
    padding: '12px 8px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    color: '#666',
    borderTop: '3px solid transparent',
  },
  tabBtnActive: {
    color: '#0891b2',
    borderTopColor: '#0891b2',
  },
};