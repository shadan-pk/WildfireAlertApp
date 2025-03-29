import { Stack } from 'expo-router';
import { useAuth } from '../context/auth'; // Adjust the import path as necessary
import { ActivityIndicator, View } from 'react-native';

export default function AppLayout() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}