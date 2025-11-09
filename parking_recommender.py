import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import LabelEncoder
import json
import math
import random
from datetime import datetime

class ParkingRecommender:
    def __init__(self):
        self.model = NearestNeighbors(n_neighbors=10, algorithm='ball_tree', metric='haversine')
        self.label_encoders = {}
        self.parking_data = None
        
    def haversine_distance(self, lat1, lon1, lat2, lon2):
        """Calculate the great circle distance between two points on earth"""
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        return c * r
    
    def load_data(self, data_source='local'):
        """Load parking data from various sources"""
        if data_source == 'local':
            # Enhanced dataset with realistic status distribution
            parking_spots = [
                {"name": "Garuda Mall Parking", "lat": 12.9703806, "lng": 77.6094191, "type": "underground", "fee": "no", "access": "permissive"},
                {"name": "Street Parking Near Metro", "lat": 12.9600641, "lng": 77.6454368, "type": "street_side", "fee": "no", "access": "permissive"},
                {"name": "Nandini Restaurant Parking", "lat": 12.989144, "lng": 77.7337716, "type": "surface", "fee": "no", "access": "permissive"},
                {"name": "Corporation Circle Parking", "lat": 12.9752226, "lng": 77.5955056, "type": "surface", "fee": "no", "access": "permissive"},
                {"name": "ISKCON Temple Parking", "lat": 13.0092724, "lng": 77.5516244, "type": "surface", "fee": "no", "access": "permissive"},
                {"name": "Phoenix Market Underground", "lat": 12.996845, "lng": 77.6961012, "type": "underground", "fee": "no", "access": "permissive"},
                {"name": "Nexus Mall Parking", "lat": 12.9348541, "lng": 77.6110076, "type": "multi-storey", "fee": "no", "access": "permissive"},
                {"name": "Yeswantapur Station Parking", "lat": 13.0235615, "lng": 77.5507008, "type": "surface", "fee": "no", "access": "permissive"},
                {"name": "Brigade Road Parking", "lat": 12.9698196, "lng": 77.6205452, "type": "surface", "fee": "no", "access": "permissive"},
                {"name": "Cubbon Park Parking", "lat": 12.9762308, "lng": 77.5906735, "type": "surface", "fee": "no", "access": "permissive"},
                {"name": "Bangalore Central Mall", "lat": 12.9279232, "lng": 77.6271078, "type": "multi-storey", "fee": "no", "access": "permissive"},
                {"name": "Lalbagh Main Gate", "lat": 12.9507167, "lng": 77.5848061, "type": "surface", "fee": "no", "access": "permissive"},
                {"name": "UB City Mall Parking", "lat": 12.9716, "lng": 77.5946, "type": "underground", "fee": "no", "access": "permissive"},
                {"name": "Forum Mall Koramangala", "lat": 12.9279, "lng": 77.6271, "type": "multi-storey", "fee": "no", "access": "permissive"},
                {"name": "Orion Mall Parking", "lat": 13.0827, "lng": 77.5877, "type": "multi-storey", "fee": "no", "access": "permissive"},
                {"name": "Electronic City Parking", "lat": 12.8456, "lng": 77.6603, "type": "surface", "fee": "no", "access": "permissive"},
                {"name": "Whitefield Tech Park", "lat": 12.9698, "lng": 77.7500, "type": "surface", "fee": "no", "access": "permissive"},
                {"name": "Indiranagar Metro Station", "lat": 12.9784, "lng": 77.6408, "type": "surface", "fee": "no", "access": "permissive"},
                {"name": "Koramangala Forum Parking", "lat": 12.9352, "lng": 77.6245, "type": "underground", "fee": "no", "access": "permissive"},
                {"name": "JP Nagar Metro Parking", "lat": 12.9081, "lng": 77.5831, "type": "surface", "fee": "no", "access": "permissive"}
            ]
            
            # Add realistic status distribution (70% available, 20% occupied, 10% booked)
            for spot in parking_spots:
                rand = random.random()
                if rand < 0.7:
                    spot['status'] = 'available'
                elif rand < 0.9:
                    spot['status'] = 'occupied'
                else:
                    spot['status'] = 'booked'
            
            self.parking_data = pd.DataFrame(parking_spots)
        elif data_source == 'csv':
            # Load from CSV file if available
            try:
                self.parking_data = pd.read_csv('bengaluru_parking_spots.csv')
                # Add status column if not present
                if 'status' not in self.parking_data.columns:
                    statuses = ['available'] * int(len(self.parking_data) * 0.7) + \
                              ['occupied'] * int(len(self.parking_data) * 0.2) + \
                              ['booked'] * int(len(self.parking_data) * 0.1)
                    random.shuffle(statuses)
                    self.parking_data['status'] = statuses[:len(self.parking_data)]
            except FileNotFoundError:
                print("CSV file not found, falling back to local data")
                return self.load_data('local')
        
        return self.parking_data
    
    def preprocess_data(self):
        """Preprocess the data for ML model"""
        # Encode categorical variables
        categorical_columns = ['type', 'fee', 'access', 'status']
        
        for col in categorical_columns:
            if col in self.parking_data.columns:
                le = LabelEncoder()
                self.parking_data[f'{col}_encoded'] = le.fit_transform(self.parking_data[col])
                self.label_encoders[col] = le
        
        # Convert coordinates to radians for haversine distance
        self.parking_data['lat_rad'] = np.radians(self.parking_data['lat'])
        self.parking_data['lng_rad'] = np.radians(self.parking_data['lng'])
        
    def train_model(self):
        """Train the nearest neighbors model"""
        # Use lat/lng in radians for haversine distance
        coordinates = self.parking_data[['lat_rad', 'lng_rad']].values
        self.model.fit(coordinates)
        
    def recommend_nearest_spots(self, user_lat, user_lng, n_recommendations=5, filters=None):
        """Recommend nearest parking spots based on user location with smart filtering"""
        # First apply filters to get available spots
        filtered_data = self.parking_data.copy()
        
        # Apply filters if provided
        if filters:
            if 'status' in filters:
                filtered_data = filtered_data[filtered_data['status'].isin(filters['status'])]
            if 'type' in filters:
                filtered_data = filtered_data[filtered_data['type'].isin(filters['type'])]
            if 'fee' in filters:
                filtered_data = filtered_data[filtered_data['fee'].isin(filters['fee'])]
        
        # If no spots match filters, return empty result
        if len(filtered_data) == 0:
            return pd.DataFrame()
        
        # Calculate distances for all filtered spots
        filtered_data = filtered_data.copy()
        filtered_data['distance_km'] = [
            self.haversine_distance(user_lat, user_lng, row['lat'], row['lng'])
            for _, row in filtered_data.iterrows()
        ]
        
        # Sort by distance and return top recommendations
        recommended_spots = filtered_data.sort_values('distance_km')
        
        return recommended_spots[['name', 'lat', 'lng', 'type', 'fee', 'access', 'status', 'distance_km']].head(n_recommendations)
    
    def get_recommendations_json(self, user_lat, user_lng, n_recommendations=5, filters=None):
        """Get recommendations in JSON format for web integration"""
        recommendations = self.recommend_nearest_spots(user_lat, user_lng, n_recommendations, filters)
        return recommendations.to_json(orient='records', indent=2)

# Example usage and API endpoint simulation
def create_recommendation_api():
    """Create a simple API for parking recommendations"""
    recommender = ParkingRecommender()
    recommender.load_data()
    recommender.preprocess_data()
    recommender.train_model()
    
    def get_recommendations(user_lat, user_lng, filters=None):
        return recommender.recommend_nearest_spots(user_lat, user_lng, filters=filters)
    
    return get_recommendations

# Test the recommender
if __name__ == "__main__":
    # Initialize recommender
    recommender = ParkingRecommender()
    recommender.load_data()
    recommender.preprocess_data()
    recommender.train_model()
    
    # Test with a sample location (Bangalore city center)
    test_lat, test_lng = 12.9716, 77.5946
    
    print("🚗 Where2Park - ML Parking Recommender")
    print("=" * 50)
    print(f"User Location: {test_lat}, {test_lng}")
    print("\n📍 Nearest Available Parking Spots:")
    
    # Get recommendations
    recommendations = recommender.recommend_nearest_spots(test_lat, test_lng)
    
    for i, (_, spot) in enumerate(recommendations.iterrows(), 1):
        print(f"\n{i}. {spot['name']}")
        print(f"   📍 Location: {spot['lat']:.4f}, {spot['lng']:.4f}")
        print(f"   🚗 Type: {spot['type'].replace('_', ' ').title()}")
        print(f"   💰 Fee: {'Free' if spot['fee'] == 'no' else 'Paid'}")
        print(f"   🔓 Access: {spot['access'].title()}")
        print(f"   ✅ Status: {spot['status'].title()}")
        print(f"   📏 Distance: {spot['distance_km']:.2f} km")
    
    # Test with filters
    print("\n" + "=" * 50)
    print("🔍 Filtered Recommendations (Underground only):")
    
    filtered_recommendations = recommender.recommend_nearest_spots(
        test_lat, test_lng, 
        filters={'type': ['underground'], 'status': ['available']}
    )
    
    for i, (_, spot) in enumerate(filtered_recommendations.iterrows(), 1):
        print(f"\n{i}. {spot['name']}")
        print(f"   📏 Distance: {spot['distance_km']:.2f} km")
        print(f"   🚗 Type: {spot['type'].replace('_', ' ').title()}")
    
    # Export recommendations as JSON for web integration
    json_recommendations = recommender.get_recommendations_json(test_lat, test_lng)
    
    with open('parking_recommendations.json', 'w') as f:
        f.write(json_recommendations)
    
    print(f"\n💾 Recommendations exported to 'parking_recommendations.json'")
    print("🌐 Ready for web integration!")