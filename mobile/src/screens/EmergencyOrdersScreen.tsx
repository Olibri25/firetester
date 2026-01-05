// AK FISH Emergency Orders Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import { Colors, Spacing, config } from '../config';
import { emergencyOrdersApi } from '../services/api';

export function EmergencyOrdersScreen() {
  const [showActive, setShowActive] = useState(true);

  const {
    data: orders,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['emergency-orders', showActive],
    queryFn: async () => {
      const response = await emergencyOrdersApi.getAll({ active: showActive });
      return response.data.data;
    },
    staleTime: config.cache.emergencyOrdersTTL,
  });

  const getActionIcon = (action: string): keyof typeof Ionicons.glyphMap => {
    switch (action) {
      case 'CLOSURE': return 'close-circle';
      case 'OPENING': return 'checkmark-circle';
      case 'BAG_LIMIT_CHANGE': return 'bag';
      case 'GEAR_RESTRICTION': return 'construct';
      default: return 'information-circle';
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'CLOSURE': return Colors.error;
      case 'OPENING': return Colors.success;
      default: return Colors.warning;
    }
  };

  const renderOrder = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={[styles.actionIcon, { backgroundColor: getActionColor(item.action) }]}>
          <Ionicons name={getActionIcon(item.action)} size={20} color={Colors.surface} />
        </View>
        <View style={styles.orderTitleContainer}>
          <Text style={styles.orderTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.orderDate}>
            {format(new Date(item.publishedAt), 'MMM d, yyyy')}
          </Text>
        </View>
      </View>

      <Text style={styles.orderSummary} numberOfLines={3}>{item.summary}</Text>

      <View style={styles.tagsContainer}>
        {item.affectedAreas?.slice(0, 3).map((area: string, index: number) => (
          <View key={index} style={styles.areaTag}>
            <Text style={styles.areaTagText}>{area}</Text>
          </View>
        ))}
        {item.affectedSpecies?.slice(0, 2).map((species: string, index: number) => (
          <View key={index} style={styles.speciesTag}>
            <Text style={styles.speciesTagText}>
              {species.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.effectiveDate}>
          Effective: {format(new Date(item.effectiveDate), 'MMM d, yyyy')}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, showActive && styles.toggleButtonActive]}
          onPress={() => setShowActive(true)}
        >
          <Text style={[styles.toggleText, showActive && styles.toggleTextActive]}>
            Active Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, !showActive && styles.toggleButtonActive]}
          onPress={() => setShowActive(false)}
        >
          <Text style={[styles.toggleText, !showActive && styles.toggleTextActive]}>
            All Orders
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
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
            <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptyText}>
              No active emergency orders at this time.
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
  toggleContainer: {
    flexDirection: 'row',
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontWeight: '600',
    color: Colors.gray600,
  },
  toggleTextActive: {
    color: Colors.surface,
  },
  listContainer: {
    padding: Spacing.base,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  orderTitleContainer: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.charcoal,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.gray500,
  },
  orderSummary: {
    fontSize: 14,
    color: Colors.gray600,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  areaTag: {
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
  },
  areaTagText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  speciesTag: {
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
  },
  speciesTagText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    paddingTop: Spacing.md,
  },
  effectiveDate: {
    fontSize: 12,
    color: Colors.gray500,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.charcoal,
    marginTop: Spacing.base,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray500,
    marginTop: Spacing.sm,
  },
});
