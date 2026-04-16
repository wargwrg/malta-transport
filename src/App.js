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

const ATTRACTIONS = [
  {
    id: 1,
    name: 'Valletta',
    type: 'Historic Site',
    rating: 4.8,
    distance: 0,
    hours: '24/7',
    busRoutes: ['1', '2', '6'],
    description: 'UNESCO World Heritage capital city with stunning architecture',
    hotels: ['Auberge de Castille', 'Grand Hotel Valletta'],
  },
  {
    id: 2,
    name: 'Sliema',
    type: 'Beach Town',
    rating: 4.6,
    distance: 8,
    hours: '24/7',
    busRoutes: ['13', '14', '4'],
    description: 'Modern beach resort with shopping, dining, and nightlife',
    hotels: ['Hilton Malta', 'Radisson Blu'],
  },
  {
    id: 3,
    name: 'St Julians',
    type: 'Nightlife',
    rating: 4.5,
    distance: 10,
    hours: '10am - 3am',
    busRoutes: ['11', '12', '13'],
    description: 'Entertainment hub with clubs, bars, and restaurants',
    hotels: ['Hilton St Julians', 'Radisson Golden Sands'],
  },
  {
    id: 4,
    name: 'Mdina',
    type: 'Ancient City',
    rating: 4.7,
    distance: 15,
    hours: '10am - 4:30pm',
    busRoutes: ['51', '52', '53'],
    description: 'Walled medieval city with narrow streets and historic sites',
    hotels: ['Xara Palace', 'Mdina Hotels'],
  },
  {
    id: 5,
    name: 'Blue Lagoon',
    type: 'Beach Paradise',
    rating: 4.9,
    distance: 30,
    hours: '8am - 6pm',
    busRoutes: ['301', '302', '11'],
    description: 'Crystal clear turquoise waters perfect for swimming',
    hotels: ['Comino Hotels', 'Ferry to Valletta'],
  },
  {
    id: 6,
    name: 'Three Cities',
    type: 'Harbourside',
    rating: 4.5,
    distance: 12,
    hours: '24/7',
    busRoutes: ['2', '3', '6'],
    description: 'Historic dockyard cities Vittoriosa, Senglea, Cospicua',
    hotels: ['Waterfront Hotels', 'Birgu Guesthouses'],
  },
  {
    id: 7,
    name: 'Dingli Cliffs',
    type: 'Nature',
    rating: 4.6,
    distance: 18,
    hours: '24/7',
    busRoutes: ['51', '52', '54'],
    description: 'Stunning sea cliffs with panoramic views of Mediterranean',
    hotels: ['Dingli Village', 'Nearby accommodation'],
  },
];

const BUS_STOPS = {
  '1': ['Valletta Central', 'Auberge Stop', 'Upper Barrakka', 'St Paul Street', 'Merchants Street', 'Paola Station'],
  '2': ['Sliema Front', 'Tigne Mall', 'Sliema Centre', 'Msida Valley', 'Pieta Church', 'Mosta Rotunda'],
  '3': ['Naxxar Main', 'Attard Central', 'Lija Square', 'Msida Valley', 'Pieta Church', 'Valletta Central'],
  '12': ['St Julians Bay', 'Paceville Square', 'St George Road', 'Portomaso', 'Sliema Front', 'Valletta Central'],
  '11': ['Blue Lagoon Ferry', 'Mellieha North', 'Mellieha Bay', 'Mellieha Centre', 'Naxxar Main', 'Valletta Central'],
  '51': ['Dingli Top', 'Dingli Village', 'Mtaħleb', 'Siggiewi', 'Rabat', 'Mdina Gate'],
  '52': ['Mdina Gate', 'Mdina Centre', 'Rabat Main', 'Siggiewi', 'Mtaħleb', 'Naxxar Main'],
};

const generateChatResponse = (userMsg) => {
  const msg = userMsg.toLowerCase();
  
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return 'Hello! Welcome to Wasalt. How can I help you with your transport today?';
  }
  if (msg.includes('bus') && msg.includes('line')) {
    return 'You can view all buses by line number in the List tab. Each line shows real-time ETA, crowding status, and route information.';
  }
  if (msg.includes('crowding') || msg.includes('crowded') || msg.includes('busy')) {
    return 'You can report how crowded a bus is in the List tab by clicking Empty, Normal, or Crowded. Your feedback helps other travelers!';
  }
  if (msg.includes('route') || msg.includes('how to get')) {
    return 'Visit the Tourist tab to explore attractions and their bus routes, or use the Journey Planner tab to plan your trip between locations.';
  }
  if (msg.includes('attraction') || msg.includes('visit')) {
    return 'Check out the Tourist tab to discover Malta\'s top attractions. You can view ratings, hours, hotels, and community restaurant suggestions.';
  }
  if (msg.includes('journey') || msg.includes('plan') || msg.includes('trip')) {
    return 'Use the Journey Planner tab to enter your starting point and destination. We\'ll show you the best bus route and all stops along the way.';
  }
  if (msg.includes('review') || msg.includes('rate')) {
    return 'You can write reviews for buses in the List tab using the "Write a Review" button. Your star rating and feedback help other passengers.';
  }
  if (msg.includes('favorite') || msg.includes('save')) {
    return 'Click the heart icon on any bus to add it to your Saved routes. You can view all your saved buses in the Saved tab.';
  }
  if (msg.includes('map')) {
    return 'The Map tab shows real-time bus locations across Malta. Click on any bus marker to see details and add it to your favorites.';
  }
  if (msg.includes('dark') || msg.includes('light') || msg.includes('theme') || msg.includes('mode')) {
    return 'Toggle between dark and light mode using the sun/moon button in the header. Your preference is saved automatically.';
  }
  return 'That\'s a great question! You can explore buses in the List tab, view attractions in Tourist, plan trips in Journey Planner, or chat with me about any features you\'d like help with.';
};

export default function App() {
  const [buses, setBuses] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map');
  const [selectedBus, setSelectedBus] = useState(null);
  const [userVotes, setUserVotes] = useState({});
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [reviews, setReviews] = useState({});
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: 'Hi! Welcome to Wasalt. Ask me anything about buses, attractions, or how to use the app.', sender: 'ai', timestamp: new Date() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBusForReview, setSelectedBusForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [communityRestaurants, setCommunityRestaurants] = useState({});
  const [communityAttractions, setCommunityAttractions] = useState({});
  const [newRestaurant, setNewRestaurant] = useState('');
  const [newAttraction, setNewAttraction] = useState('');
  const [journeyFrom, setJourneyFrom] = useState('');
  const [journeyTo, setJourneyTo] = useState('');
  const [journeyResult, setJourneyResult] = useState(null);

  useEffect(() => {
    const savedVotes = localStorage.getItem('wasaltVotes');
    if (savedVotes) {
      setUserVotes(JSON.parse(savedVotes));
    }
    const savedReviews = localStorage.getItem('wasaltReviews');
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    }
    const savedMode = localStorage.getItem('wasaltMode');
    if (savedMode) {
      setIsDarkMode(JSON.parse(savedMode));
    }
    const savedRestaurants = localStorage.getItem('wasaltRestaurants');
    if (savedRestaurants) {
      setCommunityRestaurants(JSON.parse(savedRestaurants));
    }
    const savedAttractions = localStorage.getItem('wasaltAttractions');
    if (savedAttractions) {
      setCommunityAttractions(JSON.parse(savedAttractions));
    }
  }, []);

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
    const interval = setInterval(fetchBuses, 10000);

    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('wasaltMode', JSON.stringify(newMode));
  };

  const addNotification = (busName, eta) => {
    const id = Date.now();
    const notification = {
      id,
      message: `${busName} arrives in ${eta} mins`,
      timestamp: new Date(),
    };
    setNotifications([notification, ...notifications]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const submitReview = () => {
    if (!selectedBusForReview || !reviewText.trim()) return;

    const reviewKey = `bus_${selectedBusForReview.id}`;
    const newReviews = {
      ...reviews,
      [reviewKey]: {
        rating: reviewRating,
        text: reviewText,
        timestamp: new Date().toLocaleDateString(),
      }
    };
    setReviews(newReviews);
    localStorage.setItem('wasaltReviews', JSON.stringify(newReviews));
    
    setReviewText('');
    setReviewRating(5);
    setSelectedBusForReview(null);
    setShowReviewModal(false);
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;

    const userMsg = { id: Date.now(), text: chatInput, sender: 'user', timestamp: new Date() };
    setChatMessages([...chatMessages, userMsg]);
    const userQuestion = chatInput;
    setChatInput('');

    setTimeout(() => {
      const aiMsg = {
        id: Date.now() + 1,
        text: generateChatResponse(userQuestion),
        sender: 'ai',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMsg]);
    }, 500);
  };

  const addSuggestion = (type) => {
    if (type === 'restaurant') {
      if (!selectedAttraction || !newRestaurant.trim()) return;
      const key = `attraction_${selectedAttraction.id}`;
      const current = communityRestaurants[key] || [];
      const updated = {
        ...communityRestaurants,
        [key]: [...current, { name: newRestaurant, timestamp: new Date().toLocaleDateString() }]
      };
      setCommunityRestaurants(updated);
      localStorage.setItem('wasaltRestaurants', JSON.stringify(updated));
      setNewRestaurant('');
    } else {
      if (!newAttraction.trim()) return;
      const current = communityAttractions['all'] || [];
      const updated = {
        ...communityAttractions,
        'all': [...current, { name: newAttraction, timestamp: new Date().toLocaleDateString() }]
      };
      setCommunityAttractions(updated);
      localStorage.setItem('wasaltAttractions', JSON.stringify(updated));
      setNewAttraction('');
    }
  };

  const planJourney = () => {
    if (!journeyFrom || !journeyTo) return;

    const fromAttr = ATTRACTIONS.find(a => a.name.toLowerCase() === journeyFrom.toLowerCase());
    const toAttr = ATTRACTIONS.find(a => a.name.toLowerCase() === journeyTo.toLowerCase());

    if (!fromAttr || !toAttr) {
      setJourneyResult({ error: 'One or both locations not found. Please select from available attractions.' });
      return;
    }

    const commonRoutes = fromAttr.busRoutes.filter(r => toAttr.busRoutes.includes(r));

    if (commonRoutes.length === 0) {
      setJourneyResult({ error: 'No direct bus route found between these locations.' });
      return;
    }

    const bestRoute = commonRoutes[0];
    const stops = BUS_STOPS[bestRoute] || [];
    const fromIndex = stops.findIndex(s => s.includes(fromAttr.name) || s.toLowerCase().includes(fromAttr.name.split(' ')[0]));
    const toIndex = stops.findIndex(s => s.includes(toAttr.name) || s.toLowerCase().includes(toAttr.name.split(' ')[0]));

    const startIdx = Math.max(0, Math.min(fromIndex, toIndex));
    const endIdx = Math.min(stops.length - 1, Math.max(fromIndex, toIndex));

    const routeStops = stops.slice(startIdx, endIdx + 1);

    setJourneyResult({
      from: fromAttr,
      to: toAttr,
      busLine: bestRoute,
      stops: routeStops.length > 0 ? routeStops : stops,
      distance: Math.abs(toAttr.distance - fromAttr.distance),
      estimatedTime: Math.abs(toAttr.distance - fromAttr.distance) * 2,
    });
  };

  const filteredBuses = buses.filter(bus => 
    bus.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bus.line.includes(searchQuery)
  );

  const toggleFavorite = (bus) => {
    if (favorites.find(b => b.id === bus.id)) {
      setFavorites(favorites.filter(b => b.id !== bus.id));
    } else {
      setFavorites([...favorites, bus]);
    }
  };

  const reportCrowding = async (busId, level) => {
    try {
      const voteKey = `bus_${busId}`;
      const previousVote = userVotes[voteKey];

      if (previousVote === level) {
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
              [fieldName]: Math.max(0, currentValue - 1)
            });
          }
        });

        const newVotes = { ...userVotes };
        delete newVotes[voteKey];
        setUserVotes(newVotes);
        localStorage.setItem('wasaltVotes', JSON.stringify(newVotes));

        setTimeout(async () => {
          const freshSnapshot = await getDocs(collection(db, 'buses'));
          const busesData = [];
          freshSnapshot.forEach((doc) => {
            busesData.push(doc.data());
          });
          setBuses(busesData.sort((a, b) => a.id - b.id));
        }, 500);
        return;
      }

      if (previousVote) {
        const fieldMap = {
          'empty': 'crowdingEmpty',
          'normal': 'crowdingNormal',
          'crowded': 'crowdingCrowded'
        };
        const previousField = fieldMap[previousVote];
        
        const querySnapshot = await getDocs(collection(db, 'buses'));
        querySnapshot.forEach(async (docSnap) => {
          if (docSnap.data().id === busId) {
            const currentValue = docSnap.data()[previousField] || 0;
            const busDocRef = doc(db, 'buses', docSnap.id);
            await updateDoc(busDocRef, {
              [previousField]: Math.max(0, currentValue - 1)
            });
          }
        });
      }

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

      const newVotes = { ...userVotes, [voteKey]: level };
      setUserVotes(newVotes);
      localStorage.setItem('wasaltVotes', JSON.stringify(newVotes));

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

  const bgColor = isDarkMode ? '#0f172a' : '#f8fafc';
  const cardBg = isDarkMode 
    ? 'rgba(30, 41, 59, 0.55)' 
    : 'rgba(255, 255, 255, 0.7)';
  const textColor = isDarkMode ? '#f1f5f9' : '#0f172a';
  const textSecondary = isDarkMode ? '#cbd5e1' : '#64748b';
  const borderColor = isDarkMode 
    ? 'rgba(148, 163, 184, 0.12)' 
    : 'rgba(148, 163, 184, 0.15)';
  const backdropFilter = 'blur(12px)';

  const getCrowdingStatus = (busId) => {
    const vote = userVotes[`bus_${busId}`];
    if (!vote) return 'Not voted';
    return vote.charAt(0).toUpperCase() + vote.slice(1);
  };

  const MapView = () => (
    <div style={{...styles.mapContainer, backgroundColor: bgColor}}>
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
              click: () => {
                setSelectedBus(bus);
                addNotification(bus.name, bus.eta);
              },
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
        <div style={{...styles.busDetailsCard, backgroundColor: cardBg, borderColor: borderColor, backdropFilter: backdropFilter}}>
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
          <p style={{...styles.busName, color: textColor}}>{selectedBus.name}</p>
          <p style={{...styles.busEta, color: textSecondary}}>ETA: {Math.round(selectedBus.eta)} mins</p>
          {selectedBus.delay > 0 && <p style={styles.delay}>Delayed: {selectedBus.delay} min</p>}
          <button onClick={() => setSelectedBus(null)} style={styles.closeBtn}>Close</button>
        </div>
      )}
    </div>
  );

  const ListView = () => (
    <div style={{...styles.container, backgroundColor: bgColor}}>
      <div style={styles.searchBox}>
        <input 
          type="text"
          placeholder="Search buses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{...styles.searchInput, backgroundColor: cardBg, color: textColor, borderColor: borderColor, backdropFilter: backdropFilter}}
        />
      </div>
      <div style={styles.content}>
        {filteredBuses.length > 0 ? (
          <>
            {filteredBuses.map(bus => (
              <div key={bus.id} style={styles.busCardWrapper}>
                <div style={{...styles.busCard, backgroundColor: cardBg, borderColor: borderColor, backdropFilter: backdropFilter}}>
                  <div style={{ ...styles.busLine, backgroundColor: BUS_COLORS[bus.line] }}>
                    <span style={styles.busLineText}>{bus.line}</span>
                  </div>
                  <div style={styles.busDetails}>
                    <p style={{...styles.busName, color: textColor}}>{bus.name}</p>
                    <p style={{...styles.busEta, color: textSecondary}}>ETA: {Math.round(bus.eta)} mins</p>
                    {bus.delay > 0 && <p style={styles.delay}>Delayed: {bus.delay} min</p>}
                  </div>
                  <button
                    onClick={() => toggleFavorite(bus)}
                    style={styles.heart}
                  >
                    {favorites.find(b => b.id === bus.id) ? '❤️' : '🤍'}
                  </button>
                </div>

                <div style={{...styles.crowdingSection, backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.45)' : 'rgba(226, 232, 240, 0.4)', borderColor: borderColor, backdropFilter: backdropFilter}}>
                  <p style={{...styles.crowdingLabel, color: textSecondary}}>Crowding Status: {getCrowdingStatus(bus.id)}</p>
                  <div style={styles.crowdingButtons}>
                    <button 
                      style={{
                        ...styles.crowdingBtn,
                        backgroundColor: userVotes[`bus_${bus.id}`] === 'empty' ? 'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)' : cardBg,
                        color: userVotes[`bus_${bus.id}`] === 'empty' ? 'white' : textColor,
                        borderColor: borderColor,
                        backdropFilter: backdropFilter,
                      }} 
                      onClick={() => reportCrowding(bus.id, 'empty')}
                    >
                      Empty ({bus.crowdingEmpty || 0})
                    </button>
                    <button 
                      style={{
                        ...styles.crowdingBtn,
                        backgroundColor: userVotes[`bus_${bus.id}`] === 'normal' ? 'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)' : cardBg,
                        color: userVotes[`bus_${bus.id}`] === 'normal' ? 'white' : textColor,
                        borderColor: borderColor,
                        backdropFilter: backdropFilter,
                      }} 
                      onClick={() => reportCrowding(bus.id, 'normal')}
                    >
                      Normal ({bus.crowdingNormal || 0})
                    </button>
                    <button 
                      style={{
                        ...styles.crowdingBtn,
                        backgroundColor: userVotes[`bus_${bus.id}`] === 'crowded' ? 'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)' : cardBg,
                        color: userVotes[`bus_${bus.id}`] === 'crowded' ? 'white' : textColor,
                        borderColor: borderColor,
                        backdropFilter: backdropFilter,
                      }} 
                      onClick={() => reportCrowding(bus.id, 'crowded')}
                    >
                      Crowded ({bus.crowdingCrowded || 0})
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => {
                setShowReviewModal(true);
                setSelectedBusForReview(null);
              }}
              style={{...styles.writeReviewBtn, background: 'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)', color: 'white'}}
            >
              Write a Review
            </button>
          </>
        ) : (
          <p style={{...styles.noResults, color: textSecondary}}>No buses found</p>
        )}
      </div>
    </div>
  );

  const ChatView = () => (
    <div style={{...styles.container, backgroundColor: bgColor}}>
      <div style={{...styles.chatBox, backgroundColor: cardBg, borderColor: borderColor, backdropFilter: backdropFilter}}>
        <div style={{...styles.chatMessages, backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.35)' : 'rgba(226, 232, 240, 0.25)', backdropFilter: backdropFilter}}>
          {chatMessages.map(msg => (
            <div key={msg.id} style={{...styles.chatMessage, justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'}}>
              <div style={{
                ...styles.chatBubble,
                backgroundColor: msg.sender === 'user' ? 'rgba(8, 145, 178, 0.8)' : (isDarkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)'),
                color: msg.sender === 'user' ? 'white' : textColor,
                borderColor: borderColor,
                backdropFilter: backdropFilter,
              }}>
                <p style={styles.chatText}>{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{...styles.chatInput, borderColor: borderColor, backdropFilter: backdropFilter}}>
          <input 
            type="text"
            placeholder="Ask me anything..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
            style={{...styles.chatInputField, backgroundColor: cardBg, color: textColor, borderColor: borderColor, backdropFilter: backdropFilter}}
          />
          <button onClick={sendChatMessage} style={styles.chatSendBtn}>Send</button>
        </div>
      </div>
    </div>
  );

  const TouristView = () => (
    <div style={{...styles.container, backgroundColor: bgColor}}>
      <div style={styles.content}>
        {selectedAttraction ? (
          <div style={styles.attractionDetail}>
            <button 
              onClick={() => setSelectedAttraction(null)}
              style={{...styles.backBtn, backgroundColor: cardBg, color: '#06b6d4', borderColor: borderColor, backdropFilter: backdropFilter}}
            >
              Back
            </button>
            
            <h2 style={{...styles.attractionTitle, color: textColor}}>{selectedAttraction.name}</h2>
            <p style={{...styles.attractionType, color: '#06b6d4'}}>{selectedAttraction.type}</p>
            
            <div style={styles.infoGrid}>
              <div style={{...styles.infoCard, backgroundColor: cardBg, borderColor: borderColor, backdropFilter: backdropFilter}}>
                <p style={{...styles.infoLabel, color: textSecondary}}>Rating</p>
                <p style={{...styles.infoValue, color: textColor}}>{'★'.repeat(Math.round(selectedAttraction.rating))} {selectedAttraction.rating}/5</p>
              </div>
              <div style={{...styles.infoCard, backgroundColor: cardBg, borderColor: borderColor, backdropFilter: backdropFilter}}>
                <p style={{...styles.infoLabel, color: textSecondary}}>Distance</p>
                <p style={{...styles.infoValue, color: textColor}}>{selectedAttraction.distance} km</p>
              </div>
              <div style={{...styles.infoCard, backgroundColor: cardBg, borderColor: borderColor, backdropFilter: backdropFilter}}>
                <p style={{...styles.infoLabel, color: textSecondary}}>Hours</p>
                <p style={{...styles.infoValue, color: textColor}}>{selectedAttraction.hours}</p>
              </div>
            </div>

            <p style={{...styles.description, color: textColor}}>{selectedAttraction.description}</p>

            <div style={styles.section}>
              <h3 style={{...styles.sectionTitle, color: textColor}}>How to Get There</h3>
              <div style={styles.busRoutes}>
                {selectedAttraction.busRoutes.map(route => (
                  <span key={route} style={{...styles.busTag, backgroundColor: isDarkMode ? 'rgba(8, 145, 178, 0.3)' : 'rgba(8, 145, 178, 0.15)', color: '#06b6d4'}}>Line {route}</span>
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <h3 style={{...styles.sectionTitle, color: textColor}}>Nearby Hotels</h3>
              {selectedAttraction.hotels.map((hotel, idx) => (
                <p key={idx} style={{...styles.listItem, color: textColor}}>{hotel}</p>
              ))}
            </div>

            <div style={styles.section}>
              <h3 style={{...styles.sectionTitle, color: textColor}}>Community Restaurants</h3>
              <p style={{...styles.sectionSubtext, color: textSecondary}}>Suggestions from travelers:</p>
              {communityRestaurants[`attraction_${selectedAttraction.id}`] && communityRestaurants[`attraction_${selectedAttraction.id}`].length > 0 ? (
                communityRestaurants[`attraction_${selectedAttraction.id}`].map((rest, idx) => (
                  <p key={idx} style={{...styles.listItem, color: textColor}}>{rest.name}</p>
                ))
              ) : (
                <p style={{...styles.emptyItem, color: textSecondary}}>No suggestions yet</p>
              )}
              
              <div style={{...styles.addSuggestion, backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.45)' : 'rgba(226, 232, 240, 0.4)', borderColor: borderColor, backdropFilter: backdropFilter}}>
                <input 
                  type="text"
                  placeholder="Suggest a restaurant..."
                  value={newRestaurant}
                  onChange={(e) => setNewRestaurant(e.target.value)}
                  style={{...styles.suggestionInput, backgroundColor: cardBg, color: textColor, borderColor: borderColor, backdropFilter: backdropFilter}}
                />
                <button 
                  onClick={() => addSuggestion('restaurant')}
                  style={{...styles.suggestionBtn, background: 'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)', color: 'white'}}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{...styles.touristPageTitle, color: '#06b6d4'}}>Explore Malta</h2>
            <p style={{...styles.touristPageSubtitle, color: textSecondary}}>Discover attractions and community recommendations</p>
            
            <div style={{...styles.communitySection, backgroundColor: cardBg, borderColor: borderColor, backdropFilter: backdropFilter}}>
              <h3 style={{...styles.communityTitle, color: textColor}}>Community Suggestions</h3>
              <p style={{...styles.communitySubtext, color: textSecondary}}>Local tips from fellow travelers:</p>
              {communityAttractions['all'] && communityAttractions['all'].length > 0 ? (
                communityAttractions['all'].map((attr, idx) => (
                  <p key={idx} style={{...styles.communityItem, color: textColor}}>{attr.name}</p>
                ))
              ) : (
                <p style={{...styles.emptyItem, color: textSecondary}}>Suggest an attraction to help others</p>
              )}
              
              <div style={{...styles.addSuggestion, backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.45)' : 'rgba(226, 232, 240, 0.4)', borderColor: borderColor}}>
                <input 
                  type="text"
                  placeholder="Suggest an attraction..."
                  value={newAttraction}
                  onChange={(e) => setNewAttraction(e.target.value)}
                  style={{...styles.suggestionInput, backgroundColor: cardBg, color: textColor, borderColor: borderColor, backdropFilter: backdropFilter}}
                />
                <button 
                  onClick={() => addSuggestion('attraction')}
                  style={{...styles.suggestionBtn, background: 'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)', color: 'white'}}
                >
                  Add
                </button>
              </div>
            </div>

            {ATTRACTIONS.map(attraction => (
              <div 
                key={attraction.id}
                style={{...styles.attractionCard, backgroundColor: cardBg, borderColor: borderColor, cursor: 'pointer', backdropFilter: backdropFilter}}
                onClick={() => setSelectedAttraction(attraction)}
              >
                <div style={styles.attractionCardHeader}>
                  <h3 style={{...styles.attractionName, color: textColor}}>{attraction.name}</h3>
                  <span style={{...styles.ratingBadge, color: '#fbbf24'}}>{'★'.repeat(Math.round(attraction.rating))} {attraction.rating}</span>
                </div>
                <p style={{...styles.attractionCardType, color: '#06b6d4'}}>{attraction.type}</p>
                <p style={{...styles.attractionCardDesc, color: textColor}}>{attraction.description}</p>
                <div style={styles.attractionCardFooter}>
                  <span style={{...styles.attractionCardDist, color: textSecondary}}>{attraction.distance} km</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const JourneyPlannerView = () => (
    <div style={{...styles.container, backgroundColor: bgColor}}>
      <div style={styles.content}>
        <h2 style={{...styles.touristPageTitle, color: '#06b6d4'}}>Journey Planner</h2>
        <p style={{...styles.touristPageSubtitle, color: textSecondary}}>Plan your trip like Uber for buses</p>

        <div style={{...styles.journeyCard, backgroundColor: cardBg, borderColor: borderColor, backdropFilter: backdropFilter}}>
          <h3 style={{...styles.sectionTitle, color: textColor}}>Where are you going?</h3>
          
          <label style={{...styles.journeyLabel, color: textSecondary}}>Starting Point:</label>
          <select 
            value={journeyFrom}
            onChange={(e) => setJourneyFrom(e.target.value)}
            style={{...styles.journeySelect, backgroundColor: cardBg, color: textColor, borderColor: borderColor}}
          >
            <option value="">Select starting location...</option>
            {ATTRACTIONS.map(attr => (
              <option key={attr.id} value={attr.name}>{attr.name}</option>
            ))}
          </select>

          <label style={{...styles.journeyLabel, color: textSecondary, marginTop: '12px'}}>Destination:</label>
          <select 
            value={journeyTo}
            onChange={(e) => setJourneyTo(e.target.value)}
            style={{...styles.journeySelect, backgroundColor: cardBg, color: textColor, borderColor: borderColor}}
          >
            <option value="">Select destination...</option>
            {ATTRACTIONS.map(attr => (
              <option key={attr.id} value={attr.name}>{attr.name}</option>
            ))}
          </select>

          <button 
            onClick={planJourney}
            style={{...styles.planBtn, background: 'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)', color: 'white'}}
          >
            Plan Journey
          </button>
        </div>

        {journeyResult && (
          <div style={{...styles.journeyResult, backgroundColor: cardBg, borderColor: borderColor, backdropFilter: backdropFilter}}>
            {journeyResult.error ? (
              <p style={{color: '#ff6b6b', fontWeight: '600'}}>{journeyResult.error}</p>
            ) : (
              <>
                <div style={styles.journeyHeader}>
                  <div>
                    <p style={{...styles.journeyFrom, color: textColor}}>{journeyResult.from.name}</p>
                    <p style={{...styles.journeySmall, color: textSecondary}}>Starting point</p>
                  </div>
                  <div style={{...styles.journeyArrow, color: '#0891b2'}}>→</div>
                  <div>
                    <p style={{...styles.journeyTo, color: textColor}}>{journeyResult.to.name}</p>
                    <p style={{...styles.journeySmall, color: textSecondary}}>Destination</p>
                  </div>
                </div>

                <div style={styles.journeyDetails}>
                  <div style={{...styles.journeyDetailItem, backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.45)' : 'rgba(226, 232, 240, 0.4)'}}>
                    <p style={{...styles.journeyDetailLabel, color: textSecondary}}>Bus Line</p>
                    <p style={{...styles.journeyDetailValue, color: textColor}}>Line {journeyResult.busLine}</p>
                  </div>
                  <div style={{...styles.journeyDetailItem, backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.45)' : 'rgba(226, 232, 240, 0.4)'}}>
                    <p style={{...styles.journeyDetailLabel, color: textSecondary}}>Distance</p>
                    <p style={{...styles.journeyDetailValue, color: textColor}}>{journeyResult.distance} km</p>
                  </div>
                  <div style={{...styles.journeyDetailItem, backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.45)' : 'rgba(226, 232, 240, 0.4)'}}>
                    <p style={{...styles.journeyDetailLabel, color: textSecondary}}>Est. Time</p>
                    <p style={{...styles.journeyDetailValue, color: textColor}}>~{journeyResult.estimatedTime} mins</p>
                  </div>
                </div>

                <div style={styles.section}>
                  <h3 style={{...styles.sectionTitle, color: textColor}}>Bus Stops</h3>
                  <div style={{...styles.stopsList, backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(226, 232, 240, 0.2)'}}>
                    {journeyResult.stops.map((stop, idx) => (
                      <div key={idx} style={styles.stopItem}>
                        <div style={{...styles.stopNumber, backgroundColor: '#0891b2', color: 'white'}}>{idx + 1}</div>
                        <p style={{...styles.stopName, color: textColor}}>{stop}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const ReviewModal = () => (
    <div style={{...styles.modal, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)'}}>
      <div style={{...styles.modalContent, backgroundColor: cardBg, borderColor: borderColor, backdropFilter: backdropFilter}}>
        <h3 style={{...styles.modalTitle, color: textColor}}>Write a Review</h3>
        
        <div style={styles.selectBusSection}>
          <label style={{...styles.selectLabel, color: textSecondary}}>Select Bus:</label>
          <select 
            onChange={(e) => {
              const bus = buses.find(b => b.id === parseInt(e.target.value));
              setSelectedBusForReview(bus);
            }}
            value={selectedBusForReview?.id || ''}
            style={{...styles.busSelect, backgroundColor: cardBg, color: textColor, borderColor: borderColor}}
          >
            <option value="">Choose a bus...</option>
            {buses.map(bus => (
              <option key={bus.id} value={bus.id}>
                Line {bus.line} - {bus.name}
              </option>
            ))}
          </select>
        </div>

        {selectedBusForReview && (
          <>
            <div style={styles.ratingInput}>
              <p style={{...styles.ratingLabel, color: textSecondary}}>Rating:</p>
              <div style={styles.stars}>
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    style={{fontSize: '28px', border: 'none', background: 'none', cursor: 'pointer', opacity: star <= reviewRating ? 1 : 0.3}}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <textarea 
              placeholder="Write your review..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              style={{...styles.reviewTextarea, backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)', color: textColor, borderColor: borderColor}}
            />

            <div style={styles.modalButtons}>
              <button onClick={submitReview} style={{...styles.submitBtn, background: 'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)', color: 'white'}}>
                Submit
              </button>
              <button onClick={() => setShowReviewModal(false)} style={{...styles.cancelBtn, backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.8)', color: textColor, borderColor: borderColor}}>
                Cancel
              </button>
            </div>
          </>
        )}

        {!selectedBusForReview && (
          <button onClick={() => setShowReviewModal(false)} style={{...styles.cancelBtn, width: '100%', backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.8)', color: textColor, borderColor: borderColor}}>
            Close
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{...styles.container, backgroundColor: bgColor}}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <img src={wasaltLogo} alt="Wasalt" style={styles.logo} />
            <h1 style={{...styles.title, color: 'white'}}>Wasalt</h1>
          </div>
        </div>
        <div style={styles.content}>
          <p style={{...styles.loading, color: textSecondary}}>Loading buses...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{...styles.appContainer, backgroundColor: bgColor}}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <img src={wasaltLogo} alt="Wasalt" style={styles.logo} />
          <div>
            <h1 style={{...styles.title, color: 'white'}}>Wasalt</h1>
            <p style={{...styles.subtitle, color: 'rgba(255,255,255,0.9)'}}>Malta Transport</p>
          </div>
          <button 
            onClick={toggleDarkMode}
            style={{...styles.themeBtn, color: 'white'}}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {notifications.map(notif => (
        <div key={notif.id} style={{...styles.notification, backgroundColor: 'rgba(8, 145, 178, 0.9)', color: 'white', backdropFilter: backdropFilter}}>
          {notif.message}
        </div>
      ))}

      {activeTab === 'map' && <MapView />}
      {activeTab === 'list' && <ListView />}
      {activeTab === 'chat' && <ChatView />}
      {activeTab === 'tourist' && <TouristView />}
      {activeTab === 'journey' && <JourneyPlannerView />}
      {activeTab === 'favorites' && (
        <div style={{...styles.container, backgroundColor: bgColor}}>
          <div style={styles.content}>
            {favorites.length > 0 ? (
              favorites.map(bus => (
                <div key={bus.id} style={{...styles.busCard, backgroundColor: cardBg, borderColor: borderColor, backdropFilter: backdropFilter}}>
                  <div style={{ ...styles.busLine, backgroundColor: BUS_COLORS[bus.line] }}>
                    <span style={styles.busLineText}>{bus.line}</span>
                  </div>
                  <div style={styles.busDetails}>
                    <p style={{...styles.busName, color: textColor}}>{bus.name}</p>
                    <p style={{...styles.busEta, color: textSecondary}}>ETA: {Math.round(bus.eta)} mins</p>
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
              <p style={{...styles.emptyText, color: textSecondary}}>No saved routes yet</p>
            )}
          </div>
        </div>
      )}

      {showReviewModal && <ReviewModal />}

      <div style={{...styles.tabBar, backgroundColor: cardBg, borderColor: borderColor, backdropFilter: backdropFilter}}>
        <button
          onClick={() => setActiveTab('map')}
          style={{...styles.tabBtn, ...(activeTab === 'map' && styles.tabBtnActive), color: activeTab === 'map' ? '#06b6d4' : textSecondary}}
        >
          Map
        </button>
        <button
          onClick={() => setActiveTab('list')}
          style={{...styles.tabBtn, ...(activeTab === 'list' && styles.tabBtnActive), color: activeTab === 'list' ? '#06b6d4' : textSecondary}}
        >
          List
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          style={{...styles.tabBtn, ...(activeTab === 'chat' && styles.tabBtnActive), color: activeTab === 'chat' ? '#06b6d4' : textSecondary}}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('tourist')}
          style={{...styles.tabBtn, ...(activeTab === 'tourist' && styles.tabBtnActive), color: activeTab === 'tourist' ? '#06b6d4' : textSecondary}}
        >
          Tourist
        </button>
        <button
          onClick={() => setActiveTab('journey')}
          style={{...styles.tabBtn, ...(activeTab === 'journey' && styles.tabBtnActive), color: activeTab === 'journey' ? '#06b6d4' : textSecondary}}
        >
          Journey
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          style={{...styles.tabBtn, ...(activeTab === 'favorites' && styles.tabBtnActive), color: activeTab === 'favorites' ? '#06b6d4' : textSecondary}}
        >
          Saved
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
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  container: {
    flex: 1,
    overflow: 'auto',
  },
  header: {
    background: 'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)',
    padding: '16px 20px',
    color: 'white',
    boxShadow: '0 8px 32px rgba(8, 145, 178, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    width: '100%',
  },
  logo: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
  },
  title: {
    margin: '0',
    fontSize: '28px',
    fontWeight: '900',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    margin: '2px 0 0 0',
    fontSize: '11px',
    fontWeight: '500',
  },
  themeBtn: {
    padding: '8px 12px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    marginLeft: 'auto',
  },
  content: {
    padding: '16px',
    maxWidth: '640px',
    margin: '0 auto',
    width: '100%',
  },
  notification: {
    padding: '12px 16px',
    position: 'fixed',
    top: '10px',
    right: '10px',
    borderRadius: '12px',
    zIndex: 1000,
    animation: 'slideIn 0.3s ease',
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  searchBox: {
    marginBottom: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid',
    borderRadius: '12px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontWeight: '500',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.3s ease',
  },
  busCardWrapper: {
    marginBottom: '16px',
  },
  busCard: {
    padding: '14px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: '1px solid',
    transition: 'all 0.3s ease',
  },
  busLine: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  busLineText: {
    color: 'white',
    fontWeight: '800',
    fontSize: '18px',
    fontFamily: "'Inter', sans-serif",
  },
  busDetails: {
    flex: 1,
  },
  busName: {
    margin: '0',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '-0.3px',
  },
  busEta: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    fontWeight: '500',
  },
  delay: {
    margin: '2px 0 0 0',
    fontSize: '11px',
    color: '#ff6b6b',
    fontWeight: '600',
  },
  heart: {
    fontSize: '20px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '4px',
    transition: 'transform 0.2s ease',
  },
  crowdingSection: {
    padding: '12px 14px',
    borderRadius: '0 0 16px 16px',
    border: '1px solid',
    borderTop: 'none',
    marginBottom: '8px',
  },
  crowdingLabel: {
    margin: '0 0 8px 0',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  crowdingButtons: {
    display: 'flex',
    gap: '6px',
  },
  crowdingBtn: {
    flex: 1,
    padding: '8px 6px',
    border: '1px solid',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    fontFamily: "'Inter', sans-serif",
  },
  writeReviewBtn: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    marginTop: '8px',
    transition: 'all 0.3s ease',
    fontFamily: "'Inter', sans-serif",
  },
  chatBox: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 200px)',
    border: '1px solid',
    borderRadius: '16px',
    margin: '16px',
    overflow: 'hidden',
  },
  chatMessages: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  chatMessage: {
    display: 'flex',
  },
  chatBubble: {
    maxWidth: '70%',
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid',
    fontFamily: "'Inter', sans-serif",
  },
  chatText: {
    margin: '0',
    fontSize: '13px',
    fontWeight: '500',
  },
  chatInput: {
    display: 'flex',
    gap: '8px',
    padding: '12px',
    borderTop: '1px solid',
  },
  chatInputField: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid',
    borderRadius: '8px',
    fontSize: '12px',
    boxSizing: 'border-box',
    fontWeight: '500',
    fontFamily: "'Inter', sans-serif",
  },
  chatSendBtn: {
    padding: '8px 16px',
    backgroundColor: '#0891b2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.3s ease',
  },
  touristPageTitle: {
    margin: '0 0 6px 0',
    fontSize: '28px',
    fontWeight: '900',
    letterSpacing: '-0.5px',
  },
  touristPageSubtitle: {
    margin: '0 0 16px 0',
    fontSize: '13px',
    fontWeight: '500',
  },
  attractionCard: {
    padding: '14px',
    marginBottom: '10px',
    borderRadius: '16px',
    border: '1px solid',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  attractionCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  attractionName: {
    margin: '0',
    fontSize: '15px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
  },
  ratingBadge: {
    fontSize: '12px',
    fontWeight: '600',
  },
  attractionCardType: {
    margin: '0 0 6px 0',
    fontSize: '12px',
    fontWeight: '600',
  },
  attractionCardDesc: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    fontWeight: '400',
    lineHeight: '1.5',
  },
  attractionCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    fontWeight: '500',
  },
  attractionDetail: {
    marginBottom: '20px',
  },
  backBtn: {
    padding: '6px 12px',
    border: '1px solid',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '700',
    marginBottom: '12px',
    transition: 'all 0.3s ease',
    fontFamily: "'Inter', sans-serif",
  },
  attractionTitle: {
    margin: '0 0 6px 0',
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
  },
  attractionType: {
    margin: '0 0 12px 0',
    fontSize: '13px',
    fontWeight: '600',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '14px',
  },
  infoCard: {
    padding: '10px',
    borderRadius: '12px',
    border: '1px solid',
  },
  infoLabel: {
    margin: '0 0 4px 0',
    fontSize: '11px',
    fontWeight: '700',
  },
  infoValue: {
    margin: '0',
    fontSize: '14px',
    fontWeight: '700',
  },
  description: {
    fontSize: '13px',
    fontWeight: '400',
    lineHeight: '1.6',
    marginBottom: '14px',
  },
  section: {
    marginBottom: '14px',
  },
  sectionTitle: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
  },
  sectionSubtext: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  busRoutes: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  busTag: {
    padding: '4px 8px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: '600',
  },
  listItem: {
    margin: '4px 0',
    fontSize: '12px',
    fontWeight: '500',
  },
  emptyItem: {
    margin: '8px 0',
    fontSize: '12px',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  communitySection: {
    padding: '14px',
    borderRadius: '16px',
    border: '1px solid',
    marginBottom: '16px',
  },
  communityTitle: {
    margin: '0 0 6px 0',
    fontSize: '15px',
    fontWeight: '700',
    letterSpacing: '-0.3px',
  },
  communitySubtext: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  communityItem: {
    margin: '6px 0',
    fontSize: '13px',
    fontWeight: '500',
  },
  addSuggestion: {
    padding: '10px',
    borderRadius: '12px',
    marginTop: '8px',
    display: 'flex',
    gap: '6px',
  },
  suggestionInput: {
    flex: 1,
    padding: '8px 10px',
    border: '1px solid',
    borderRadius: '8px',
    fontSize: '12px',
    boxSizing: 'border-box',
    fontWeight: '500',
    fontFamily: "'Inter', sans-serif",
  },
  suggestionBtn: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    fontFamily: "'Inter', sans-serif",
  },
  journeyCard: {
    padding: '14px',
    borderRadius: '16px',
    border: '1px solid',
    marginBottom: '16px',
  },
  journeyLabel: {
    display: 'block',
    margin: '0 0 6px 0',
    fontSize: '12px',
    fontWeight: '700',
  },
  journeySelect: {
    width: '100%',
    padding: '10px',
    border: '1px solid',
    borderRadius: '8px',
    fontSize: '13px',
    boxSizing: 'border-box',
    cursor: 'pointer',
    fontWeight: '500',
    fontFamily: "'Inter', sans-serif",
    marginBottom: '12px',
  },
  planBtn: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    fontFamily: "'Inter', sans-serif",
    marginTop: '12px',
  },
  journeyResult: {
    padding: '14px',
    borderRadius: '16px',
    border: '1px solid',
  },
  journeyHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  journeyFrom: {
    margin: '0',
    fontSize: '14px',
    fontWeight: '700',
  },
  journeyTo: {
    margin: '0',
    fontSize: '14px',
    fontWeight: '700',
  },
  journeySmall: {
    margin: '2px 0 0 0',
    fontSize: '11px',
    fontWeight: '500',
  },
  journeyArrow: {
    fontSize: '24px',
    fontWeight: '700',
  },
  journeyDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginBottom: '16px',
  },
  journeyDetailItem: {
    padding: '10px',
    borderRadius: '12px',
  },
  journeyDetailLabel: {
    margin: '0 0 4px 0',
    fontSize: '11px',
    fontWeight: '700',
  },
  journeyDetailValue: {
    margin: '0',
    fontSize: '13px',
    fontWeight: '700',
  },
  stopsList: {
    padding: '10px',
    borderRadius: '12px',
  },
  stopItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  stopNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    flexShrink: 0,
  },
  stopName: {
    margin: '0',
    fontSize: '12px',
    fontWeight: '500',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modalContent: {
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid',
    maxWidth: '400px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  modalTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '800',
    letterSpacing: '-0.3px',
  },
  selectBusSection: {
    marginBottom: '16px',
  },
  selectLabel: {
    display: 'block',
    margin: '0 0 6px 0',
    fontSize: '12px',
    fontWeight: '700',
  },
  busSelect: {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid',
    borderRadius: '8px',
    fontSize: '13px',
    boxSizing: 'border-box',
    cursor: 'pointer',
    fontWeight: '500',
    fontFamily: "'Inter', sans-serif",
  },
  ratingInput: {
    marginBottom: '12px',
  },
  ratingLabel: {
    margin: '0 0 6px 0',
    fontSize: '12px',
    fontWeight: '700',
  },
  stars: {
    display: 'flex',
    gap: '4px',
  },
  reviewTextarea: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid',
    borderRadius: '8px',
    fontSize: '12px',
    minHeight: '80px',
    boxSizing: 'border-box',
    marginBottom: '12px',
    fontFamily: "'Inter', sans-serif",
    fontWeight: '500',
  },
  modalButtons: {
    display: 'flex',
    gap: '8px',
  },
  submitBtn: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    fontFamily: "'Inter', sans-serif",
  },
  cancelBtn: {
    flex: 1,
    padding: '10px',
    border: '1px solid',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    fontFamily: "'Inter', sans-serif",
  },
  busDetailsCard: {
    position: 'absolute',
    bottom: '80px',
    left: '16px',
    right: '16px',
    padding: '20px',
    borderRadius: '16px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
    border: '1px solid',
    zIndex: 1000,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '14px',
  },
  favoriteBtn: {
    fontSize: '24px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
  closeBtn: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #0891b2 0%, #0d9488 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    marginTop: '14px',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    fontFamily: "'Inter', sans-serif",
  },
  noResults: {
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: '500',
  },
  tabBar: {
    display: 'flex',
    borderTop: '1px solid',
    padding: '6px 0',
    overflowX: 'auto',
  },
  tabBtn: {
    flex: 1,
    minWidth: '55px',
    padding: '10px 6px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '700',
    borderTop: '2px solid transparent',
    transition: 'all 0.3s ease',
    fontFamily: "'Inter', sans-serif",
  },
  tabBtnActive: {
    borderTop: '2px solid #06b6d4',
  },
  loading: {
    textAlign: 'center',
    fontSize: '16px',
    fontWeight: '600',
  },
};