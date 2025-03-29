import { Slot } from 'expo-router';
import { AuthProvider } from './context/auth'; // Adjust the import path as necessary

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}