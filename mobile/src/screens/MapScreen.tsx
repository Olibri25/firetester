// AK FISH Map Screen - Main Map Interface

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { Colors, Spacing, config } from '../config';
import { useSettingsStore } from '../store/settingsStore';
import { fishCountsApi, lakesApi, emergencyOrdersApi } from '../services/api';
import { RootStackParamList } from '../navigation';
import { FishCountWidget } from '../components/FishCountWidget';
import { MapLayerSelector } from '../components/MapLayerSelector';
import { QuickActionsPanel } from '../components/QuickActionsPanel';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function MapScreen() {
  const navigation = useNavigation<NavigationProp>();
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: config.map.defaultCenter.latitude,
    longitude: config.map.defaultCenter.longitude,
    latitudeDelta: 2,
    longitudeDelta: 2,
  });
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [showLayerSelector, setShowLayerSelector] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const settings = useSettingsStore();

  // Fetch fish counting stations
  const { data: stationsData, isLoading: stationsLoading } = useQuery({
    queryKey: ['fish-count-stations'],
    queryFn: async () => {
      const response = await fishCountsApi.getStations();
      return response.data.data;
    },
    staleTime: config.cache.fishCountsTTL,
  });

  // Fetch fish count summary
  const { data: fishCountSummary } = useQuery({
    queryKey: ['fish-count-summary'],
    queryFn: async () => {
      const response = await fishCountsApi.getSummary();
      return response.data.data;
    },
    staleTime: config.cache.fishCountsTTL,
  });

  // Fetch active emergency orders
  const { data: emergencyOrders } = useQuery({
    queryKey: ['emergency-orders-active'],
    queryFn: async () => {
      const response = await emergencyOrdersApi.getAll({ active: true });
      return response.data.data;
    },
    staleTime: config.cache.emergencyOrdersTTL,
  });

  // Get user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    })();
  }, []);

  // Center on user location
  const centerOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
    }
  }, [userLocation]);

  // Handle marker press
  const handleStationPress = useCallback((station: any) => {
    setSelectedStation(station);
  }, []);

  // Navigate to station detail
  const handleViewStationDetail = useCallback(() => {
    if (selectedStation) {
      navigation.navigate('FishCountDetail', {
        stationId: selectedStation.stationId || selectedStation.id,
        stationName: selectedStation.stationName || selectedStation.name,
      });
    }
  }, [navigation, selectedStation]);

  // Get map type based on settings
  const mapType = settings.mapStyle === 'satellite' ? 'satellite' :
                  settings.mapStyle === 'hybrid' ? 'hybrid' : 'standard';

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        mapType={mapType}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        showsScale
      >
        {/* Fish Count Station Markers */}
        {settings.showFishCountStations && fishCountSummary?.map((station: any) => (
          <Marker
            key={station.stationId}
            coordinate={{
              latitude: station.latitude,
              longitude: station.longitude,
            }}
            onPress={() => handleStationPress(station)}
          >
            <View style={styles.stationMarker}>
              <Ionicons name="analytics" size={20} color={Colors.primary} />
              {station.latestCount && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>
                    {formatCount(station.latestCount.dailyCount)}
                  </Text>
                </View>
              )}
            </View>
            <Callout onPress={handleViewStationDetail}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{station.stationName}</Text>
                <Text style={styles.calloutSubtitle}>{station.river}</Text>
                {station.latestCount && (
                  <>
                    <Text style={styles.calloutCount}>
                      Today: {station.latestCount.dailyCount.toLocaleString()} fish
                    </Text>
                    <Text style={styles.calloutCumulative}>
                      Season: {station.latestCount.cumulativeCount.toLocaleString()}
                    </Text>
                  </>
                )}
                <Text style={styles.calloutAction}>Tap for details →</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Emergency Order Alert Banner */}
      {emergencyOrders && emergencyOrders.length > 0 && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => navigation.navigate('Main', { screen: 'Alerts' } as any)}
        >
          <Ionicons name="warning" size={18} color={Colors.surface} />
          <Text style={styles.alertText}>
            {emergencyOrders.length} Active Emergency Order{emergencyOrders.length > 1 ? 's' : ''}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.surface} />
        </TouchableOpacity>
      )}

      {/* Map Controls */}
      <View style={styles.controlsContainer}>
        {/* Location Button */}
        <TouchableOpacity style={styles.controlButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={24} color={Colors.primary} />
        </TouchableOpacity>

        {/* Layer Selector */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowLayerSelector(true)}
        >
          <Ionicons name="layers" size={24} color={Colors.primary} />
        </TouchableOpacity>

        {/* Regulations */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => navigation.navigate('Regulations', { location: userLocation || undefined })}
        >
          <Ionicons name="document-text" size={24} color={Colors.primary} />
        </TouchableOpacity>

        {/* Weather */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => navigation.navigate('Weather', { location: userLocation || undefined })}
        >
          <Ionicons name="partly-sunny" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowQuickActions(true)}
      >
        <Ionicons name="add" size={28} color={Colors.surface} />
      </TouchableOpacity>

      {/* Selected Station Widget */}
      {selectedStation && (
        <FishCountWidget
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onViewDetail={handleViewStationDetail}
        />
      )}

      {/* Layer Selector Modal */}
      {showLayerSelector && (
        <MapLayerSelector onClose={() => setShowLayerSelector(false)} />
      )}

      {/* Quick Actions Panel */}
      {showQuickActions && (
        <QuickActionsPanel
          onClose={() => setShowQuickActions(false)}
          userLocation={userLocation}
        />
      )}

      {/* Loading Indicator */}
      {stationsLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </View>
  );
}

// Helper function to format count
function formatCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}K`;
  return `${Math.round(count / 1000)}K`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  stationMarker: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  countBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countText: {
    color: Colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  callout: {
    width: 200,
    padding: Spacing.sm,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.charcoal,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: Colors.gray600,
    marginBottom: Spacing.xs,
  },
  calloutCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  calloutCumulative: {
    fontSize: 12,
    color: Colors.gray600,
  },
  calloutAction: {
    fontSize: 12,
    color: Colors.accent,
    marginTop: Spacing.xs,
  },
  alertBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,
    left: Spacing.base,
    right: Spacing.base,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  alertText: {
    color: Colors.surface,
    fontWeight: '600',
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    right: Spacing.base,
    top: Platform.OS === 'ios' ? 100 : 60,
    gap: Spacing.sm,
  },
  controlButton: {
    backgroundColor: Colors.surface,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.base,
    backgroundColor: Colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
});
