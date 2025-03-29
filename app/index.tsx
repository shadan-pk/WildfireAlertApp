import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from "expo-router";

const SplashScreen = () => {
  const router = useRouter();
  // Redirect to login screen after 3 seconds
  useEffect(() => {
    // Navigate to the login page after 3 seconds
    const timer = setTimeout(() => {
      router.push("/login");
    }, 3000);

    // Cleanup the timer when the component unmounts
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/logo.png')} style={styles.logo} />
      <Text style={styles.text}>Disaster Response Chatbot</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  logo: { width: 200, height: 200, resizeMode: 'contain' },
  text: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
});

export default SplashScreen;
