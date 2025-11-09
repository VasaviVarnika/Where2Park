// Global variables
let map;
let markers = [];
let parkingData = [];
let currentUser = null;
let selectedMarkerForAdd = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('App starting...');
    initializeMap();
    setupEventListeners();
    loadParkingData();
    
    setTimeout(() => {
        setupAuthStateListener();
    }, 500);
    
    setTimeout(() => {
        showNotification('Welcome to Where2Park! Click "Smart Recommendations" for nearest spots.');
    }, 1500);
});

// Setup Firebase Auth state listener
function setupAuthStateListener() {
    if (window.firebaseAuth) {
        firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                currentUser = {
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || user.email.split('@')[0]
                };
                updateUIForLoggedInUser();
            } else {
                currentUser = null;
            }
        });
    }
}

// Initialize Leaflet map
function initializeMap() {
    // Center on Bengaluru
    map = L.map('map').setView([12.9716, 77.5946], 11);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add click event for adding new markers
    map.on('click', function(e) {
        if (window.markerModeEnabled && currentUser) {
            selectedMarkerForAdd = e.latlng;
            showAddMarkerModal(e.latlng);
        }
    });
}

// Load parking data with real-time Firebase sync
async function loadParkingData() {
    console.log('Loading parking data...');
    
    // Always load local data first for immediate display
    loadLocalData();
    
    // Try Firebase in background
    if (window.firebaseDB) {
        setTimeout(async () => {
            try {
                const spotsRef = firebaseDB.collection('parkingSpots');
                const initialCheck = await spotsRef.get();
                
                if (initialCheck.empty) {
                    console.log('Firebase empty, initializing...');
                    await initializeSampleData();
                } else {
                    parkingData = [];
                    initialCheck.forEach((doc) => {
                        parkingData.push({ id: doc.id, ...doc.data() });
                    });
                    displayMarkers();
                    updateStats();
                }
                
                // Set up real-time listener with change detection
                spotsRef.onSnapshot((snapshot) => {
                    const previousData = [...parkingData];
                    parkingData = [];
                    
                    snapshot.forEach((doc) => {
                        parkingData.push({ id: doc.id, ...doc.data() });
                    });
                    
                    // Check for status changes and notify
                    checkForStatusChanges(previousData, parkingData);
                    
                    displayMarkers();
                    updateStats();
                });
            } catch (error) {
                console.error('Firebase error:', error);
            }
        }, 1000);
    }
}

// Check for status changes and show notifications
function checkForStatusChanges(previousData, currentData) {
    if (previousData.length === 0) return;
    
    currentData.forEach(currentSpot => {
        const previousSpot = previousData.find(p => p.id === currentSpot.id);
        
        if (previousSpot && previousSpot.status !== currentSpot.status) {
            const spotName = currentSpot.name || 'Parking spot';
            
            if (currentSpot.status === 'booked') {
                showNotification(`🚗 ${spotName} was just booked by another user`);
            } else if (currentSpot.status === 'occupied') {
                showNotification(`🅿️ ${spotName} is now occupied`);
            } else if (currentSpot.status === 'available') {
                showNotification(`✅ ${spotName} is now available`);
            }
        }
    });
}

// Initialize sample data in Firebase - ALL SPOTS AVAILABLE
async function initializeSampleData() {
    const sampleData = [
        {
            name: "Garuda Mall Parking",
            lat: 12.9703806,
            lng: 77.6094191,
            type: "underground",
            fee: "no",
            access: "permissive",
            status: "available"
        },
        {
            name: "Street Parking Near Metro",
            lat: 12.9600641,
            lng: 77.6454368,
            type: "street_side",
            fee: "no",
            access: "permissive",
            status: "available"
        },
        {
            name: "Nandini Restaurant Parking",
            lat: 12.989144,
            lng: 77.7337716,
            type: "surface",
            fee: "no",
            access: "permissive",
            status: "available"
        },
        {
            name: "Corporation Circle Parking",
            lat: 12.9752226,
            lng: 77.5955056,
            type: "surface",
            fee: "no",
            access: "permissive",
            status: "available"
        },
        {
            name: "ISKCON Temple Parking",
            lat: 13.0092724,
            lng: 77.5516244,
            type: "surface",
            fee: "no",
            access: "permissive",
            status: "available"
        },
        {
            name: "Phoenix Market Underground",
            lat: 12.996845,
            lng: 77.6961012,
            type: "underground",
            fee: "no",
            access: "permissive",
            status: "available"
        },
        {
            name: "Nexus Mall Parking",
            lat: 12.9348541,
            lng: 77.6110076,
            type: "multi-storey",
            fee: "no",
            access: "permissive",
            status: "available"
        },
        {
            name: "Yeswantapur Station Parking",
            lat: 13.0235615,
            lng: 77.5507008,
            type: "surface",
            fee: "no",
            access: "permissive",
            status: "available"
        }
    ];
    
    const batch = firebaseDB.batch();
    sampleData.forEach((spot) => {
        const docRef = firebaseDB.collection('parkingSpots').doc();
        batch.set(docRef, spot);
    });
    await batch.commit();
}

// Load comprehensive parking data from CSV
async function loadLocalData() {
    try {
        const response = await fetch('bengaluru_parking_spots.csv');
        const csvText = await response.text();
        parkingData = parseCSVData(csvText);
    } catch (error) {
        console.log('CSV not found, loading comprehensive local dataset...');
        parkingData = getComprehensiveLocalData();
    }
    
    // Make parkingData globally available
    window.parkingData = parkingData;
    
    displayMarkers();
    updateStats();
    
    console.log(`Loaded ${parkingData.length} parking spots with realistic status distribution`);
}

// Parse CSV data into parking spots
function parseCSVData(csvText) {
    const lines = csvText.split('\n');
    const spots = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= 3 && values[1] && values[2]) {
            const lat = parseFloat(values[1]);
            const lng = parseFloat(values[2]);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                const spot = {
                    id: 'csv-' + i,
                    name: values[0] || `Parking Spot ${i}`,
                    lat: lat,
                    lng: lng,
                    type: values[3] || 'surface',
                    fee: values[4] === 'yes' ? 'yes' : 'no',
                    access: values[5] || 'permissive',
                    status: generateRealisticStatus()
                };
                spots.push(spot);
            }
        }
    }
    return spots;
}

// Generate realistic status distribution
function generateRealisticStatus() {
    const rand = Math.random();
    if (rand < 0.65) return 'available';  // 65% available
    if (rand < 0.85) return 'occupied';   // 20% occupied  
    return 'booked';                      // 15% booked
}

// Comprehensive local data as fallback
function getComprehensiveLocalData() {
    const spots = [
        {name: "Garuda Mall Parking", lat: 12.9703806, lng: 77.6094191, type: "underground", fee: "yes", access: "customers"},
        {name: "Street Parking Near Metro", lat: 12.9600641, lng: 77.6454368, type: "street_side", fee: "no", access: "permissive"},
        {name: "Nandini Restaurant Parking", lat: 12.989144, lng: 77.7337716, type: "surface", fee: "no", access: "customers"},
        {name: "Corporation Circle Parking", lat: 12.9752226, lng: 77.5955056, type: "surface", fee: "yes", access: "private"},
        {name: "ISKCON Temple Parking", lat: 13.0092724, lng: 77.5516244, type: "surface", fee: "yes", access: "permissive"},
        {name: "Phoenix Market Underground", lat: 12.996845, lng: 77.6961012, type: "underground", fee: "yes", access: "customers"},
        {name: "Nexus Mall Parking", lat: 12.9348541, lng: 77.6110076, type: "multi-storey", fee: "yes", access: "customers"},
        {name: "Yeswantapur Station Parking", lat: 13.0235615, lng: 77.5507008, type: "surface", fee: "yes", access: "public"},
        {name: "Brigade Road Parking", lat: 12.9698196, lng: 77.6205452, type: "surface", fee: "no", access: "permissive"},
        {name: "Cubbon Park Parking", lat: 12.9762308, lng: 77.5906735, type: "surface", fee: "yes", access: "public"},
        {name: "UB City Mall Parking", lat: 12.9716, lng: 77.5946, type: "underground", fee: "yes", access: "customers"},
        {name: "Forum Mall Koramangala", lat: 12.9279, lng: 77.6271, type: "multi-storey", fee: "yes", access: "customers"},
        {name: "Orion Mall Parking", lat: 13.0827, lng: 77.5877, type: "multi-storey", fee: "no", access: "permissive"},
        {name: "Electronic City Parking", lat: 12.8456, lng: 77.6603, type: "surface", fee: "no", access: "permissive"},
        {name: "Whitefield Tech Park", lat: 12.9698, lng: 77.7500, type: "surface", fee: "no", access: "permissive"},
        {name: "Indiranagar Metro Station", lat: 12.9784, lng: 77.6408, type: "surface", fee: "yes", access: "permissive"},
        {name: "Koramangala Forum Parking", lat: 12.9352, lng: 77.6245, type: "underground", fee: "yes", access: "customers"},
        {name: "JP Nagar Metro Parking", lat: 12.9081, lng: 77.5831, type: "surface", fee: "yes", access: "permissive"},
        {name: "Bangalore Central Mall", lat: 12.9279232, lng: 77.6271078, type: "multi-storey", fee: "yes", access: "customers"},
        {name: "Lalbagh Main Gate", lat: 12.9507167, lng: 77.5848061, type: "surface", fee: "yes", access: "permissive"},
        {name: "MG Road Metro Station", lat: 12.9758, lng: 77.6063, type: "surface", fee: "yes", access: "permissive"},
        {name: "Commercial Street Parking", lat: 12.9833, lng: 77.6089, type: "street_side", fee: "no", access: "permissive"},
        {name: "Vidhana Soudha Parking", lat: 12.9794, lng: 77.5912, type: "surface", fee: "yes", access: "public"},
        {name: "Chinnaswamy Stadium", lat: 12.9792, lng: 77.5999, type: "surface", fee: "yes", access: "public"},
        {name: "Kanteerava Stadium", lat: 12.9667, lng: 77.5833, type: "surface", fee: "no", access: "public"},
        {name: "Banashankari Metro", lat: 12.9250, lng: 77.5583, type: "surface", fee: "yes", access: "permissive"},
        {name: "Jayanagar 4th Block", lat: 12.9250, lng: 77.5833, type: "surface", fee: "no", access: "permissive"},
        {name: "HSR Layout Parking", lat: 12.9083, lng: 77.6417, type: "surface", fee: "no", access: "permissive"},
        {name: "BTM Layout Metro", lat: 12.9167, lng: 77.6100, type: "surface", fee: "yes", access: "permissive"},
        {name: "Silk Board Junction", lat: 12.9167, lng: 77.6250, type: "surface", fee: "no", access: "permissive"}
    ];

    // Generate realistic status for all spots
    return spots.map((spot, index) => ({
        ...spot,
        id: 'local-' + (index + 1),
        status: generateRealisticStatus()
    }));
}

// Display markers on map
function displayMarkers() {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Filter data based on current filters
    const typeFilter = document.getElementById('parkingTypeFilter').value;
    const feeFilter = document.getElementById('feeFilter').value;
    const distanceFilter = document.getElementById('distanceFilter') ? document.getElementById('distanceFilter').value : 'all';
    
    let filteredData = parkingData.filter(spot => {
        const typeMatch = typeFilter === 'all' || spot.type === typeFilter;
        const feeMatch = feeFilter === 'all' || spot.fee === feeFilter;
        return typeMatch && feeMatch;
    });
    
    // Apply distance filter if user location is available
    if (distanceFilter !== 'all' && window.userLocationMarker) {
        const userLatLng = window.userLocationMarker.getLatLng();
        const maxDistance = parseFloat(distanceFilter.replace('km', ''));
        
        filteredData = filteredData.filter(spot => {
            const distance = calculateDistance(userLatLng.lat, userLatLng.lng, spot.lat, spot.lng);
            return distance <= maxDistance;
        });
    }
    
    // Add markers for each parking spot
    filteredData.forEach(spot => {
        const marker = createMarker(spot);
        markers.push(marker);
        marker.addTo(map);
    });
    
    // Update stats with filtered data
    updateStatsWithFilteredData(filteredData);
}

// Handle distance filter changes
function handleDistanceFilter() {
    const distanceFilter = document.getElementById('distanceFilter').value;
    
    if (distanceFilter !== 'all' && !window.userLocationMarker) {
        showNotification('📍 Please use "Find my location" first to enable distance filtering');
        document.getElementById('distanceFilter').value = 'all';
        return;
    }
    
    displayMarkers();
}

// Update stats with filtered data
function updateStatsWithFilteredData(filteredData) {
    const totalSpots = filteredData.length;
    const availableSpots = filteredData.filter(spot => spot.status === 'available').length;
    const bookedSpots = filteredData.filter(spot => spot.status === 'booked').length;
    const occupiedSpots = filteredData.filter(spot => spot.status === 'occupied').length;
    
    // Update legend counts with filtered data
    const availableCount = document.getElementById('availableCount');
    const bookedCount = document.getElementById('bookedCount');
    const occupiedCount = document.getElementById('occupiedCount');
    
    if (availableCount) availableCount.textContent = availableSpots;
    if (bookedCount) bookedCount.textContent = bookedSpots;
    if (occupiedCount) occupiedCount.textContent = occupiedSpots;
}

// Create marker for parking spot
function createMarker(spot) {
    const statusColors = {
        available: '#10b981',
        booked: '#f59e0b',
        occupied: '#ef4444'
    };
    
    const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${statusColors[spot.status]}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
    });
    
    const marker = L.marker([spot.lat, spot.lng], { icon });
    
    // Add click event to show spot details
    marker.on('click', () => showSpotDetails(spot));
    
    return marker;
}

// Show spot details in modal
function showSpotDetails(spot) {
    const modal = document.getElementById('spotModal');
    const detailsDiv = document.getElementById('spotDetails');
    
    const statusText = {
        available: 'Available',
        booked: 'Booked',
        occupied: 'Occupied'
    };
    
    const statusClass = {
        available: 'status-available',
        booked: 'status-booked',
        occupied: 'status-occupied'
    };
    
    detailsDiv.innerHTML = `
        <div class="spot-details">
            <h3>${spot.name || 'Parking Spot'}</h3>
            <div class="spot-info">
                <div class="spot-info-item">
                    <span>Status:</span>
                    <span class="${statusClass[spot.status]}">${statusText[spot.status]}</span>
                </div>
                <div class="spot-info-item">
                    <span>Type:</span>
                    <span>${spot.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
                <div class="spot-info-item">
                    <span>Fee:</span>
                    <span>Free</span>
                </div>
                <div class="spot-info-item">
                    <span>Access:</span>
                    <span>Public</span>
                </div>
            </div>
            <div class="spot-actions">
                ${spot.status === 'available' ? `
                    <button class="btn btn-primary" onclick="bookSpot('${spot.id}'); return false;">📅 Book Spot</button>
                    <button class="btn btn-secondary" onclick="markAsParked('${spot.id}'); return false;">🚗 Mark as Parked</button>
                ` : ''}
                ${spot.status === 'booked' ? `
                    <button class="btn btn-secondary" onclick="cancelBooking('${spot.id}'); return false;">❌ Cancel Booking</button>
                ` : ''}
                ${spot.status === 'occupied' ? `
                    <button class="btn btn-secondary" onclick="markAsAvailable('${spot.id}'); return false;">✅ Mark as Available</button>
                ` : ''}
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Booking functions with Firebase integration
function bookSpot(spotId) {
    if (!currentUser) {
        showNotification('Please login to book a parking spot');
        return;
    }
    
    console.log('Booking spot:', spotId);
    updateSpotStatus(spotId, 'booked', 'Parking spot booked successfully!');
}

function markAsParked(spotId) {
    console.log('Marking as parked:', spotId);
    updateSpotStatus(spotId, 'occupied', 'Parking spot marked as occupied!');
}

function cancelBooking(spotId) {
    console.log('Cancelling booking:', spotId);
    updateSpotStatus(spotId, 'available', 'Booking cancelled successfully!');
}

function markAsAvailable(spotId) {
    console.log('Marking as available:', spotId);
    updateSpotStatus(spotId, 'available', 'Parking spot marked as available!');
}

// Update spot status in Firebase with real-time sync
async function updateSpotStatus(spotId, newStatus, successMessage) {
    console.log('Updating spot status:', spotId, 'to', newStatus);
    
    try {
        if (window.firebaseDB) {
            // Check if it's a Firebase document ID (longer than 10 chars)
            if (typeof spotId === 'string' && spotId.length > 10) {
                console.log('Updating Firebase document:', spotId);
                await firebaseDB.collection('parkingSpots').doc(spotId).update({
                    status: newStatus,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedBy: currentUser ? currentUser.uid : 'anonymous'
                });
            } else {
                console.log('Local ID detected, updating locally:', spotId);
                // For local IDs, update locally
                const spot = parkingData.find(s => s.id == spotId);
                if (spot) {
                    spot.status = newStatus;
                    displayMarkers();
                    updateStats();
                }
            }
        } else {
            // Fallback to local update
            console.log('No Firebase, updating locally');
            const spot = parkingData.find(s => s.id == spotId);
            if (spot) {
                spot.status = newStatus;
                displayMarkers();
                updateStats();
            }
        }
        closeModal('spotModal');
        showNotification(successMessage);
    } catch (error) {
        console.error('Error updating spot status:', error);
        showNotification('Error: ' + error.message);
    }
}

// Update statistics
function updateStats() {
    const totalSpots = parkingData.length;
    const availableSpots = parkingData.filter(spot => spot.status === 'available').length;
    const bookedSpots = parkingData.filter(spot => spot.status === 'booked').length;
    const occupiedSpots = parkingData.filter(spot => spot.status === 'occupied').length;
    
    document.getElementById('totalSpots').textContent = totalSpots + '+';
    document.getElementById('availableSpots').textContent = availableSpots;
    
    // Update legend counts
    const availableCount = document.getElementById('availableCount');
    const bookedCount = document.getElementById('bookedCount');
    const occupiedCount = document.getElementById('occupiedCount');
    
    if (availableCount) availableCount.textContent = availableSpots;
    if (bookedCount) bookedCount.textContent = bookedSpots;
    if (occupiedCount) occupiedCount.textContent = occupiedSpots;
}

// Setup event listeners
function setupEventListeners() {
    // Modal controls
    setupModalControls();
    
    // Feature cards
    document.getElementById('viewSlotsCard').addEventListener('click', () => {
        document.querySelector('.map-section').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Add smart recommendations button
    setTimeout(() => {
        addSmartRecommendationsButton();
    }, 2000);
    
    document.getElementById('bookingCard').addEventListener('click', () => {
        if (!currentUser) {
            document.getElementById('loginModal').style.display = 'block';
        } else {
            document.querySelector('.map-section').scrollIntoView({ behavior: 'smooth' });
            showNotification('Click on any available (green) parking spot to book it!');
        }
    });
    
    document.getElementById('addMarkerCard').addEventListener('click', () => {
        if (!currentUser) {
            document.getElementById('loginModal').style.display = 'block';
            showNotification('Please login first to add parking spots');
        } else {
            // Scroll to map and enable marker mode
            document.querySelector('.map-section').scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                enableMarkerMode();
            }, 500);
        }
    });
    
    // Add feature button handlers
    document.querySelectorAll('.feature-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.feature-card');
            if (card && card.id === 'addMarkerCard') {
                if (!currentUser) {
                    document.getElementById('loginModal').style.display = 'block';
                    showNotification('Please login first to add parking spots');
                } else {
                    document.querySelector('.map-section').scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => {
                        enableMarkerMode();
                    }, 500);
                }
            }
        });
    });
    
    // Map control buttons
    document.getElementById('locateBtn').addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                map.setView([lat, lng], 15);
                
                // Remove existing user location marker
                if (window.userLocationMarker) {
                    map.removeLayer(window.userLocationMarker);
                }
                
                window.userLocationMarker = L.marker([lat, lng], {
                    icon: L.divIcon({
                        className: 'user-location-marker',
                        html: `
                            <div style="
                                background: #ff4444;
                                color: white;
                                width: 30px;
                                height: 30px;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                border: 3px solid white;
                                box-shadow: 0 4px 15px rgba(255, 68, 68, 0.4);
                            ">
                                📍
                            </div>
                        `,
                        iconSize: [36, 36],
                        iconAnchor: [18, 18]
                    })
                }).addTo(map);
                
                window.userLocationMarker.bindPopup('📍 Your Location').openPopup();
                showNotification('📍 Location found! You can now use distance filters.');
            });
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    });
    
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
        const mapContainer = document.getElementById('map');
        if (mapContainer.requestFullscreen) {
            mapContainer.requestFullscreen();
        }
    });
    
    // Filters
    document.getElementById('parkingTypeFilter').addEventListener('change', displayMarkers);
    document.getElementById('feeFilter').addEventListener('change', displayMarkers);
    document.getElementById('distanceFilter').addEventListener('change', handleDistanceFilter);
    
    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('addMarkerForm').addEventListener('submit', handleAddMarker);
}

// Modal controls
function setupModalControls() {
    // Login/Signup buttons
    document.getElementById('loginBtn').addEventListener('click', () => {
        document.getElementById('loginModal').style.display = 'block';
    });
    
    document.getElementById('signupBtn').addEventListener('click', () => {
        document.getElementById('signupModal').style.display = 'block';
    });
    
    // Modal switching
    document.getElementById('switchToSignup').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('loginModal');
        document.getElementById('signupModal').style.display = 'block';
    });
    
    document.getElementById('switchToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('signupModal');
        document.getElementById('loginModal').style.display = 'block';
    });
    
    // Close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            modal.style.display = 'none';
        });
    });
    
    // Click outside to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Handle login with Firebase Auth
async function handleLogin(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    
    try {
        if (window.firebaseAuth) {
            const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
            currentUser = {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                name: userCredential.user.displayName || email.split('@')[0]
            };
        } else {
            // Fallback to simulated login
            currentUser = { email, name: email.split('@')[0] };
        }
        
        updateUIForLoggedInUser();
        closeModal('loginModal');
        showNotification('Login successful!');
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

// Handle signup with Firebase Auth
async function handleSignup(e) {
    e.preventDefault();
    const inputs = e.target.querySelectorAll('input');
    const name = inputs[0].value;
    const email = inputs[1].value;
    const password = inputs[2].value;
    
    try {
        if (window.firebaseAuth) {
            const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName: name });
            
            currentUser = {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                name: name
            };
        } else {
            // Fallback to simulated signup
            currentUser = { email, name };
        }
        
        updateUIForLoggedInUser();
        closeModal('signupModal');
        showNotification('Account created successfully!');
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed: ' + error.message);
    }
}

// Handle add marker with Firebase - permanent database entry
async function handleAddMarker(e) {
    e.preventDefault();
    
    if (!selectedMarkerForAdd) {
        showNotification('Please select a location on the map first');
        return;
    }
    
    const spotName = document.getElementById('spotName').value || 'Community Added Spot';
    const spotType = document.getElementById('spotType').value;
    
    if (!spotType) {
        showNotification('Please select a parking type');
        return;
    }
    
    const newSpot = {
        name: spotName,
        lat: selectedMarkerForAdd.lat,
        lng: selectedMarkerForAdd.lng,
        type: spotType,
        fee: "no", // All spots are free
        access: "permissive", // All spots are public
        status: 'available',
        addedBy: currentUser ? currentUser.uid : 'anonymous',
        addedByName: currentUser ? currentUser.name : 'Anonymous',
        createdAt: firebase.firestore ? firebase.firestore.FieldValue.serverTimestamp() : new Date(),
        coordinates: {
            lat: selectedMarkerForAdd.lat,
            lng: selectedMarkerForAdd.lng
        }
    };
    
    console.log('Adding new parking spot:', newSpot);
    
    try {
        if (window.firebaseDB) {
            // Add to Firebase - permanent entry that syncs to all devices
            const docRef = await firebaseDB.collection('parkingSpots').add(newSpot);
            console.log('New spot added with ID:', docRef.id);
            showNotification(`New parking spot "${spotName}" added permanently and synced to all devices!`);
        } else {
            // Fallback to local addition
            newSpot.id = 'local-' + Date.now();
            parkingData.push(newSpot);
            displayMarkers();
            updateStats();
            showNotification(`New parking spot "${spotName}" added locally!`);
        }
        
        // Remove temporary marker
        if (window.tempMarker) {
            map.removeLayer(window.tempMarker);
            window.tempMarker = null;
        }
        
        closeModal('addMarkerModal');
        selectedMarkerForAdd = null;
        e.target.reset();
    } catch (error) {
        console.error('Error adding marker:', error);
        showNotification('Error adding parking spot: ' + error.message);
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    document.getElementById('loginBtn').innerHTML = `
        <i class="fas fa-user"></i>
        ${currentUser.name}
    `;
    document.getElementById('signupBtn').innerHTML = `
        <i class="fas fa-sign-out-alt"></i>
        Logout
    `;
    document.getElementById('signupBtn').onclick = logout;
    
    // Ensure parking data is visible after login
    if (parkingData.length === 0) {
        loadParkingData();
    } else {
        displayMarkers();
        updateStats();
    }
    
    showNotification(`Welcome ${currentUser.name}! You can now book spots.`);
}

// Logout with Firebase
async function logout() {
    try {
        if (window.firebaseAuth) {
            await firebaseAuth.signOut();
        }
        
        currentUser = null;
        document.getElementById('loginBtn').innerHTML = `
            <i class="fas fa-sign-in-alt"></i>
            Login
        `;
        document.getElementById('signupBtn').innerHTML = `
            <i class="fas fa-user-plus"></i>
            Sign Up
        `;
        document.getElementById('signupBtn').onclick = null;
        showNotification('Logged out successfully!');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Enable marker mode for adding spots
function enableMarkerMode() {
    console.log('Enabling marker mode');
    window.markerModeEnabled = true;
    showNotification('🎯 Click anywhere on the map to add a new parking spot');
    
    // Change cursor to crosshair
    const mapElement = document.getElementById('map');
    if (mapElement) {
        mapElement.style.cursor = 'crosshair';
    }
    
    // Add visual indicator
    const existingIndicator = document.getElementById('marker-mode-indicator');
    if (existingIndicator) {
        document.body.removeChild(existingIndicator);
    }
    
    const indicator = document.createElement('div');
    indicator.id = 'marker-mode-indicator';
    indicator.innerHTML = `
        <div style="
            position: fixed;
            top: 120px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
            color: white;
            padding: 1rem 2rem;
            border-radius: 50px;
            font-weight: 600;
            z-index: 1001;
            box-shadow: 0 8px 30px rgba(255,107,107,0.4);
            animation: pulse 2s infinite;
        ">
            <i class="fas fa-map-pin"></i>
            Click anywhere on map to add parking spot
            <button onclick="disableMarkerMode()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                margin-left: 1rem;
                cursor: pointer;
                font-size: 1.2rem;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">×</button>
        </div>
    `;
    document.body.appendChild(indicator);
}

// Disable marker mode
function disableMarkerMode() {
    window.markerModeEnabled = false;
    document.getElementById('map').style.cursor = '';
    
    const indicator = document.getElementById('marker-mode-indicator');
    if (indicator) {
        document.body.removeChild(indicator);
    }
    
    // Remove temp marker if exists
    if (window.tempMarker) {
        map.removeLayer(window.tempMarker);
        window.tempMarker = null;
    }
}

// Show add marker modal with location
function showAddMarkerModal(latlng) {
    console.log('Showing add marker modal for location:', latlng);
    selectedMarkerForAdd = latlng;
    
    // Add temporary marker
    if (window.tempMarker) {
        map.removeLayer(window.tempMarker);
    }
    
    window.tempMarker = L.marker([latlng.lat, latlng.lng], {
        icon: L.divIcon({
            className: 'temp-marker',
            html: '<div style="background: #ff6b6b; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 15px rgba(255,107,107,0.5); animation: pulse 1.5s infinite;"></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        })
    }).addTo(map);
    
    // Disable marker mode
    disableMarkerMode();
    
    // Show modal
    document.getElementById('addMarkerModal').style.display = 'block';
    showNotification(`📍 Location selected: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}. Fill the form to add parking spot.`);
}

// Add Smart Recommendations Button
function addSmartRecommendationsButton() {
    const heroSection = document.querySelector('.hero-cta');
    if (heroSection && !document.getElementById('smartRecommendBtn')) {
        const smartBtn = document.createElement('button');
        smartBtn.id = 'smartRecommendBtn';
        smartBtn.className = 'btn btn-hero';
        smartBtn.style.marginLeft = '1rem';
        smartBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        smartBtn.innerHTML = `
            <i class="fas fa-brain"></i>
            Smart Recommendations
        `;
        smartBtn.onclick = getSmartRecommendations;
        heroSection.appendChild(smartBtn);
    }
}

// Get Smart Recommendations based on user location
function getSmartRecommendations() {
    showNotification('🧠 Getting AI-powered recommendations...');
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // Add user location marker
                if (window.userLocationMarker) {
                    map.removeLayer(window.userLocationMarker);
                }
                
                window.userLocationMarker = L.marker([userLat, userLng], {
                    icon: L.divIcon({
                        className: 'user-location-marker',
                        html: `
                            <div style="
                                background: #ff4444;
                                color: white;
                                width: 30px;
                                height: 30px;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-weight: bold;
                                border: 3px solid white;
                                box-shadow: 0 4px 15px rgba(255, 68, 68, 0.4);
                            ">
                                📍
                            </div>
                        `,
                        iconSize: [36, 36],
                        iconAnchor: [18, 18]
                    })
                }).addTo(map);
                
                window.userLocationMarker.bindPopup('📍 Your Location');
                
                // Enable distance filtering now that we have user location
                showNotification('📍 Location found! You can now use distance filters.');
                
                showRecommendations(userLat, userLng);
            },
            (error) => {
                console.log('Geolocation error:', error);
                showNotification('📍 Using Bangalore city center as location');
                showRecommendations(12.9716, 77.5946);
            }
        );
    } else {
        showNotification('📍 Using Bangalore city center as location');
        showRecommendations(12.9716, 77.5946);
    }
}

// Calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Show recommendations based on user location with 1km priority
function showRecommendations(userLat, userLng) {
    // Calculate distances for all available spots
    const availableSpots = parkingData
        .filter(spot => spot.status === 'available')
        .map(spot => ({
            ...spot,
            distance_km: calculateDistance(userLat, userLng, spot.lat, spot.lng)
        }))
        .sort((a, b) => a.distance_km - b.distance_km);
    
    if (availableSpots.length === 0) {
        showNotification('❌ No available parking spots found in the dataset');
        return;
    }
    
    // First try to find spots within 1km
    const spotsWithin1km = availableSpots.filter(spot => spot.distance_km <= 1.0);
    
    let recommendations;
    let message;
    
    if (spotsWithin1km.length > 0) {
        recommendations = spotsWithin1km.slice(0, 5);
        message = `✅ Found ${spotsWithin1km.length} available spots within 1km!`;
    } else {
        // No spots within 1km, get nearest 5 available spots
        recommendations = availableSpots.slice(0, 5);
        const nearestDistance = recommendations[0].distance_km;
        message = `⚠️ No spots within 1km. Showing nearest available spots (${nearestDistance.toFixed(1)}km away)`;
    }
    
    displayMLRecommendations(recommendations, userLat, userLng);
    showNotification(message);
}

// Fallback to local distance calculation (kept for compatibility)
function fallbackToLocalRecommendations(userLat, userLng) {
    showRecommendations(userLat, userLng);
}

// Display ML-powered recommendations
function displayMLRecommendations(recommendations, userLat, userLng) {
    // Create and show recommendations modal
    const modal = createRecommendationsModal(recommendations, userLat, userLng);
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Highlight spots on map with enhanced styling
    highlightRecommendedSpots(recommendations);
    
    // Update map view to show user location and recommendations
    const allPoints = [
        [userLat, userLng],
        ...recommendations.map(spot => [spot.lat, spot.lng])
    ];
    
    const group = new L.featureGroup(allPoints.map(point => L.marker(point)));
    map.fitBounds(group.getBounds().pad(0.1));
    
    showNotification(`✅ Found ${recommendations.length} available spots nearby!`);
}

// Create recommendations modal with distance priority info
function createRecommendationsModal(spots, userLat, userLng) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'recommendationsModal';
    
    const spotsWithin1km = spots.filter(spot => spot.distance_km <= 1.0).length;
    const totalAvailable = parkingData.filter(spot => spot.status === 'available').length;
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <span class="close" onclick="closeRecommendationsModal()">&times;</span>
            <h2><i class="fas fa-brain"></i> Smart Parking Recommendations</h2>
            <p style="color: #666; margin-bottom: 1rem;">
                📍 Your location: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}
                <br><small>🎯 ${spotsWithin1km} spots within 1km | ${totalAvailable} total available spots</small>
            </p>
            
            ${spotsWithin1km === 0 ? `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <i class="fas fa-exclamation-triangle" style="color: #f39c12;"></i>
                    <strong>No spots within 1km radius.</strong> Showing nearest available options:
                </div>
            ` : `
                <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <i class="fas fa-check-circle" style="color: #28a745;"></i>
                    <strong>Great!</strong> Found ${spotsWithin1km} spots within your preferred 1km radius.
                </div>
            `}
            
            <div class="recommendations-list">
                ${spots.map((spot, index) => {
                    const distance = spot.distance_km || spot.distance || 0;
                    const isWithin1km = distance <= 1.0;
                    const isTop3 = index < 3;
                    return `
                    <div class="recommendation-item ${isTop3 ? 'top-recommendation' : ''}" style="
                        border: ${isWithin1km ? '2px solid #28a745' : (isTop3 ? '2px solid #667eea' : '1px solid #e0e0e0')};
                        border-radius: 12px;
                        padding: 1rem;
                        margin-bottom: 1rem;
                        background: ${isWithin1km ? 'linear-gradient(135deg, #28a74515 0%, #20c99715 100%)' : (isTop3 ? 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)' : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)')};
                        cursor: pointer;
                        transition: all 0.3s ease;
                        position: relative;
                    " onclick="focusOnSpot(${spot.lat}, ${spot.lng}); closeRecommendationsModal();">
                        ${isWithin1km ? '<div style="position: absolute; top: -8px; right: 10px; background: #28a745; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: bold;">WITHIN 1KM</div>' : (isTop3 ? '<div style="position: absolute; top: -8px; right: 10px; background: #667eea; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: bold;">NEAREST #' + (index + 1) + '</div>' : '')}
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin: 0 0 0.5rem 0; color: #333;">
                                    ${index + 1}. ${spot.name || 'Parking Spot'}
                                </h4>
                                <div style="display: flex; gap: 1rem; font-size: 0.9rem; color: #666; flex-wrap: wrap;">
                                    <span><i class="fas fa-car"></i> ${(spot.type || 'surface').replace('_', ' ')}</span>
                                    <span><i class="fas fa-money-bill-wave"></i> ${spot.fee === 'yes' ? 'Paid' : 'Free'}</span>
                                    <span><i class="fas fa-unlock"></i> ${(spot.access || 'public').charAt(0).toUpperCase() + (spot.access || 'public').slice(1)}</span>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="
                                    background: ${isWithin1km ? '#28a745' : (distance <= 2.0 ? '#ffc107' : '#dc3545')};
                                    color: white;
                                    padding: 0.25rem 0.75rem;
                                    border-radius: 20px;
                                    font-size: 0.8rem;
                                    font-weight: 600;
                                    margin-bottom: 0.5rem;
                                ">
                                    ${distance.toFixed(1)} km
                                </div>
                                <div style="font-size: 0.8rem; color: #10b981;">
                                    <i class="fas fa-check-circle"></i> Available
                                </div>
                            </div>
                        </div>
                    </div>
                `}).join('')}
            </div>
            
            <div style="text-align: center; margin-top: 1.5rem;">
                <button class="btn btn-primary" onclick="closeRecommendationsModal()" style="margin-right: 10px;">
                    <i class="fas fa-map"></i> View on Map
                </button>
                <button class="btn btn-secondary" onclick="refreshRecommendations()">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
        </div>
    `;
    
    return modal;
}

// Close recommendations modal
function closeRecommendationsModal() {
    const modal = document.getElementById('recommendationsModal');
    if (modal) {
        modal.remove();
    }
}

// Refresh recommendations
function refreshRecommendations() {
    closeRecommendationsModal();
    getSmartRecommendations();
}

// Highlight recommended spots on map with enhanced styling
function highlightRecommendedSpots(spots) {
    // Clear existing recommendation markers
    if (window.recommendationMarkers) {
        window.recommendationMarkers.forEach(marker => map.removeLayer(marker));
    }
    window.recommendationMarkers = [];
    
    // Add numbered markers for recommended spots with different styles for top 3
    spots.forEach((spot, index) => {
        const isTop3 = index < 3;
        const distance = spot.distance_km || spot.distance || 0;
        
        const marker = L.marker([spot.lat, spot.lng], {
            icon: L.divIcon({
                className: 'recommendation-marker',
                html: `
                    <div style="
                        background: ${isTop3 ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
                        color: white;
                        width: ${isTop3 ? '36px' : '30px'};
                        height: ${isTop3 ? '36px' : '30px'};
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: ${isTop3 ? '16px' : '14px'};
                        border: 3px solid white;
                        box-shadow: 0 4px 15px ${isTop3 ? 'rgba(255, 107, 107, 0.6)' : 'rgba(102, 126, 234, 0.4)'};
                        animation: ${isTop3 ? 'pulse 1.5s infinite' : 'none'};
                        z-index: ${1000 - index};
                    ">
                        ${index + 1}
                    </div>
                `,
                iconSize: [isTop3 ? 42 : 36, isTop3 ? 42 : 36],
                iconAnchor: [isTop3 ? 21 : 18, isTop3 ? 21 : 18]
            })
        });
        
        marker.addTo(map);
        window.recommendationMarkers.push(marker);
        
        marker.bindPopup(`
            <div style="text-align: center; min-width: 200px;">
                <h4>🤖 AI Recommended #${index + 1} ${isTop3 ? '⭐' : ''}</h4>
                <p><strong>${spot.name || 'Parking Spot'}</strong></p>
                <div style="margin: 10px 0;">
                    <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">
                        📍 ${distance.toFixed(1)} km away
                    </span>
                </div>
                <p>🚗 ${(spot.type || 'surface').replace('_', ' ')}</p>
                <p>💰 ${spot.fee === 'yes' ? 'Paid Parking' : 'Free Parking'}</p>
                ${isTop3 ? '<p style="color: #ff6b6b; font-weight: bold;">🏆 Top Recommendation!</p>' : ''}
                <button onclick="bookSpot('${spot.id || 'spot-' + index}')" class="btn btn-primary" style="margin-top: 0.5rem;">
                    📅 Book Now
                </button>
            </div>
        `);
    });
}

// Focus on specific spot
function focusOnSpot(lat, lng) {
    map.setView([lat, lng], 16);
    
    // Find and highlight the marker
    markers.forEach(marker => {
        const markerLatLng = marker.getLatLng();
        if (Math.abs(markerLatLng.lat - lat) < 0.0001 && Math.abs(markerLatLng.lng - lng) < 0.0001) {
            marker.openPopup();
        }
    });
}

// Notification system
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>${message}</span>
    `;
    
    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        font-weight: 500;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}