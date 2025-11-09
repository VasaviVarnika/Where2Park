    async loadParkingData() {
        // Load full dataset from CSV or use comprehensive local data
        try {
            const response = await fetch('bengaluru_parking_spots.csv');
            const csvText = await response.text();
            this.parkingSpots = this.parseCSV(csvText);
            console.log(`Client ML loaded ${this.parkingSpots.length} spots from CSV`);
        } catch (error) {
            console.log('Loading comprehensive local dataset...');
            this.loadComprehensiveLocalData();
            console.log(`Client ML loaded ${this.parkingSpots.length} spots from local data`);
        }
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        const spots = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= 3 && values[1] && values[2]) {
                const spot = {
                    name: values[0] || `Parking Spot ${i}`,
                    lat: parseFloat(values[1]),
                    lng: parseFloat(values[2]),
                    type: values[3] || 'surface',
                    fee: values[4] || 'no',
                    access: values[5] || 'permissive',
                    status: Math.random() < 0.6 ? 'available' : Math.random() < 0.8 ? 'occupied' : 'booked',
                    id: 'csv-' + i
                };
                if (!isNaN(spot.lat) && !isNaN(spot.lng)) {
                    spots.push(spot);
                }
            }
        }
        return spots;
    }

    loadComprehensiveLocalData() {
        // Comprehensive parking spots dataset - fallback when CSV is not available
        const baseSpots = [
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
        this.parkingSpots = baseSpots.map((spot, index) => ({
            ...spot,
            id: 'ml-' + (index + 1),
            status: Math.random() < 0.6 ? 'available' : Math.random() < 0.8 ? 'occupied' : 'booked'
        }));
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

    getRecommendations(userLat, userLng, options = {}) {
        // Use global parkingData if available (more up-to-date)
        const dataSource = window.parkingData || this.parkingSpots;
        
        if (!dataSource || dataSource.length === 0) {
            console.warn('No parking data available for recommendations');
            return [];
        }
        
        // Calculate distances for all available spots
        const availableSpots = dataSource
            .filter(spot => spot.status === 'available')
            .map(spot => ({
                ...spot,
                distance_km: this.calculateDistance(userLat, userLng, spot.lat, spot.lng)
            }))
            .sort((a, b) => a.distance_km - b.distance_km);

        // First try to find spots within 1km
        const spotsWithin1km = availableSpots.filter(spot => spot.distance_km <= 1.0);
        
        if (spotsWithin1km.length > 0) {
            // Return spots within 1km, up to requested count
            return spotsWithin1km.slice(0, options.count || 5);
        } else {
            // No spots within 1km, return nearest available spots
            return availableSpots.slice(0, options.count || 5);
        }
    }
}

// Initialize client-side ML recommender


    async loadParkingData() {
        // Load full dataset from CSV or use comprehensive local data
        try {
            const response = await fetch('bengaluru_parking_spots.csv');
            const csvText = await response.text();
            this.parkingSpots = this.parseCSV(csvText);
            console.log(`Client ML loaded ${this.parkingSpots.length} spots from CSV`);
        } catch (error) {
            console.log('Loading comprehensive local dataset...');
            this.loadComprehensiveLocalData();
            console.log(`Client ML loaded ${this.parkingSpots.length} spots from local data`);
        }
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const spots = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= 3 && values[1] && values[2]) {
                const spot = {
                    name: values[0] || `Parking Spot ${i}`,
                    lat: parseFloat(values[1]),
                    lng: parseFloat(values[2]),
                    type: values[3] || 'surface',
                    fee: values[4] || 'no',
                    access: values[5] || 'permissive',
                    status: Math.random() < 0.6 ? 'available' : Math.random() < 0.8 ? 'occupied' : 'booked',
                    id: 'csv-' + i
                };
                if (!isNaN(spot.lat) && !isNaN(spot.lng)) {
                    spots.push(spot);
                }
            }
        }
        return spots;
    }

    loadComprehensiveLocalData() {
        // Comprehensive parking spots dataset - fallback when CSV is not available
        const baseSpots = [
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
        this.parkingSpots = baseSpots.map((spot, index) => ({
            ...spot,
            id: 'ml-' + (index + 1),
            status: Math.random() < 0.6 ? 'available' : Math.random() < 0.8 ? 'occupied' : 'booked'
        }));
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

    getRecommendations(userLat, userLng, options = {}) {
        // Use global parkingData if available (more up-to-date)
        const dataSource = window.parkingData || this.parkingSpots;
        
        if (!dataSource || dataSource.length === 0) {
            console.warn('No parking data available for recommendations');
            return [];
        }
        
        // Calculate distances for all available spots
        const availableSpots = dataSource
            .filter(spot => spot.status === 'available')
            .map(spot => ({
                ...spot,
                distance_km: this.calculateDistance(userLat, userLng, spot.lat, spot.lng)
            }))
            .sort((a, b) => a.distance_km - b.distance_km);

        // First try to find spots within 1km
        const spotsWithin1km = availableSpots.filter(spot => spot.distance_km <= 1.0);
        
        if (spotsWithin1km.length > 0) {
            // Return spots within 1km, up to requested count
            return spotsWithin1km.slice(0, options.count || 5);
        } else {
            // No spots within 1km, return nearest available spots
            return availableSpots.slice(0, options.count || 5);
        }
    }
}

// Initialize client-side ML recommender
window.clientML = new ClientMLRecommender();