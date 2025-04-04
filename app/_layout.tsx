import { Slot } from 'expo-router';
import { AuthProvider } from './context/auth';
import { StatusBar } from 'expo-status-bar';
import { View, StatusBar as RNStatusBar } from 'react-native';

export default function RootLayout() {
  const statusBarHeight = RNStatusBar.currentHeight || 0;

  return (
    <AuthProvider>
      <StatusBar translucent={true} backgroundColor="transparent" style="light" />
      <View style={{ 
        flex: 1, 
        backgroundColor: '#181818',
        paddingTop: statusBarHeight + 1, // Add 16dp margin after status bar
        // paddingHorizontal: 12 // Standard Android margin
      }}>
        <Slot />
      </View>
    </AuthProvider>
  );
}