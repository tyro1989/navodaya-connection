import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest, API_ENDPOINTS } from '../config/api';

// Tab Screens
import PostRequestTab from '../components/PostRequestTab';
import MyRequestsTab from '../components/MyRequestsTab';
import AllRequestsTab from '../components/AllRequestsTab';
import DashboardTab from '../components/DashboardTab';

const Tab = createBottomTabNavigator();

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'PostRequest') {
            iconName = focused ? 'plus-circle' : 'plus-circle-outline';
          } else if (route.name === 'MyRequests') {
            iconName = focused ? 'file-document' : 'file-document-outline';
          } else if (route.name === 'AllRequests') {
            iconName = focused ? 'format-list-bulleted' : 'format-list-bulleted';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else {
            iconName = 'circle';
          }

          return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#2563eb',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen
        name="PostRequest"
        component={PostRequestTab}
        options={{
          tabBarLabel: 'Post',
          title: 'Create Request',
        }}
      />
      <Tab.Screen
        name="MyRequests"
        component={MyRequestsTab}
        options={{
          tabBarLabel: 'My Requests',
          title: 'My Requests',
        }}
      />
      <Tab.Screen
        name="AllRequests"
        component={AllRequestsTab}
        options={{
          tabBarLabel: 'All Requests',
          title: 'All Requests',
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardTab}
        options={{
          tabBarLabel: 'Dashboard',
          title: 'Dashboard',
        }}
      />
    </Tab.Navigator>
  );
}