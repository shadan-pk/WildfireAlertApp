import React from 'react';
import { View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface MapComponentProps {
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  mapRef: React.RefObject<MapView>;
}

const MapComponent = ({ currentLocation, mapRef }: MapComponentProps) => {
  return (
    <View style={styles.mapWrapper}>
      <View style={styles.mapContainer}>
        {currentLocation ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            camera={{
              center: {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              },
              pitch: 85, // This creates the 3D effect (0-60 degrees)
              heading: 0, // Camera direction (0 is north)
              altitude: 1000, // Optional: altitude in meters
              zoom: 18, // Zoom level
            }}
            customMapStyle={mapStyle}
          >
            <Marker
              coordinate={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude
              }}
              title="Your Location"
            />
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
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  mapContainer: {
    top: 70,
    width: '100%', // Full width
    height: '100%', // Full height
    borderRadius: 15, // Rounded corners
    overflow: 'hidden',
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
  },
  loadingText: {
    color: '#f0f0f0',
  },
};

export { mapStyle };
export default MapComponent;