// ML Integration for Where2Park
// This file adds ML-powered recommendations to your existing application

class MLRecommendationEngine {
    constructor() {
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.userLocation = null;
        this.isApiAvailable = false;
        this.checkApiHealth();
    }

    async checkApiHealth() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            if (response.ok) {
                this.isApiAvailable = true;
                console.log('✅ ML API is available');
                this.showMLFeatures();
            }
        } catch (error) {
            console.log('⚠️ ML API not available, using fallback recommendations');
            this.isApiAvailable = false;
        }
    }

    showMLFeatures() {
        // Add ML recommendation button to the interface
        const heroSection = document.querySelector('.hero-cta');
        if (heroSection && !document.getElementById('mlRecommendBtn')) {
            const mlButton = document.createElement('button');
            mlButton.id = 'mlRecommendBtn';
            mlButton.className = 'btn btn-hero ml-btn';
            mlButton.innerHTML = `
                <i class="fas fa-brain"></i>
                Smart Recommendations
            `;
            mlButton.onclick = () => this.getSmartRecommendations();
            heroSection.appendChild(mlButton);
        }

        // Add ML indicator to map controls
        const mapControls = document.querySelector('.map-controls');
        if (mapControls && !document.getElementById('mlIndicator')) {
            const mlIndicator = document.createElement('div');
            mlIndicator.id = 'mlIndicator';
            mlIndicator.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 0.5rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                    text-align: center;
                    font-size: 0.8rem;
                ">
                    <i class="fas fa-brain"></i>
                    ML Powered
                </div>
            `;
            mapControls.insertBefore(mlIndicator, mapControls.firstChild);
        }
    }

    async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        resolve(this.userLocation);
                    },
                    (error) => {
                        // Fallback to Bangalore center
                        this.userLocation = { lat: 12.9716, lng: 77.5946 };
                        resolve(this.userLocation);
                    }
                );
            } else {
                this.userLocation = { lat: 12.9716, lng: 77.5946 };
                resolve(this.userLocation);
            }
        });
    }

    async getRecommendations(lat, lng, options = {}) {
        if (!this.isApiAvailable) {
            return this.getFallbackRecommendations(lat, lng);
        }

        try {
            const params = new URLSearchParams({
                lat: lat,
                lng: lng,
                count: options.count || 5
            });

            if (options.type) params.append('type', options.type);
            if (options.fee) params.append('fee', options.fee);
            if (options.status) params.append('status', options.status);

            const response = await fetch(`${this.apiBaseUrl}/recommendations?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();

            if (data.success && data.recommendations) {
                // Ensure distance_km is available for each recommendation
                return data.recommendations.map(rec => ({
                    ...rec,
                    distance_km: rec.distance_km || rec.distance || 0
                }));
            } else {
                throw new Error(data.error || 'No recommendations returned');
            }
        } catch (error) {
            console.error('ML API error:', error);
            return this.getFallbackRecommendations(lat, lng);
        }
    }

    getFallbackRecommendations(userLat, userLng) {
        // Fallback using simple distance calculation
        const spots = window.parkingData || [];
        
        if (spots.length === 0) {
            console.warn('No parking data available for fallback recommendations');
            return [];
        }
        
        const spotsWithDistance = spots.map(spot => {
            const distance = this.calculateDistance(userLat, userLng, spot.lat, spot.lng);
            return { 
                ...spot, 
                distance_km: distance,
                distance: distance // For backward compatibility
            };
        });

        return spotsWithDistance
            .filter(spot => spot.status === 'available')
            .sort((a, b) => a.distance_km - b.distance_km)
            .slice(0, 5);
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    async getSmartRecommendations() {
        try {
            showNotification('🧠 Getting AI-powered parking recommendations...');
            
            const location = await this.getUserLocation();
            const recommendations = await this.getRecommendations(location.lat, location.lng, {
                status: 'available',
                count: 5
            });

            if (recommendations && recommendations.length > 0) {
                this.displayRecommendations(recommendations, location);
            } else {
                showNotification('❌ No available parking spots found in your area');
            }
            
        } catch (error) {
            console.error('Error getting recommendations:', error);
            showNotification('⚠️ Error getting recommendations. Please try again.');
        }
    }

    displayRecommendations(recommendations, userLocation) {
        // Use the global function to display recommendations
        if (typeof displayMLRecommendations === 'function') {
            displayMLRecommendations(recommendations, userLocation.lat, userLocation.lng);
        } else {
            // Fallback to creating modal directly
            const modal = this.createRecommendationsModal(recommendations, userLocation);
            document.body.appendChild(modal);
            modal.style.display = 'block';
            this.highlightRecommendedSpots(recommendations);
        }
    }

    createRecommendationsModal(recommendations, userLocation) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'recommendationsModal';
        
        const modalContent = `
            <div class="modal-content" style="max-width: 600px;">
                <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                <h2><i class="fas fa-brain"></i> Smart Parking Recommendations</h2>
                <p style="color: #666; margin-bottom: 1.5rem;">
                    Based on your location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}
                </p>
                
                <div class="recommendations-list">
                    ${recommendations.map((spot, index) => `
                        <div class="recommendation-item" style="
                            border: 1px solid #e0e0e0;
                            border-radius: 12px;
                            padding: 1rem;
                            margin-bottom: 1rem;
                            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                            cursor: pointer;
                            transition: all 0.3s ease;
                        " onclick="this.closest('.modal').remove(); focusOnSpot(${spot.lat}, ${spot.lng})">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h4 style="margin: 0 0 0.5rem 0; color: #333;">
                                        ${index + 1}. ${spot.name}
                                    </h4>
                                    <div style="display: flex; gap: 1rem; font-size: 0.9rem; color: #666;">
                                        <span><i class="fas fa-car"></i> ${spot.type.replace('_', ' ')}</span>
                                        <span><i class="fas fa-money-bill-wave"></i> ${spot.fee === 'no' ? 'Free' : 'Paid'}</span>
                                        <span><i class="fas fa-unlock"></i> ${spot.access}</span>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="
                                        background: #10b981;
                                        color: white;
                                        padding: 0.25rem 0.75rem;
                                        border-radius: 20px;
                                        font-size: 0.8rem;
                                        font-weight: 600;
                                        margin-bottom: 0.5rem;
                                    ">
                                        ${spot.distance_km} km
                                    </div>
                                    <div style="font-size: 0.8rem; color: #10b981;">
                                        <i class="fas fa-check-circle"></i> Available
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="text-align: center; margin-top: 1.5rem;">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-map"></i> View on Map
                    </button>
                </div>
            </div>
        `;
        
        modal.innerHTML = modalContent;
        return modal;
    }

    highlightRecommendedSpots(recommendations) {
        // Clear existing highlights
        if (window.recommendationMarkers) {
            window.recommendationMarkers.forEach(marker => map.removeLayer(marker));
        }
        window.recommendationMarkers = [];

        // Add special markers for recommended spots
        recommendations.forEach((spot, index) => {
            const marker = L.marker([spot.lat, spot.lng], {
                icon: L.divIcon({
                    className: 'recommendation-marker',
                    html: `
                        <div style="
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            width: 30px;
                            height: 30px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: bold;
                            font-size: 14px;
                            border: 3px solid white;
                            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                            animation: pulse 2s infinite;
                        ">
                            ${index + 1}
                        </div>
                    `,
                    iconSize: [36, 36],
                    iconAnchor: [18, 18]
                })
            });

            marker.addTo(map);
            window.recommendationMarkers.push(marker);

            // Add popup with recommendation info
            marker.bindPopup(`
                <div style="text-align: center;">
                    <h4>🧠 AI Recommended</h4>
                    <p><strong>${spot.name}</strong></p>
                    <p>📍 ${spot.distance_km} km away</p>
                    <p>🚗 ${spot.type.replace('_', ' ')}</p>
                </div>
            `);
        });

        // Fit map to show all recommendations
        if (recommendations.length > 0) {
            const group = new L.featureGroup(window.recommendationMarkers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
    }
}

// Global function to focus on a specific spot
function focusOnSpot(lat, lng) {
    map.setView([lat, lng], 16);
    
    // Find and open the marker popup
    markers.forEach(marker => {
        const markerLatLng = marker.getLatLng();
        if (Math.abs(markerLatLng.lat - lat) < 0.0001 && Math.abs(markerLatLng.lng - lng) < 0.0001) {
            marker.openPopup();
        }
    });
}

// Initialize ML engine when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the main app to initialize
    setTimeout(() => {
        window.mlEngine = new MLRecommendationEngine();
    }, 1000);
});

// Add CSS for ML features
const mlStyles = document.createElement('style');
mlStyles.textContent = `
    .ml-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        margin-left: 1rem;
    }
    
    .ml-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }
    
    .recommendation-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        border-color: #667eea !important;
    }
    
    .top-recommendation {
        position: relative;
        animation: glow 2s ease-in-out infinite alternate;
    }
    
    .user-location-marker {
        z-index: 1000;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    @keyframes glow {
        from { box-shadow: 0 0 5px rgba(102, 126, 234, 0.3); }
        to { box-shadow: 0 0 20px rgba(102, 126, 234, 0.6); }
    }
`;
document.head.appendChild(mlStyles);