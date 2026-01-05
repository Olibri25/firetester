// AK FISH Weather Screen
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing } from '../config';
import { weatherApi, tidesApi } from '../services/api';
import { RootStackParamList } from '../navigation';

type RouteProps = RouteProp<RootStackParamList, 'Weather'>;

export function WeatherScreen() {
  const route = useRoute<RouteProps>();
  const location = route.params?.location || { lat: 61.2181, lng: -149.9003 };

  const { data: weather } = useQuery({
    queryKey: ['weather', location.lat, location.lng],
    queryFn: async () => { const response = await weatherApi.getCurrent(location.lat, location.lng); return response.data.data; },
  });

  const { data: solunar } = useQuery({
    queryKey: ['solunar', location.lat, location.lng],
    queryFn: async () => { const response = await weatherApi.getSolunar(location.lat, location.lng); return response.data.data; },
  });

  const { data: tides } = useQuery({
    queryKey: ['tides-nearest', location.lat, location.lng],
    queryFn: async () => { const response = await tidesApi.getNearestStation(location.lat, location.lng); return response.data.data; },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.weatherCard}>
        <Text style={styles.sectionTitle}>Current Conditions</Text>
        <View style={styles.currentWeather}>
          <Text style={styles.temperature}>{weather?.temperature || '--'}°{weather?.temperatureUnit || 'F'}</Text>
          <Text style={styles.conditions}>{weather?.conditions || 'Loading...'}</Text>
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}><Ionicons name="water" size={20} color={Colors.primary} /><Text style={styles.detailValue}>{weather?.humidity || '--'}%</Text><Text style={styles.detailLabel}>Humidity</Text></View>
          <View style={styles.detailItem}><Ionicons name="speedometer" size={20} color={Colors.primary} /><Text style={styles.detailValue}>{weather?.windSpeed || '--'}</Text><Text style={styles.detailLabel}>Wind</Text></View>
          <View style={styles.detailItem}><Ionicons name="trending-up" size={20} color={Colors.primary} /><Text style={styles.detailValue}>{weather?.pressure || '--'}</Text><Text style={styles.detailLabel}>Pressure</Text></View>
        </View>
      </View>

      <View style={styles.solunarCard}>
        <Text style={styles.sectionTitle}>Solunar Forecast</Text>
        <View style={styles.moonRow}>
          <Ionicons name="moon" size={32} color={Colors.primary} />
          <View style={styles.moonInfo}>
            <Text style={styles.moonPhase}>{solunar?.moonPhase || 'Loading...'}</Text>
            <Text style={styles.moonIllum}>{solunar?.moonIllumination || '--'}% illumination</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{solunar?.rating || '-'}/5</Text>
          </View>
        </View>
        <Text style={styles.periodLabel}>Major Feeding Periods</Text>
        {solunar?.majorPeriods?.map((p: any, i: number) => (
          <Text key={i} style={styles.periodTime}>{p.start} - {p.end}</Text>
        ))}
        <Text style={styles.periodLabel}>Minor Feeding Periods</Text>
        {solunar?.minorPeriods?.map((p: any, i: number) => (
          <Text key={i} style={styles.periodTime}>{p.start} - {p.end}</Text>
        ))}
      </View>

      <View style={styles.tideCard}>
        <Text style={styles.sectionTitle}>Nearest Tide Station</Text>
        <Text style={styles.stationName}>{tides?.name || 'Loading...'}</Text>
        <Text style={styles.stationDistance}>{tides?.distance ? `${tides.distance} miles away` : ''}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  weatherCard: { backgroundColor: Colors.surface, margin: Spacing.base, borderRadius: 12, padding: Spacing.base },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.gray500, marginBottom: Spacing.md },
  currentWeather: { alignItems: 'center', marginBottom: Spacing.lg },
  temperature: { fontSize: 64, fontWeight: '200', color: Colors.charcoal },
  conditions: { fontSize: 18, color: Colors.gray600 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: Colors.gray100, paddingTop: Spacing.md },
  detailItem: { alignItems: 'center' },
  detailValue: { fontSize: 16, fontWeight: '600', color: Colors.charcoal, marginTop: 4 },
  detailLabel: { fontSize: 12, color: Colors.gray500 },
  solunarCard: { backgroundColor: Colors.surface, margin: Spacing.base, marginTop: 0, borderRadius: 12, padding: Spacing.base },
  moonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  moonInfo: { flex: 1, marginLeft: Spacing.md },
  moonPhase: { fontSize: 18, fontWeight: '600', color: Colors.charcoal },
  moonIllum: { fontSize: 14, color: Colors.gray500 },
  ratingBadge: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: 20 },
  ratingText: { color: Colors.surface, fontWeight: 'bold' },
  periodLabel: { fontSize: 13, fontWeight: '600', color: Colors.gray600, marginTop: Spacing.md },
  periodTime: { fontSize: 16, color: Colors.charcoal, marginTop: 4 },
  tideCard: { backgroundColor: Colors.surface, margin: Spacing.base, marginTop: 0, borderRadius: 12, padding: Spacing.base },
  stationName: { fontSize: 18, fontWeight: '600', color: Colors.charcoal },
  stationDistance: { fontSize: 14, color: Colors.gray500, marginTop: 2 },
});
