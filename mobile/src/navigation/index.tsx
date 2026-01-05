// AK FISH Navigation Configuration

import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, Platform } from 'react-native';

import { Colors } from '../config';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';

// Import screens
import { MapScreen } from '../screens/MapScreen';
import { FishCountsScreen } from '../screens/FishCountsScreen';
import { FishCountDetailScreen } from '../screens/FishCountDetailScreen';
import { EmergencyOrdersScreen } from '../screens/EmergencyOrdersScreen';
import { LakesScreen } from '../screens/LakesScreen';
import { LakeDetailScreen } from '../screens/LakeDetailScreen';
import { CatchLogScreen } from '../screens/CatchLogScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RegulationsScreen } from '../screens/RegulationsScreen';
import { WeatherScreen } from '../screens/WeatherScreen';
import { TripScreen } from '../screens/TripScreen';
import { WaypointsScreen } from '../screens/WaypointsScreen';

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  FishCountDetail: { stationId: string; stationName: string };
  LakeDetail: { lakeId: string; lakeName: string };
  EmergencyOrderDetail: { orderId: string };
  Settings: undefined;
  Regulations: { location?: { lat: number; lng: number } };
  Weather: { location?: { lat: number; lng: number } };
  Trip: { tripId?: string };
  Waypoints: undefined;
};

export type MainTabParamList = {
  Map: undefined;
  FishCounts: undefined;
  Alerts: undefined;
  Lakes: undefined;
  CatchLog: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom theme
const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.charcoal,
    border: Colors.gray200,
    notification: Colors.accent,
  },
};

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.primaryLight,
    background: Colors.backgroundDark,
    card: Colors.surfaceDark,
    text: Colors.gray100,
    border: Colors.gray700,
    notification: Colors.accent,
  },
};

// Main Tab Navigator
function MainTabs() {
  const darkMode = useSettingsStore((state) => state.darkMode);
  const systemColorScheme = useColorScheme();

  const isDark = darkMode === 'dark' || (darkMode === 'auto' && systemColorScheme === 'dark');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'map';

          switch (route.name) {
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'FishCounts':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            case 'Alerts':
              iconName = focused ? 'warning' : 'warning-outline';
              break;
            case 'Lakes':
              iconName = focused ? 'water' : 'water-outline';
              break;
            case 'CatchLog':
              iconName = focused ? 'fish' : 'fish-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: isDark ? Colors.gray400 : Colors.gray500,
        tabBarStyle: {
          backgroundColor: isDark ? Colors.surfaceDark : Colors.surface,
          borderTopColor: isDark ? Colors.gray700 : Colors.gray200,
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: isDark ? Colors.surfaceDark : Colors.surface,
        },
        headerTintColor: isDark ? Colors.gray100 : Colors.charcoal,
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: 'Map',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="FishCounts"
        component={FishCountsScreen}
        options={{
          title: 'Fish Counts',
          headerTitle: 'Live Fish Counts',
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={EmergencyOrdersScreen}
        options={{
          title: 'Alerts',
          headerTitle: 'Emergency Orders',
        }}
      />
      <Tab.Screen
        name="Lakes"
        component={LakesScreen}
        options={{
          title: 'Lakes',
          headerTitle: 'Alaska Lakes',
        }}
      />
      <Tab.Screen
        name="CatchLog"
        component={CatchLogScreen}
        options={{
          title: 'Catch Log',
          headerTitle: 'My Catches',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// Root Navigator
export function Navigation() {
  const darkMode = useSettingsStore((state) => state.darkMode);
  const systemColorScheme = useColorScheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isDark = darkMode === 'dark' || (darkMode === 'auto' && systemColorScheme === 'dark');
  const theme = isDark ? CustomDarkTheme : LightTheme;

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: isDark ? Colors.surfaceDark : Colors.surface,
          },
          headerTintColor: isDark ? Colors.gray100 : Colors.charcoal,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            title: 'Sign In',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            title: 'Create Account',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="FishCountDetail"
          component={FishCountDetailScreen}
          options={({ route }) => ({
            title: route.params.stationName,
          })}
        />
        <Stack.Screen
          name="LakeDetail"
          component={LakeDetailScreen}
          options={({ route }) => ({
            title: route.params.lakeName,
          })}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen
          name="Regulations"
          component={RegulationsScreen}
          options={{ title: 'Regulations' }}
        />
        <Stack.Screen
          name="Weather"
          component={WeatherScreen}
          options={{ title: 'Weather & Conditions' }}
        />
        <Stack.Screen
          name="Trip"
          component={TripScreen}
          options={({ route }) => ({
            title: route.params?.tripId ? 'Trip Details' : 'New Trip',
          })}
        />
        <Stack.Screen
          name="Waypoints"
          component={WaypointsScreen}
          options={{ title: 'My Waypoints' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
