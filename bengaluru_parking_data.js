// Bengaluru Parking Spots Data (from CSV)
const bengaluruParkingData = [
    {
        "Place_Name": "Garuda Mall Parking",
        "Latitude": 12.970381,
        "Longitude": 77.609419,
        "parking_type": "underground",
        "fee": "yes",
        "access": "customers"
    },
    {
        "Place_Name": "Street Parking Near Metro",
        "Latitude": 12.960064,
        "Longitude": 77.645437,
        "parking_type": "street_side",
        "fee": "no",
        "access": "permissive"
    },
    {
        "Place_Name": "Nandini Restaurant Parking",
        "Latitude": 12.989144,
        "Longitude": 77.733772,
        "parking_type": "surface",
        "fee": "no",
        "access": "customers"
    },
    {
        "Place_Name": "Corporation Circle Parking",
        "Latitude": 12.894851,
        "Longitude": 77.598462,
        "parking_type": "surface",
        "fee": "no",
        "access": "permissive"
    },
    {
        "Place_Name": "ISKCON Temple Parking",
        "Latitude": 13.009272,
        "Longitude": 77.551624,
        "parking_type": "surface",
        "fee": "no",
        "access": "permissive"
    },
    {
        "Place_Name": "Phoenix Market Underground",
        "Latitude": 12.996845,
        "Longitude": 77.696101,
        "parking_type": "underground",
        "fee": "yes",
        "access": "customers"
    },
    {
        "Place_Name": "Nexus Mall Parking",
        "Latitude": 12.934854,
        "Longitude": 77.611008,
        "parking_type": "multi-storey",
        "fee": "yes",
        "access": "customers"
    },
    {
        "Place_Name": "Yeswantapur Station Parking",
        "Latitude": 13.023562,
        "Longitude": 77.550701,
        "parking_type": "surface",
        "fee": "no",
        "access": "permissive"
    },
    {
        "Place_Name": "Brigade Road Parking",
        "Latitude": 12.969820,
        "Longitude": 77.620545,
        "parking_type": "surface",
        "fee": "yes",
        "access": "permissive"
    },
    {
        "Place_Name": "Cubbon Park Parking",
        "Latitude": 12.976231,
        "Longitude": 77.590674,
        "parking_type": "surface",
        "fee": "no",
        "access": "permissive"
    },
    {
        "Place_Name": "Bangalore Central Mall",
        "Latitude": 12.927923,
        "Longitude": 77.627108,
        "parking_type": "multi-storey",
        "fee": "yes",
        "access": "customers"
    },
    {
        "Place_Name": "Lalbagh Main Gate",
        "Latitude": 12.950717,
        "Longitude": 77.584806,
        "parking_type": "surface",
        "fee": "no",
        "access": "permissive"
    },
    {
        "Place_Name": "UB City Mall",
        "Latitude": 12.972442,
        "Longitude": 77.590065,
        "parking_type": "underground",
        "fee": "yes",
        "access": "customers"
    },
    {
        "Place_Name": "Forum Mall Koramangala",
        "Latitude": 12.935025,
        "Longitude": 77.614480,
        "parking_type": "multi-storey",
        "fee": "yes",
        "access": "customers"
    },
    {
        "Place_Name": "Indiranagar Metro Station",
        "Latitude": 12.971599,
        "Longitude": 77.641490,
        "parking_type": "surface",
        "fee": "no",
        "access": "permissive"
    },
    {
        "Place_Name": "Whitefield IT Park",
        "Latitude": 12.969910,
        "Longitude": 77.750122,
        "parking_type": "surface",
        "fee": "no",
        "access": "private"
    },
    {
        "Place_Name": "Electronic City Phase 1",
        "Latitude": 12.845681,
        "Longitude": 77.661049,
        "parking_type": "surface",
        "fee": "no",
        "access": "private"
    },
    {
        "Place_Name": "Koramangala 5th Block",
        "Latitude": 12.934533,
        "Longitude": 77.615829,
        "parking_type": "street_side",
        "fee": "no",
        "access": "permissive"
    },
    {
        "Place_Name": "HSR Layout Sector 1",
        "Latitude": 12.917957,
        "Longitude": 77.641640,
        "parking_type": "surface",
        "fee": "no",
        "access": "permissive"
    },
    {
        "Place_Name": "Jayanagar 4th Block",
        "Latitude": 12.924142,
        "Longitude": 77.583755,
        "parking_type": "street_side",
        "fee": "no",
        "access": "permissive"
    }
];

// Generate random status for each spot
function generateParkingStatus() {
    return bengaluruParkingData.map((spot, index) => ({
        id: `spot-${index + 1}`,
        name: spot.Place_Name,
        lat: spot.Latitude,
        lng: spot.Longitude,
        type: spot.parking_type,
        fee: spot.fee,
        access: spot.access,
        status: Math.random() > 0.3 ? 'available' : (Math.random() > 0.5 ? 'booked' : 'occupied')
    }));
}

// Export data
window.bengaluruParkingData = generateParkingStatus();