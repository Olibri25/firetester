// AK FISH Waypoints Screen
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing } from '../config';
import { waypointsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

const waypointIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  HOT_SPOT: 'flame', CAMP_SITE: 'bonfire', BOAT_LAUNCH: 'boat', HAZARD: 'warning', FISH_ON: 'fish', PARKING: 'car', TRAILHEAD: 'walk', CUSTOM: 'location',
};

export function WaypointsScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data: waypoints, isLoading, refetch } = useQuery({
    queryKey: ['waypoints'],
    queryFn: async () => { const response = await waypointsApi.getAll(); return response.data.data; },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Ionicons name="location" size={64} color={Colors.primary} />
        <Text style={styles.authTitle}>Save Your Spots</Text>
        <Text style={styles.authText}>Sign in to save waypoints and never forget your favorite fishing locations.</Text>
      </View>
    );
  }

  const renderWaypoint = ({ item }: any) => (
    <TouchableOpacity style={styles.waypointCard}>
      <View style={[styles.iconContainer, { backgroundColor: Colors.primary }]}>
        <Ionicons name={waypointIcons[item.type] || 'location'} size={24} color={Colors.surface} />
      </View>
      <View style={styles.waypointInfo}>
        <Text style={styles.waypointName}>{item.name}</Text>
        <Text style={styles.waypointType}>{item.type.replace('_', ' ')}</Text>
        {item.description && <Text style={styles.waypointDesc} numberOfLines={1}>{item.description}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={waypoints}
        renderItem={renderWaypoint}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={48} color={Colors.gray400} />
            <Text style={styles.emptyText}>{isLoading ? 'Loading...' : 'No waypoints yet'}</Text>
            <Text style={styles.emptySubtext}>Long-press on the map to add waypoints</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color={Colors.surface} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  authContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  authTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.charcoal, marginTop: Spacing.lg },
  authText: { fontSize: 16, color: Colors.gray500, textAlign: 'center', marginTop: Spacing.sm },
  listContainer: { padding: Spacing.base },
  waypointCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.base, marginBottom: Spacing.md },
  iconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  waypointInfo: { flex: 1, marginLeft: Spacing.md },
  waypointName: { fontSize: 16, fontWeight: '600', color: Colors.charcoal },
  waypointType: { fontSize: 12, color: Colors.gray500, textTransform: 'capitalize', marginTop: 2 },
  waypointDesc: { fontSize: 13, color: Colors.gray600, marginTop: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing['4xl'] },
  emptyText: { marginTop: Spacing.base, color: Colors.gray500, fontSize: 16 },
  emptySubtext: { marginTop: Spacing.sm, color: Colors.gray400, fontSize: 14 },
  fab: { position: 'absolute', bottom: Spacing.xl, right: Spacing.base, backgroundColor: Colors.primary, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 6 },
});
