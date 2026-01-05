// AK FISH Fish Counts Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { Colors, Spacing, config } from '../config';
import { fishCountsApi } from '../services/api';
import { RootStackParamList } from '../navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function FishCountsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Fetch fish count summary
  const {
    data: fishCountSummary,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['fish-count-summary'],
    queryFn: async () => {
      const response = await fishCountsApi.getSummary();
      return response.data.data;
    },
    staleTime: config.cache.fishCountsTTL,
  });

  // Filter stations based on search and region
  const filteredStations = fishCountSummary?.filter((station: any) => {
    const matchesSearch = !searchQuery ||
      station.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.river.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRegion = !selectedRegion || station.region === selectedRegion;

    return matchesSearch && matchesRegion;
  }) || [];

  // Get unique regions
  const regions = [...new Set(fishCountSummary?.map((s: any) => s.region) || [])];

  const renderStation = ({ item }: { item: any }) => {
    const hasCount = item.latestCount;
    const percentOfGoal = hasCount && item.latestCount.percentOfGoal;

    return (
      <TouchableOpacity
        style={styles.stationCard}
        onPress={() => navigation.navigate('FishCountDetail', {
          stationId: item.stationId,
          stationName: item.stationName,
        })}
      >
        <View style={styles.stationHeader}>
          <View style={styles.stationInfo}>
            <Text style={styles.stationName}>{item.stationName}</Text>
            <Text style={styles.riverName}>{item.river}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: hasCount ? Colors.success : Colors.gray400 }
          ]}>
            <Text style={styles.statusText}>
              {hasCount ? 'Live' : 'No Data'}
            </Text>
          </View>
        </View>

        {hasCount ? (
          <View style={styles.countContainer}>
            <View style={styles.countBlock}>
              <Text style={styles.countLabel}>Today</Text>
              <Text style={styles.countValue}>
                {item.latestCount.dailyCount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.countBlock}>
              <Text style={styles.countLabel}>Season Total</Text>
              <Text style={styles.countValue}>
                {item.latestCount.cumulativeCount.toLocaleString()}
              </Text>
            </View>
            {percentOfGoal && (
              <View style={styles.countBlock}>
                <Text style={styles.countLabel}>Escapement</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(percentOfGoal, 100)}%` },
                        { backgroundColor: percentOfGoal >= 100 ? Colors.success : Colors.accent }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{Math.round(percentOfGoal)}%</Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.noDataText}>
            No count data available for this station
          </Text>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.regionTag}>{item.region}</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.gray500} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stations or rivers..."
            placeholderTextColor={Colors.gray500}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.gray500} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Region Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...regions]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                (item === 'All' ? !selectedRegion : selectedRegion === item) &&
                  styles.filterChipActive
              ]}
              onPress={() => setSelectedRegion(item === 'All' ? null : item)}
            >
              <Text style={[
                styles.filterChipText,
                (item === 'All' ? !selectedRegion : selectedRegion === item) &&
                  styles.filterChipTextActive
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Station List */}
      <FlatList
        data={filteredStations}
        renderItem={renderStation}
        keyExtractor={(item) => item.stationId}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics-outline" size={48} color={Colors.gray400} />
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading fish counts...' : 'No stations found'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
    color: Colors.charcoal,
  },
  filterContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  filterList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.gray600,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.surface,
  },
  listContainer: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  stationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: Spacing.md,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  riverName: {
    fontSize: 14,
    color: Colors.gray600,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  countContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  countBlock: {
    flex: 1,
  },
  countLabel: {
    fontSize: 12,
    color: Colors.gray500,
    marginBottom: 4,
  },
  countValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  noDataText: {
    color: Colors.gray500,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    paddingTop: Spacing.md,
  },
  regionTag: {
    fontSize: 12,
    color: Colors.gray500,
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyText: {
    marginTop: Spacing.base,
    color: Colors.gray500,
    fontSize: 16,
  },
});
