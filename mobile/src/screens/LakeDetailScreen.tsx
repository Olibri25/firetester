// AK FISH Lake Detail Screen

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../config';
import { lakesApi } from '../services/api';
import { RootStackParamList } from '../navigation';

type RouteProps = RouteProp<RootStackParamList, 'LakeDetail'>;

export function LakeDetailScreen() {
  const route = useRoute<RouteProps>();
  const { lakeId, lakeName } = route.params;

  const { data: lake, isLoading } = useQuery({
    queryKey: ['lake', lakeId],
    queryFn: async () => {
      const response = await lakesApi.getById(lakeId);
      return response.data.data;
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.lakeName}>{lakeName}</Text>
        <Text style={styles.region}>{lake?.region || 'Loading...'}</Text>
      </View>

      <View style={styles.statsRow}>
        {lake?.maxDepth && (
          <View style={styles.statItem}>
            <Ionicons name="resize-outline" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{lake.maxDepth}'</Text>
            <Text style={styles.statLabel}>Max Depth</Text>
          </View>
        )}
        {lake?.surfaceArea && (
          <View style={styles.statItem}>
            <Ionicons name="expand-outline" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{lake.surfaceArea.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Acres</Text>
          </View>
        )}
        {lake?.elevation && (
          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{lake.elevation}'</Text>
            <Text style={styles.statLabel}>Elevation</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Species Present</Text>
        <View style={styles.speciesList}>
          {lake?.species?.map((sp: any, index: number) => (
            <View key={index} style={styles.speciesItem}>
              <Ionicons name="fish" size={20} color={Colors.primary} />
              <Text style={styles.speciesName}>{formatSpecies(sp.species)}</Text>
              <View style={[styles.abundanceBadge, { backgroundColor: getAbundanceColor(sp.abundance) }]}>
                <Text style={styles.abundanceText}>{sp.abundance}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Access Information</Text>
        <View style={styles.accessTypes}>
          {lake?.accessTypes?.map((type: string, index: number) => (
            <View key={index} style={styles.accessBadge}>
              <Ionicons name={getAccessIcon(type) as any} size={16} color={Colors.primary} />
              <Text style={styles.accessText}>{type.replace('_', ' ')}</Text>
            </View>
          ))}
        </View>
        {lake?.accessDescription && (
          <Text style={styles.accessDescription}>{lake.accessDescription}</Text>
        )}
        {lake?.boatLaunchAvailable && (
          <View style={styles.boatLaunchBadge}>
            <Ionicons name="boat" size={20} color={Colors.success} />
            <Text style={styles.boatLaunchText}>Boat Launch Available</Text>
          </View>
        )}
      </View>

      {lake?.stockingHistory?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Stocking</Text>
          {lake.stockingHistory.slice(0, 5).map((record: any, index: number) => (
            <View key={index} style={styles.stockingItem}>
              <Text style={styles.stockingDate}>{new Date(record.date).toLocaleDateString()}</Text>
              <Text style={styles.stockingSpecies}>{formatSpecies(record.species)}</Text>
              <Text style={styles.stockingQty}>{record.quantity.toLocaleString()} fish</Text>
            </View>
          ))}
        </View>
      )}

      {lake?.bathymetryAvailable && (
        <TouchableOpacity style={styles.bathymetryButton}>
          <Ionicons name="map" size={20} color={Colors.surface} />
          <Text style={styles.bathymetryText}>View Depth Map</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const formatSpecies = (species: string) => species?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
const getAbundanceColor = (abundance: string) => abundance === 'ABUNDANT' ? Colors.success : abundance === 'COMMON' ? Colors.warning : Colors.gray400;
const getAccessIcon = (type: string) => ({ road: 'car', trail: 'walk', boat: 'boat', float_plane: 'airplane', walk_in: 'footsteps' })[type] || 'navigate';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, padding: Spacing.xl },
  lakeName: { fontSize: 24, fontWeight: 'bold', color: Colors.surface },
  region: { fontSize: 16, color: Colors.secondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.surface, padding: Spacing.base, justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: Colors.charcoal, marginTop: 4 },
  statLabel: { fontSize: 12, color: Colors.gray500 },
  section: { backgroundColor: Colors.surface, margin: Spacing.base, marginTop: 0, borderRadius: 12, padding: Spacing.base },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.charcoal, marginBottom: Spacing.md },
  speciesList: { gap: Spacing.sm },
  speciesItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  speciesName: { flex: 1, marginLeft: Spacing.md, fontSize: 16, color: Colors.charcoal },
  abundanceBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 4 },
  abundanceText: { fontSize: 10, color: Colors.surface, fontWeight: '600' },
  accessTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  accessBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '15', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: 4 },
  accessText: { fontSize: 12, color: Colors.primary, textTransform: 'capitalize' },
  accessDescription: { fontSize: 14, color: Colors.gray600, lineHeight: 20 },
  boatLaunchBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md, backgroundColor: Colors.success + '15', padding: Spacing.sm, borderRadius: 8 },
  boatLaunchText: { fontSize: 14, color: Colors.success, fontWeight: '500' },
  stockingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  stockingDate: { width: 100, fontSize: 13, color: Colors.gray500 },
  stockingSpecies: { flex: 1, fontSize: 14, color: Colors.charcoal },
  stockingQty: { fontSize: 14, fontWeight: '500', color: Colors.primary },
  bathymetryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, margin: Spacing.base, padding: Spacing.md, borderRadius: 8 },
  bathymetryText: { color: Colors.surface, fontSize: 16, fontWeight: '600' },
});
