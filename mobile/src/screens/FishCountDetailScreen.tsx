// AK FISH Fish Count Detail Screen

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../config';
import { fishCountsApi } from '../services/api';
import { RootStackParamList } from '../navigation';

type RouteProps = RouteProp<RootStackParamList, 'FishCountDetail'>;

export function FishCountDetailScreen() {
  const route = useRoute<RouteProps>();
  const { stationId, stationName } = route.params;

  const { data: stationData, isLoading } = useQuery({
    queryKey: ['fish-count-station', stationId],
    queryFn: async () => {
      const response = await fishCountsApi.getStation(stationId);
      return response.data.data;
    },
  });

  const { data: historyData } = useQuery({
    queryKey: ['fish-count-history', stationId],
    queryFn: async () => {
      const response = await fishCountsApi.getHistory(stationId);
      return response.data.data;
    },
  });

  const latestCount = stationData?.counts?.[0];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stationName}>{stationName}</Text>
        <Text style={styles.riverName}>{stationData?.river || 'Loading...'}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{stationData?.type || 'SONAR'}</Text>
        </View>
      </View>

      {latestCount && (
        <View style={styles.countsCard}>
          <Text style={styles.sectionTitle}>Latest Count</Text>
          <View style={styles.countRow}>
            <View style={styles.countItem}>
              <Text style={styles.countValue}>{latestCount.dailyCount.toLocaleString()}</Text>
              <Text style={styles.countLabel}>Today</Text>
            </View>
            <View style={styles.countItem}>
              <Text style={styles.countValue}>{latestCount.cumulativeCount.toLocaleString()}</Text>
              <Text style={styles.countLabel}>Season Total</Text>
            </View>
          </View>

          {latestCount.escapementGoal && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Escapement Progress</Text>
                <Text style={styles.progressPercent}>{Math.round(latestCount.percentOfGoal || 0)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(latestCount.percentOfGoal || 0, 100)}%` }]} />
              </View>
              <Text style={styles.goalText}>Goal: {latestCount.escapementGoal.toLocaleString()} fish</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Daily Counts (Last 30 Days)</Text>
        <View style={styles.chartPlaceholder}>
          <Ionicons name="bar-chart" size={48} color={Colors.gray300} />
          <Text style={styles.chartPlaceholderText}>Chart visualization</Text>
        </View>
      </View>

      <View style={styles.comparisonCard}>
        <Text style={styles.sectionTitle}>Year Comparison</Text>
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonYear}>This Year</Text>
            <Text style={styles.comparisonValue}>{latestCount?.cumulativeCount?.toLocaleString() || '-'}</Text>
          </View>
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonYear}>Last Year</Text>
            <Text style={styles.comparisonValue}>{historyData?.historical?.[0]?.totalCount?.toLocaleString() || '-'}</Text>
          </View>
          <View style={styles.comparisonItem}>
            <Text style={styles.comparisonYear}>5-Yr Avg</Text>
            <Text style={styles.comparisonValue}>-</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, padding: Spacing.xl, paddingTop: Spacing.base },
  stationName: { fontSize: 24, fontWeight: 'bold', color: Colors.surface },
  riverName: { fontSize: 16, color: Colors.secondary, marginTop: 4 },
  typeBadge: { alignSelf: 'flex-start', marginTop: Spacing.md, backgroundColor: Colors.surface + '30', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: 20 },
  typeText: { color: Colors.surface, fontSize: 12, fontWeight: '600' },
  countsCard: { backgroundColor: Colors.surface, margin: Spacing.base, borderRadius: 12, padding: Spacing.base, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.charcoal, marginBottom: Spacing.md },
  countRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.lg },
  countItem: { alignItems: 'center' },
  countValue: { fontSize: 32, fontWeight: 'bold', color: Colors.primary },
  countLabel: { fontSize: 14, color: Colors.gray500, marginTop: 4 },
  progressSection: { borderTopWidth: 1, borderTopColor: Colors.gray100, paddingTop: Spacing.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  progressLabel: { fontSize: 14, color: Colors.gray600 },
  progressPercent: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  progressBar: { height: 12, backgroundColor: Colors.gray200, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 6 },
  goalText: { fontSize: 12, color: Colors.gray500, marginTop: Spacing.sm, textAlign: 'center' },
  chartCard: { backgroundColor: Colors.surface, margin: Spacing.base, marginTop: 0, borderRadius: 12, padding: Spacing.base },
  chartPlaceholder: { height: 200, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray50, borderRadius: 8 },
  chartPlaceholderText: { color: Colors.gray400, marginTop: Spacing.sm },
  comparisonCard: { backgroundColor: Colors.surface, margin: Spacing.base, marginTop: 0, borderRadius: 12, padding: Spacing.base },
  comparisonRow: { flexDirection: 'row', justifyContent: 'space-around' },
  comparisonItem: { alignItems: 'center' },
  comparisonYear: { fontSize: 12, color: Colors.gray500 },
  comparisonValue: { fontSize: 20, fontWeight: '600', color: Colors.charcoal, marginTop: 4 },
});
