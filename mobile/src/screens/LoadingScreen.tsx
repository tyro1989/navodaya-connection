import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoadingScreen() {
  const { user, loading } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!loading) {
      // Navigate based on auth status
      setTimeout(() => {
        if (user) {
          navigation.navigate('Home' as never);
        } else {
          navigation.navigate('Auth' as never);
        }
      }, 1500); // Show loading for a bit for better UX
    }
  }, [loading, user, navigation]);

  return (
    <LinearGradient
      colors={['#2563eb', '#3b82f6', '#60a5fa']}
      style={styles.container}
    >
      <Animatable.View animation="fadeInUp" duration={1000} style={styles.content}>
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          style={styles.logoContainer}
        >
          <View style={styles.logo}>
            <Text style={styles.logoText}>N</Text>
          </View>
        </Animatable.View>
        
        <Animatable.Text
          animation="fadeInUp"
          delay={500}
          style={styles.title}
        >
          Navodaya Connect
        </Animatable.Text>
        
        <Animatable.Text
          animation="fadeInUp"
          delay={700}
          style={styles.subtitle}
        >
          Connecting Navodayans Worldwide
        </Animatable.Text>
        
        <Animatable.View
          animation="fadeInUp"
          delay={1000}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>
            {loading ? 'Checking authentication...' : 'Getting ready...'}
          </Text>
        </Animatable.View>
      </Animatable.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 48,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});