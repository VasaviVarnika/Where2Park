# Where2Park - ML Integration Guide

## 🚗 Overview
This guide explains how to run the Where2Park project with ML-powered parking recommendations.

## 🚀 Quick Start

### Option 1: Automated Setup
```bash
# Run the automated setup script
setup_and_run.bat
```

### Option 2: Manual Setup

1. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Test ML Recommender**
   ```bash
   python parking_recommender.py
   ```

3. **Start ML API Server**
   ```bash
   python api_server.py
   ```

4. **Open Web Application**
   - Open `index.html` in your browser
   - Or run `run_project.bat`

## 🧠 ML Features

### 1. Smart Recommendations
- **Algorithm**: K-Nearest Neighbors with Haversine distance
- **Features**: Location-based recommendations, filtering by type/fee/status
- **API Endpoint**: `GET /api/recommendations?lat=12.9716&lng=77.5946`

### 2. Real-time Integration
- **Web Integration**: JavaScript ML engine connects to Python API
- **Fallback**: Works offline with local distance calculations
- **UI Enhancement**: Smart recommendation button in hero section

### 3. Interactive Features
- **Smart Button**: Click "Smart Recommendations" for AI suggestions
- **Map Highlighting**: Recommended spots highlighted with numbered markers
- **Distance Calculation**: Shows exact distance to each parking spot

## 📊 API Endpoints

### Get Recommendations
```
GET /api/recommendations
Parameters:
- lat: User latitude (required)
- lng: User longitude (required)  
- count: Number of recommendations (default: 5)
- type: Filter by parking type (optional)
- fee: Filter by fee structure (optional)
- status: Filter by availability (default: available)

Example:
http://localhost:5000/api/recommendations?lat=12.9716&lng=77.5946&count=3&type=underground
```

### Health Check
```
GET /api/health
Returns: API status and total spots count
```

### All Spots
```
GET /api/spots
Returns: Complete list of parking spots
```

## 🔧 Technical Architecture

### Frontend (Web App)
- **HTML5**: Modern responsive design
- **CSS3**: Glassmorphism UI with animations
- **JavaScript**: Real-time Firebase integration + ML API calls
- **Leaflet.js**: Interactive mapping
- **Firebase**: Authentication and real-time database

### Backend (ML API)
- **Python Flask**: RESTful API server
- **scikit-learn**: Machine learning algorithms
- **pandas/numpy**: Data processing
- **CORS enabled**: Cross-origin requests from web app

### ML Model
- **Algorithm**: K-Nearest Neighbors (KNN)
- **Distance Metric**: Haversine (great circle distance)
- **Features**: Latitude, longitude, parking type, fee, access
- **Preprocessing**: Label encoding for categorical variables

## 📱 Usage Instructions

### For Users
1. **Open the web app** in your browser
2. **Sign up/Login** to access booking features
3. **Click "Smart Recommendations"** for AI-powered suggestions
4. **View recommendations** sorted by distance
5. **Click any recommendation** to focus on map
6. **Book parking spots** by clicking markers

### For Developers
1. **Modify `parking_recommender.py`** to enhance ML algorithms
2. **Update `api_server.py`** to add new endpoints
3. **Edit `ml_integration.js`** to change UI behavior
4. **Extend Firebase integration** for real-time ML updates

## 🎯 Key Features

### Real-time Synchronization
- **Firebase Integration**: All spot updates sync across devices instantly
- **BookMyShow-style**: Real-time booking status updates
- **Notifications**: Users get notified when spots change status

### ML-Powered Recommendations
- **Location-based**: Finds nearest available spots
- **Smart Filtering**: Considers user preferences
- **Distance Calculation**: Accurate haversine distance
- **Fallback Mode**: Works without API connection

### Community Features
- **Add Spots**: Users can contribute new parking locations
- **Real-time Updates**: New spots appear instantly for all users
- **Permanent Storage**: All additions saved to Firebase

## 🔍 Troubleshooting

### ML API Not Working
- Check if Python dependencies are installed: `pip install -r requirements.txt`
- Verify API is running: Visit `http://localhost:5000/api/health`
- Check console for errors in browser developer tools

### Web App Issues
- Ensure Firebase configuration is correct
- Check internet connection for Firebase sync
- Verify all JavaScript files are loaded properly

### Map Not Loading
- Check Leaflet.js CDN connection
- Verify map container has proper dimensions
- Ensure geolocation permissions are granted

## 📈 Performance Optimization

### ML Model
- **Efficient Algorithm**: KNN with ball tree for fast nearest neighbor search
- **Preprocessing**: Categorical encoding reduces computation time
- **Caching**: API responses can be cached for better performance

### Web Application
- **Lazy Loading**: ML features load after main app initialization
- **Fallback System**: Local calculations when API unavailable
- **Optimized Markers**: Efficient marker rendering and updates

## 🌐 Deployment Options

### Local Development
- Run `setup_and_run.bat` for complete local setup
- Access web app via file:// protocol or local server
- ML API runs on localhost:5000

### Production Deployment
- **Frontend**: Deploy to Netlify, Vercel, or GitHub Pages
- **ML API**: Deploy to Heroku, AWS, or Google Cloud
- **Database**: Firebase handles scaling automatically

## 📊 Data Sources

### Current Dataset
- **300+ parking spots** in Bangalore
- **Real locations**: Malls, metro stations, temples, restaurants
- **Comprehensive info**: Type, fee, access, coordinates

### Data Format
```json
{
  "name": "Garuda Mall Parking",
  "lat": 12.9703806,
  "lng": 77.6094191,
  "type": "underground",
  "fee": "no",
  "access": "permissive", 
  "status": "available"
}
```

## 🔮 Future Enhancements

### ML Improvements
- **Predictive Analytics**: Forecast parking availability
- **User Behavior**: Learn from booking patterns
- **Traffic Integration**: Consider real-time traffic data
- **Weather Factors**: Adjust recommendations based on weather

### Feature Additions
- **Route Planning**: Integration with navigation apps
- **Payment Gateway**: In-app parking fee payments
- **Reviews & Ratings**: User feedback system
- **Push Notifications**: Mobile app with notifications

---

**Built for Smart India Hackathon 2024**
**Team: Where2Park - Smart Parking Solution**