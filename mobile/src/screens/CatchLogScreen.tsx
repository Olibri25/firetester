// AK FISH Catch Log Screen

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Colors, Spacing } from '../config';
import { catchesApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function CatchLogScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: catches, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['catches', selectedYear],
    queryFn: async () => {
      const response = await catchesApi.getAll({ year: selectedYear });
      return response.data.data;
    },
    enabled: isAuthenticated,
  });

  const { data: stats } = useQuery({
    queryKey: ['catch-stats', selectedYear],
    queryFn: async () => {
      const response = await catchesApi.getStats(selectedYear);
      return response.data.data;
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Ionicons name="fish" size={64} color={Colors.primary} />
        <Text style={styles.authTitle}>Track Your Catches</Text>
        <Text style={styles.authText}>Sign in to log and track your fishing catches throughout the season.</Text>
        <TouchableOpacity style={styles.signInButton}>
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderCatch = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.catchCard}>
      <View style={styles.catchHeader}>
        <View style={[styles.speciesIcon, { backgroundColor: getSpeciesColor(item.species) }]}>
          <Ionicons name="fish" size={20} color={Colors.surface} />
        </View>
        <View style={styles.catchInfo}>
          <Text style={styles.speciesName}>{formatSpecies(item.species)}</Text>
          <Text style={styles.catchDate}>{format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}</Text>
        </View>
        <View style={[styles.keptBadge, { backgroundColor: item.kept ? Colors.success : Colors.gray400 }]}>
          <Text style={styles.keptText}>{item.kept ? 'Kept' : 'Released'}</Text>
        </View>
      </View>
      <View style={styles.catchDetails}>
        {item.length && <Text style={styles.detailText}>{item.length}" long</Text>}
        {item.weight && <Text style={styles.detailText}>{item.weight} lbs</Text>}
        {item.lure && <Text style={styles.detailText}>🎣 {item.lure}</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalCatches}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.kept}</Text>
            <Text style={styles.statLabel}>Kept</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.released}</Text>
            <Text style={styles.statLabel}>Released</Text>
          </View>
        </View>
      )}

      <FlatList
        data={catches}
        renderItem={renderCatch}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="fish-outline" size={48} color={Colors.gray400} />
            <Text style={styles.emptyText}>{isLoading ? 'Loading...' : 'No catches logged yet'}</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color={Colors.surface} />
      </TouchableOpacity>
    </View>
  );
}

const getSpeciesColor = (species: string): string => {
  const colors: Record<string, string> = {
    king_salmon: Colors.kingColor, sockeye_salmon: Colors.sockeyeColor, coho_salmon: Colors.cohoColor,
    pink_salmon: Colors.pinkColor, chum_salmon: Colors.chumColor, rainbow_trout: '#FF69B4',
  };
  return colors[species] || Colors.primary;
};

const formatSpecies = (species: string): string => species.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  authContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  authTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.charcoal, marginTop: Spacing.lg },
  authText: { fontSize: 16, color: Colors.gray600, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl },
  signInButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, borderRadius: 8 },
  signInText: { color: Colors.surface, fontSize: 16, fontWeight: '600' },
  statsContainer: { flexDirection: 'row', backgroundColor: Colors.surface, padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.gray200 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.gray500, marginTop: 2 },
  listContainer: { padding: Spacing.base },
  catchCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.base, marginBottom: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  catchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  speciesIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  catchInfo: { flex: 1 },
  speciesName: { fontSize: 16, fontWeight: '600', color: Colors.charcoal },
  catchDate: { fontSize: 12, color: Colors.gray500, marginTop: 2 },
  keptBadge: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: 4 },
  keptText: { fontSize: 11, color: Colors.surface, fontWeight: '600' },
  catchDetails: { flexDirection: 'row', gap: Spacing.base },
  detailText: { fontSize: 13, color: Colors.gray600 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['4xl'] },
  emptyText: { marginTop: Spacing.base, color: Colors.gray500, fontSize: 16 },
  fab: { position: 'absolute', bottom: Spacing.xl, right: Spacing.base, backgroundColor: Colors.primary, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
});
