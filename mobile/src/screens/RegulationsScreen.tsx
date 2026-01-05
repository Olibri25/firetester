// AK FISH Regulations Screen
import React from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing } from '../config';
import { regulationsApi } from '../services/api';
import { RootStackParamList } from '../navigation';

type RouteProps = RouteProp<RootStackParamList, 'Regulations'>;

export function RegulationsScreen() {
  const route = useRoute<RouteProps>();
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: regulations, isLoading } = useQuery({
    queryKey: ['regulations', route.params?.location, searchQuery],
    queryFn: async () => {
      if (route.params?.location) {
        const response = await regulationsApi.getByLocation(route.params.location.lat, route.params.location.lng);
        return response.data.data;
      }
      if (searchQuery.length >= 2) {
        const response = await regulationsApi.search(searchQuery);
        return response.data.data;
      }
      const response = await regulationsApi.getAll();
      return response.data.data;
    },
  });

  const renderRegulation = ({ item }: any) => (
    <View style={styles.regCard}>
      <View style={styles.regHeader}>
        <Ionicons name="document-text" size={20} color={Colors.primary} />
        <Text style={styles.regArea}>{item.area}</Text>
      </View>
      <Text style={styles.waterBody}>{item.waterBody}</Text>
      <Text style={styles.species}>{item.species?.replace('_', ' ').toUpperCase()}</Text>
      <View style={styles.limitRow}>
        <View style={styles.limitItem}><Text style={styles.limitLabel}>Bag Limit</Text><Text style={styles.limitValue}>{item.bagLimit}</Text></View>
        {item.sizeLimitMin && <View style={styles.limitItem}><Text style={styles.limitLabel}>Min Size</Text><Text style={styles.limitValue}>{item.sizeLimitMin}"</Text></View>}
      </View>
      <Text style={styles.summary}>{item.plainEnglishSummary}</Text>
      {item.gearRestrictions?.length > 0 && (
        <View style={styles.restrictions}>
          <Ionicons name="construct" size={14} color={Colors.warning} />
          <Text style={styles.restrictionsText}>{item.gearRestrictions.join(', ')}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.gray500} />
          <TextInput style={styles.searchInput} placeholder="Search by area or water body..." placeholderTextColor={Colors.gray500} value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      </View>
      <FlatList data={regulations} renderItem={renderRegulation} keyExtractor={(item) => item.id} contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<View style={styles.emptyContainer}><Ionicons name="document-text-outline" size={48} color={Colors.gray400} /><Text style={styles.emptyText}>{isLoading ? 'Loading...' : 'No regulations found'}</Text></View>}
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
  regCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.base, marginBottom: Spacing.md },
  regHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  regArea: { fontSize: 16, fontWeight: '600', color: Colors.charcoal, marginLeft: Spacing.sm },
  waterBody: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  species: { fontSize: 12, fontWeight: '600', color: Colors.accent, marginTop: 2 },
  limitRow: { flexDirection: 'row', marginTop: Spacing.md, gap: Spacing.xl },
  limitItem: { alignItems: 'center' },
  limitLabel: { fontSize: 11, color: Colors.gray500 },
  limitValue: { fontSize: 24, fontWeight: 'bold', color: Colors.charcoal },
  summary: { fontSize: 14, color: Colors.gray600, marginTop: Spacing.md, lineHeight: 20, backgroundColor: Colors.gray50, padding: Spacing.sm, borderRadius: 8 },
  restrictions: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: Spacing.xs },
  restrictionsText: { fontSize: 13, color: Colors.warning },
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing['4xl'] },
  emptyText: { marginTop: Spacing.base, color: Colors.gray500 },
});
