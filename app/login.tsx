// app/login.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, ActivityIndicator, StyleSheet } from 'react-native';
import { router, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { FIREBASE_AUTH } from '../FirebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';

// Function to save auth token securely
const saveAuthToken = async (token: string) => {
  await SecureStore.setItemAsync('authToken', token);
};

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const auth = FIREBASE_AUTH;
  const segments = useSegments();

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          // Verify token validity with Firebase
          const currentUser = auth.currentUser;
          if (currentUser) {
            router.replace('/(app)/home');
          }
        }
      } catch (error) {
        console.error('Session verification error:', error);
      } finally {
        setInitializing(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async () => {
    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      // Get the user's ID token
      const token = await response.user.getIdToken();
      // Save the token securely
      await saveAuthToken(token);
      console.log('Login successful');
      router.replace('/(app)/home');
    } catch (error: any) {
      console.error(error);
      alert('Failed to Sign In: ' + error.message);
    }
    setLoading(false);
  };

  if (initializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={{ alignItems: 'center' }}>
        {/* App Logo */}
        <Image source={require('../assets/images/logo.png')} style={styles.logo} />

        <Text style={styles.title}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor='#666'
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor='#666'
            value={password}
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            <TouchableOpacity style={styles.button} onPress={signIn}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          </>
        )}
        <Text style={styles.linkText} onPress={() => router.push('/signup')}>
          Don't have an account? Sign up
        </Text>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: '#181818',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#1f1f1f',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#1f1f1f',
    color:'#fff',
    width: 300,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    width: 300,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    alignSelf: 'center',
  },
  linkText: {
    marginTop: 10,
    color:'#4285F4',
    fontSize: 16,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 300,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    borderRadius: 8,
    backgroundColor: '#1f1f1f',
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  eyeButton: {
    padding: 10,
  },
});

export default LoginScreen;