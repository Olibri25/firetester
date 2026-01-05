// AK FISH Fish Count Widget Component

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../config';

interface FishCountWidgetProps {
  station: {
    stationId: string;
    stationName: string;
    river: string;
    latestCount?: {
      dailyCount: number;
      cumulativeCount: number;
      percentOfGoal?: number;
      species?: string;
    };
  };
  onClose: () => void;
  onViewDetail: () => void;
}

export function FishCountWidget({ station, onClose, onViewDetail }: FishCountWidgetProps) {
  const { latestCount } = station;

  const formatCount = (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 10000) return `${(count / 1000).toFixed(1)}K`;
    return `${Math.round(count / 1000)}K`;
  };

  return (
    <Animated.View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.stationName}>{station.stationName}</Text>
          <Text style={styles.riverName}>{station.river}</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={Colors.gray500} />
        </TouchableOpacity>
      </View>

      {latestCount ? (
        <View style={styles.countsContainer}>
          <View style={styles.countBlock}>
            <Text style={styles.countLabel}>Today</Text>
            <Text style={styles.countValue}>{formatCount(latestCount.dailyCount)}</Text>
            <Text style={styles.countUnit}>fish</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.countBlock}>
            <Text style={styles.countLabel}>Season Total</Text>
            <Text style={styles.countValue}>{formatCount(latestCount.cumulativeCount)}</Text>
            <Text style={styles.countUnit}>fish</Text>
          </View>
          {latestCount.percentOfGoal && (
            <>
              <View style={styles.divider} />
              <View style={styles.countBlock}>
                <Text style={styles.countLabel}>Escapement</Text>
                <Text style={[styles.countValue, latestCount.percentOfGoal >= 100 && { color: Colors.success }]}>
                  {Math.round(latestCount.percentOfGoal)}%
                </Text>
                <Text style={styles.countUnit}>of goal</Text>
              </View>
            </>
          )}
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <Ionicons name="information-circle" size={24} color={Colors.gray400} />
          <Text style={styles.noDataText}>No count data available</Text>
        </View>
      )}

      <TouchableOpacity style={styles.detailButton} onPress={onViewDetail}>
        <Text style={styles.detailButtonText}>View Details</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.base,
    right: Spacing.base,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  riverName: {
    fontSize: 14,
    color: Colors.gray500,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  countsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  countBlock: {
    alignItems: 'center',
    flex: 1,
  },
  countLabel: {
    fontSize: 11,
    color: Colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginVertical: 2,
  },
  countUnit: {
    fontSize: 12,
    color: Colors.gray500,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.gray200,
  },
  noDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  noDataText: {
    fontSize: 14,
    color: Colors.gray500,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
