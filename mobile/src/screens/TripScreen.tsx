// AK FISH Trip Screen
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Colors, Spacing } from '../config';
import { RootStackParamList } from '../navigation';

type RouteProps = RouteProp<RootStackParamList, 'Trip'>;

export function TripScreen() {
  const route = useRoute<RouteProps>();
  const isNewTrip = !route.params?.tripId;

  return (
    <ScrollView style={styles.container}>
      {isNewTrip ? (
        <View style={styles.newTripContainer}>
          <Ionicons name="navigate" size={64} color={Colors.primary} />
          <Text style={styles.title}>Start New Trip</Text>
          <Text style={styles.subtitle}>Track your fishing trip with GPS breadcrumbs, log conditions, and record your catches.</Text>
          <TouchableOpacity style={styles.startButton}>
            <Ionicons name="play" size={24} color={Colors.surface} />
            <Text style={styles.startText}>Start Tracking</Text>
          </TouchableOpacity>
          <View style={styles.featureList}>
            <View style={styles.featureItem}><Ionicons name="checkmark-circle" size={20} color={Colors.success} /><Text style={styles.featureText}>GPS track recording</Text></View>
            <View style={styles.featureItem}><Ionicons name="checkmark-circle" size={20} color={Colors.success} /><Text style={styles.featureText}>Distance & time tracking</Text></View>
            <View style={styles.featureItem}><Ionicons name="checkmark-circle" size={20} color={Colors.success} /><Text style={styles.featureText}>Auto-capture conditions</Text></View>
            <View style={styles.featureItem}><Ionicons name="checkmark-circle" size={20} color={Colors.success} /><Text style={styles.featureText}>Link catches to trip</Text></View>
          </View>
        </View>
      ) : (
        <View style={styles.tripDetail}>
          <Text style={styles.title}>Trip Details</Text>
          <Text style={styles.subtitle}>Trip ID: {route.params?.tripId}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  newTripContainer: { flex: 1, alignItems: 'center', padding: Spacing.xl, paddingTop: Spacing['4xl'] },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.charcoal, marginTop: Spacing.lg },
  subtitle: { fontSize: 16, color: Colors.gray500, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl },
  startButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, borderRadius: 30, gap: Spacing.sm },
  startText: { color: Colors.surface, fontSize: 18, fontWeight: '600' },
  featureList: { marginTop: Spacing['2xl'], alignSelf: 'stretch' },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  featureText: { fontSize: 16, color: Colors.gray600 },
  tripDetail: { padding: Spacing.xl },
});
