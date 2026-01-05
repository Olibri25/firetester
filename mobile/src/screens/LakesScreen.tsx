// AK FISH Lakes Screen

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

import { Colors, Spacing } from '../config';
import { lakesApi } from '../services/api';
import { RootStackParamList } from '../navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function LakesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: lakes, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['lakes', searchQuery],
    queryFn: async () => {
      if (searchQuery.length >= 2) {
        const response = await lakesApi.search(searchQuery);
        return response.data.data;
      }
      const response = await lakesApi.getAll({ limit: 50 });
      return response.data.data;
    },
  });

  const renderLake = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.lakeCard}
      onPress={() => navigation.navigate('LakeDetail', { lakeId: item.id, lakeName: item.name })}
    >
      <View style={styles.lakeHeader}>
        <View style={styles.lakeInfo}>
          <Text style={styles.lakeName}>{item.name}</Text>
          <Text style={styles.lakeRegion}>{item.region}</Text>
        </View>
        {item.boatLaunchAvailable && (
          <Ionicons name="boat" size={20} color={Colors.primary} />
        )}
      </View>

      <View style={styles.lakeDetails}>
        {item.maxDepth && (
          <View style={styles.detailItem}>
            <Ionicons name="resize-outline" size={16} color={Colors.gray500} />
            <Text style={styles.detailText}>{item.maxDepth} ft deep</Text>
          </View>
        )}
        {item.surfaceArea && (
          <View style={styles.detailItem}>
            <Ionicons name="expand-outline" size={16} color={Colors.gray500} />
            <Text style={styles.detailText}>{item.surfaceArea.toLocaleString()} acres</Text>
          </View>
        )}
        {item._count?.stockingHistory > 0 && (
          <View style={[styles.detailItem, styles.stockedBadge]}>
            <Ionicons name="fish" size={16} color={Colors.success} />
            <Text style={[styles.detailText, { color: Colors.success }]}>Stocked</Text>
          </View>
        )}
      </View>

      {item.species && item.species.length > 0 && (
        <View style={styles.speciesContainer}>
          {item.species.slice(0, 4).map((sp: any, index: number) => (
            <View key={index} style={styles.speciesTag}>
              <Text style={styles.speciesText}>
                {sp.species.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.gray500} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search lakes..."
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

      <FlatList
        data={lakes}
        renderItem={renderLake}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="water-outline" size={48} color={Colors.gray400} />
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading lakes...' : 'No lakes found'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchContainer: { padding: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.gray200 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray100, borderRadius: 8, paddingHorizontal: Spacing.md, height: 44 },
  searchInput: { flex: 1, marginLeft: Spacing.sm, fontSize: 16, color: Colors.charcoal },
  listContainer: { padding: Spacing.base },
  lakeCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.base, marginBottom: Spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  lakeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  lakeInfo: { flex: 1 },
  lakeName: { fontSize: 18, fontWeight: '600', color: Colors.charcoal },
  lakeRegion: { fontSize: 14, color: Colors.gray500, marginTop: 2 },
  lakeDetails: { flexDirection: 'row', gap: Spacing.base, marginBottom: Spacing.md },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: Colors.gray600 },
  stockedBadge: { backgroundColor: Colors.success + '15', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 4 },
  speciesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  speciesTag: { backgroundColor: Colors.primary + '15', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: 4 },
  speciesText: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['4xl'] },
  emptyText: { marginTop: Spacing.base, color: Colors.gray500, fontSize: 16 },
});
