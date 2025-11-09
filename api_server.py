from flask import Flask, jsonify, request
from flask_cors import CORS
from parking_recommender import ParkingRecommender
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for web integration

# Initialize the recommender
recommender = ParkingRecommender()
recommender.load_data()
recommender.preprocess_data()
recommender.train_model()

@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    """API endpoint to get parking recommendations"""
    try:
        # Get user location from query parameters
        user_lat = float(request.args.get('lat', 12.9716))
        user_lng = float(request.args.get('lng', 77.5946))
        n_spots = int(request.args.get('count', 5))
        
        # Get optional filters
        parking_type = request.args.get('type')
        fee_type = request.args.get('fee')
        status_filter = request.args.get('status', 'available')
        
        # Build filters
        filters = {}
        if parking_type:
            filters['type'] = [parking_type]
        if fee_type:
            filters['fee'] = [fee_type]
        if status_filter:
            filters['status'] = [status_filter]
        
        # Get recommendations
        recommendations = recommender.recommend_nearest_spots(
            user_lat, user_lng, n_spots, filters if filters else None
        )
        
        # Convert to JSON-friendly format
        result = []
        for _, spot in recommendations.iterrows():
            result.append({
                'name': spot['name'],
                'lat': float(spot['lat']),
                'lng': float(spot['lng']),
                'type': spot['type'],
                'fee': spot['fee'],
                'access': spot['access'],
                'status': spot['status'],
                'distance_km': round(float(spot['distance_km']), 2),
                'distance_text': f"{spot['distance_km']:.1f} km away"
            })
        
        return jsonify({
            'success': True,
            'user_location': {'lat': user_lat, 'lng': user_lng},
            'recommendations': result,
            'count': len(result)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Where2Park ML API',
        'total_spots': len(recommender.parking_data)
    })

@app.route('/api/spots', methods=['GET'])
def get_all_spots():
    """Get all parking spots"""
    try:
        spots = []
        for _, spot in recommender.parking_data.iterrows():
            spots.append({
                'name': spot['name'],
                'lat': float(spot['lat']),
                'lng': float(spot['lng']),
                'type': spot['type'],
                'fee': spot['fee'],
                'access': spot['access'],
                'status': spot['status']
            })
        
        return jsonify({
            'success': True,
            'spots': spots,
            'count': len(spots)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    print("🚗 Starting Where2Park ML API Server...")
    print("📍 Endpoints available:")
    print("   GET /api/recommendations?lat=12.9716&lng=77.5946&count=5")
    print("   GET /api/health")
    print("   GET /api/spots")
    print("\n🌐 Server running on http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)