import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Screens
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RequestDetailScreen from './src/screens/RequestDetailScreen';
import CreateRequestScreen from './src/screens/CreateRequestScreen';
import ExpertRequestsScreen from './src/screens/ExpertRequestsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import LoadingScreen from './src/screens/LoadingScreen';

// Types
export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  Home: undefined;
  Profile: undefined;
  RequestDetail: { requestId: string };
  CreateRequest: undefined;
  ExpertRequests: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

// Custom theme based on your web app colors
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563eb', // Blue-600
    primaryContainer: '#dbeafe',
    secondary: '#10b981', // Emerald-500
    secondaryContainer: '#d1fae5',
    tertiary: '#8b5cf6', // Violet-500
    surface: '#ffffff',
    surfaceVariant: '#f8fafc',
    background: '#f1f5f9',
    error: '#ef4444',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onSurface: '#1e293b',
    onBackground: '#1e293b',
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            <AuthProvider>
              <NotificationProvider>
                <NavigationContainer>
                  <Stack.Navigator
                    initialRouteName="Loading"
                    screenOptions={{
                      headerStyle: {
                        backgroundColor: theme.colors.primary,
                      },
                      headerTintColor: '#ffffff',
                      headerTitleStyle: {
                        fontWeight: 'bold',
                      },
                    }}
                  >
                    <Stack.Screen 
                      name="Loading" 
                      component={LoadingScreen}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen 
                      name="Auth" 
                      component={AuthScreen}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen 
                      name="Home" 
                      component={HomeScreen}
                      options={{ 
                        title: 'Navodaya Connect',
                        headerShown: false // We'll use custom navigation
                      }}
                    />
                    <Stack.Screen 
                      name="Profile" 
                      component={ProfileScreen}
                      options={{ title: 'Profile' }}
                    />
                    <Stack.Screen 
                      name="RequestDetail" 
                      component={RequestDetailScreen}
                      options={{ title: 'Request Details' }}
                    />
                    <Stack.Screen 
                      name="CreateRequest" 
                      component={CreateRequestScreen}
                      options={{ title: 'Create Request' }}
                    />
                    <Stack.Screen 
                      name="ExpertRequests" 
                      component={ExpertRequestsScreen}
                      options={{ title: 'Expert Requests' }}
                    />
                    <Stack.Screen 
                      name="Notifications" 
                      component={NotificationsScreen}
                      options={{ title: 'Notifications' }}
                    />
                  </Stack.Navigator>
                </NavigationContainer>
                <StatusBar style="light" />
              </NotificationProvider>
            </AuthProvider>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}