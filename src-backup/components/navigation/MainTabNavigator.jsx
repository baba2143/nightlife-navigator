import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import MapScreen from '../screens/MapScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';

import VenueDetailScreen from '../screens/VenueDetailScreen';
import ReservationScreen from '../screens/ReservationScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import ConversationScreen from '../screens/ConversationScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: styles.header,
      headerTintColor: '#FFFFFF',
      headerTitleStyle: styles.headerTitle,
    }}
  >
    <Stack.Screen 
      name="HomeMain" 
      component={HomeScreen} 
      options={{ title: 'Nightlife Navigator' }}
    />
    <Stack.Screen 
      name="VenueDetail" 
      component={VenueDetailScreen}
      options={({ route }) => ({ 
        title: route.params?.venue?.name || 'Venue Details',
        headerBackTitle: 'Back'
      })}
    />
    <Stack.Screen 
      name="Reservation" 
      component={ReservationScreen}
      options={{ title: 'Make Reservation' }}
    />
    <Stack.Screen 
      name="EventDetail" 
      component={EventDetailScreen}
      options={({ route }) => ({ 
        title: route.params?.event?.title || 'Event Details'
      })}
    />
  </Stack.Navigator>
);

const SearchStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: styles.header,
      headerTintColor: '#FFFFFF',
      headerTitleStyle: styles.headerTitle,
    }}
  >
    <Stack.Screen 
      name="SearchMain" 
      component={SearchScreen} 
      options={{ title: 'Search Venues' }}
    />
    <Stack.Screen 
      name="VenueDetail" 
      component={VenueDetailScreen}
      options={({ route }) => ({ 
        title: route.params?.venue?.name || 'Venue Details'
      })}
    />
  </Stack.Navigator>
);

const MapStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: styles.header,
      headerTintColor: '#FFFFFF',
      headerTitleStyle: styles.headerTitle,
    }}
  >
    <Stack.Screen 
      name="MapMain" 
      component={MapScreen} 
      options={{ title: 'Nearby Venues' }}
    />
    <Stack.Screen 
      name="VenueDetail" 
      component={VenueDetailScreen}
      options={({ route }) => ({ 
        title: route.params?.venue?.name || 'Venue Details'
      })}
    />
  </Stack.Navigator>
);

const ChatStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: styles.header,
      headerTintColor: '#FFFFFF',
      headerTitleStyle: styles.headerTitle,
    }}
  >
    <Stack.Screen 
      name="ChatMain" 
      component={ChatScreen} 
      options={{ title: 'Messages' }}
    />
    <Stack.Screen 
      name="Conversation" 
      component={ConversationScreen}
      options={({ route }) => ({ 
        title: route.params?.conversation?.name || 'Chat'
      })}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: styles.header,
      headerTintColor: '#FFFFFF',
      headerTitleStyle: styles.headerTitle,
    }}
  >
    <Stack.Screen 
      name="ProfileMain" 
      component={ProfileScreen} 
      options={{ title: 'Profile' }}
    />
    <Stack.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
  </Stack.Navigator>
);

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Chat':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchStack}
        options={{
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapStack}
        options={{
          tabBarLabel: 'Map',
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatStack}
        options={{
          tabBarLabel: 'Chat',
          tabBarBadge: undefined, // TODO: Add unread message count
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1C1C1E',
    borderTopColor: '#38383A',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    height: Platform.OS === 'ios' ? 88 : 68,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  header: {
    backgroundColor: '#1C1C1E',
    borderBottomColor: '#38383A',
    borderBottomWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default MainTabNavigator;