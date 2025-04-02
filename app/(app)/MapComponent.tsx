import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker, Heatmap } from 'react-native-maps';
import { collection, doc, setDoc } from 'firebase/firestore';
import { FIREBASE_DB } from '../../FirebaseConfig';

interface MapComponentProps {
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  mapRef: React.RefObject<MapView>;
  heatmapData?: HeatmapPoint[];
  userLocations?: UserLocation[];
  onHeatmapRender?: (pointCount: number) => void;
}

interface HeatmapPoint {
  lat: number | { $numberDouble: string };
  lon: number | { $numberDouble: string };
  prediction: number | { $numberInt: string };
  metadata?: {
    windSpeed?: number;
    temperature?: number;
    humidity?: number;
  };
}

interface UserLocation {
  uid: string;
  email?: string;
  lat: number;
  lon: number;
}

interface UserSafetyStatus {
  [key: string]: {
    safe: boolean;
    minDistance: number;
  };
}

const MapComponent = ({ 
  currentLocation, 
  mapRef, 
  heatmapData = [], 
  userLocations = [],
  onHeatmapRender 
}: MapComponentProps) => {
  const [userSafetyStatus, setUserSafetyStatus] = useState<UserSafetyStatus>({});
  const [processedHeatmapPoints, setProcessedHeatmapPoints] = useState<{latitude: number, longitude: number, weight: number}[]>([]);

  // Calculate intensity based on prediction and metadata
  const calculateIntensity = (prediction: number, metadata?: {
    windSpeed?: number;
    temperature?: number;
    humidity?: number;
  }) => {
    // Base intensity from prediction
    const baseIntensity = prediction === 1 ? 0.8 : 0.2;
    
    // Factor in additional metadata if available
    let modifier = 1.0;
    
    if (metadata) {
      // Apply modifiers based on factors like:
      if (metadata.windSpeed) modifier *= (1 + (metadata.windSpeed / 100));
      if (metadata.temperature) modifier *= (1 + ((metadata.temperature - 25) / 50));
      if (metadata.humidity) modifier *= (1 - (metadata.humidity / 200));
    }
    
    return Math.min(1.0, baseIntensity * modifier);
  };

  useEffect(() => {
    if (!heatmapData || heatmapData.length === 0) {
      console.log('No heatmap data available');
      return;
    }
    
    console.log('Processing heatmap data:', heatmapData);
    
    const heatPoints = heatmapData.map(point => {
      const lat = parseFloat(typeof point.lat === 'object' && point.lat.$numberDouble ? point.lat.$numberDouble : point.lat as unknown as string);
      const lon = parseFloat(typeof point.lon === 'object' && point.lon.$numberDouble ? point.lon.$numberDouble : point.lon as unknown as string);
      const prediction = parseInt(typeof point.prediction === 'object' && point.prediction.$numberInt ? point.prediction.$numberInt : point.prediction as unknown as string, 10);
      
      const intensity = calculateIntensity(prediction, point.metadata);
      const naturalizedIntensity = intensity * (0.9 + Math.random() * 0.2); // Add +/-10% variation
      
      return {
        latitude: lat,
        longitude: lon,
        weight: naturalizedIntensity
      };
    }).filter(point => !isNaN(point.latitude) && !isNaN(point.longitude));
    
    if (heatPoints.length === 0) {
      console.warn('No valid heatmap points generated');
    } else {
      console.log(`Processed ${heatPoints.length} heatmap points`);
      setProcessedHeatmapPoints(heatPoints);
      
      if (onHeatmapRender) {
        onHeatmapRender(heatPoints.length);
      }
    }
  }, [heatmapData, onHeatmapRender]);

  // Calculate user safety based on heatmap proximity
  useEffect(() => {
    if (!userLocations || !heatmapData || heatmapData.length === 0 || userLocations.length === 0) return;
    
    console.log('Calculating safety status for users');
    
    const safetyUpdates: UserSafetyStatus = {};
    const DANGER_THRESHOLD = 0.00007; // Distance threshold in degrees (approx 5m)
    
    userLocations.forEach(user => {
      try {
        // Check if user is within danger zone of any heatmap point
        let minDistance = Number.MAX_VALUE;
        let inDanger = false;
        
        for (const point of heatmapData) {
          const lat = parseFloat(typeof point.lat === 'object' && point.lat.$numberDouble ? point.lat.$numberDouble : point.lat as unknown as string);
          const lon = parseFloat(typeof point.lon === 'object' && point.lon.$numberDouble ? point.lon.$numberDouble : point.lon as unknown as string);
          const prediction = parseInt(typeof point.prediction === 'object' && point.prediction.$numberInt ? point.prediction.$numberInt : point.prediction as unknown as string, 10);
          
          if (isNaN(lat) || isNaN(lon)) continue;
          
          // Only consider high-risk prediction points
          if (prediction === 1) {
            const distance = calculateDistance(user.lat, user.lon, lat, lon);
            minDistance = Math.min(minDistance, distance);
            
            if (distance < DANGER_THRESHOLD) {
              inDanger = true;
              break;
            }
          }
        }
        
        // Update safety status
        const isSafe = !inDanger;
        safetyUpdates[user.uid] = {
          safe: isSafe,
          minDistance
        };
        
        // Update in Firebase - using try/catch to handle permission errors
        if (user.email) {
          updateUserSafetyStatus(user.uid, user.email, isSafe)
            .catch(error => {
              console.error(`Firebase update error for ${user.email}:`, error.message);
            });
        }
      } catch (error) {
        console.error('Error processing user safety:', error);
      }
    });
    
    setUserSafetyStatus(safetyUpdates);
  }, [userLocations, heatmapData]);
  
  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d / 111; // Convert to approximate degrees
  };
  
  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };
  
  // Update safety status in Firebase with error handling
  const updateUserSafetyStatus = async (uid: string, email: string, isSafe: boolean) => {
    try {
      // Create the situation collection first to avoid permission errors
      const userDocRef = doc(collection(FIREBASE_DB, 'userLocation'), email);
      const situationCollRef = collection(userDocRef, 'situation');
      const safetyDocRef = doc(situationCollRef, 'SafeOrNot');
      
      // Update the safety status
      await setDoc(safetyDocRef, { safe: isSafe }, { merge: true });
      
      return true;
    } catch (error) {
      console.error(`Failed to update safety for ${email}:`, error);
      throw error; // Re-throw for higher-level handling
    }
  };

  // Check if we have valid heatmap data to display
  const hasValidHeatmap = processedHeatmapPoints.length > 0;

  return (
    <View style={styles.mapWrapper}>
      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            // camera={{
            //   center: {
            //     latitude: currentLocation.latitude,
            //     longitude: currentLocation.longitude,
            //   },
            //   pitch: 85, // This creates the 3D effect (0-60 degrees)
            //   heading: 0, // Camera direction (0 is north)
            //   altitude: 1000, // Optional: altitude in meters
            //   zoom: 18, // Zoom level
            // }}
            camera={{
                center: {
                  latitude: 11.017507062924722,
                  longitude: 76.31043383943484,
                },
                pitch: 0,
                heading: 0,
                altitude: 1000,
                zoom: 18,
              }}
            customMapStyle={mapStyle}
          >
            {/* Current user location marker */}
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude
              }}
              title="Your Location"
            />
            
            {/* Display heatmap if we have data */}
            {hasValidHeatmap && (
            <Heatmap
                points={processedHeatmapPoints}
                radius={25}
                opacity={0.7}
                gradient={{
                colors: ["blue", "lime", "yellow", "orange", "red"],
                startPoints: [0.1, 0.3, 0.5, 0.7, 0.9],
                colorMapSize: 256
                }}
            />
            )}
            
            {/* Display other users with safety status */}
            {userLocations.map(user => {
              const isSafe = userSafetyStatus[user.uid]?.safe;
              
              return (
                <Marker
                  key={user.uid}
                  coordinate={{
                    latitude: user.lat,
                    longitude: user.lon
                  }}
                  title={user.email || user.uid}
                  description={isSafe !== undefined ? (isSafe ? 'SAFE' : 'DANGER') : 'Unknown'}
                  pinColor={isSafe !== undefined ? (isSafe ? 'green' : 'red') : 'blue'}
                />
              );
            })}
          </MapView>
        ) : (
          <View style={styles.loadingMap}>
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Dark map style
const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{"color": "#1A1A1A"}] // Deep black background
  },
  {
    "elementType": "labels.icon",
    "stylers": [{"visibility": "off"}] // Icons off for cleaner look
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#FF5722"}] // Vibrant orange text
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {"color": "#000000"}, // Black stroke
      {"weight": 2}         // Thicker stroke for contrast
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{"color": "#ffff"}] // Bright orange boundaries
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [{"color": "#212121"}] // Dark gray for landscape
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{"color": "#2C2C2C"}] // Slightly lighter black for POIs
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {"color": "#FF5722"},     // Orange roads
      {"weight": 1.5}           // Thicker roads
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [
      {"color": "#000000"},     // Black road outlines
      {"weight": 1}
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{"color": "#0A0A0A"}] // Very dark black water
  },
  {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [{"color": "#FFB300"}] // Amber transit lines
  }
];

const styles = {
  mapWrapper: {
    marginTop: 230, // Adjust this value to position the map below the status display
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '100%',
  },
  mapContainer: {
    top: 70,
    width: '100%', // Full width
    height: '100%', // Full height
    borderRadius: 15, // Rounded corners
    overflow: 'hidden' as const,
    backgroundColor: '#222', // Slightly lighter than pure black for depth
    // Shadow for Android
    elevation: 30, // Higher value for a stronger 3D effect
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingMap: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#1c1c1c',
  },
  loadingText: {
    color: '#f0f0f0',
  },
};

export { mapStyle };
export default MapComponent;