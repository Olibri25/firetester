// AK FISH Quick Actions Panel Component

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, MIN_TOUCH_TARGET } from '../config';
import { RootStackParamList } from '../navigation';

interface QuickActionsPanelProps {
  onClose: () => void;
  userLocation: { latitude: number; longitude: number } | null;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function QuickActionsPanel({ onClose, userLocation }: QuickActionsPanelProps) {
  const navigation = useNavigation<NavigationProp>();

  const actions = [
    { icon: 'location', label: 'Drop Waypoint', color: Colors.primary, onPress: () => { /* Add waypoint */ onClose(); } },
    { icon: 'fish', label: 'Log Catch', color: Colors.accent, onPress: () => { navigation.navigate('Main', { screen: 'CatchLog' } as any); onClose(); } },
    { icon: 'navigate', label: 'Start Trip', color: Colors.success, onPress: () => { navigation.navigate('Trip', {}); onClose(); } },
    { icon: 'document-text', label: 'Regulations', color: Colors.info, onPress: () => { navigation.navigate('Regulations', { location: userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : undefined }); onClose(); } },
    { icon: 'partly-sunny', label: 'Weather', color: Colors.warning, onPress: () => { navigation.navigate('Weather', { location: userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : undefined }); onClose(); } },
    { icon: 'camera', label: 'Take Photo', color: Colors.gray600, onPress: () => { /* Open camera */ onClose(); } },
  ];

  return (
    <Modal visible={true} animationType="fade" transparent>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.handle} />
          <Text style={styles.title}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {actions.map((action, index) => (
              <TouchableOpacity key={index} style={styles.actionButton} onPress={action.onPress}>
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon as any} size={28} color={Colors.surface} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.base, paddingBottom: Spacing['2xl'] },
  handle: { width: 40, height: 4, backgroundColor: Colors.gray300, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  title: { fontSize: 18, fontWeight: '600', color: Colors.charcoal, textAlign: 'center', marginBottom: Spacing.lg },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  actionButton: { width: '30%', alignItems: 'center', marginBottom: Spacing.lg },
  actionIcon: { width: MIN_TOUCH_TARGET + 8, height: MIN_TOUCH_TARGET + 8, borderRadius: (MIN_TOUCH_TARGET + 8) / 2, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  actionLabel: { fontSize: 12, color: Colors.charcoal, textAlign: 'center', fontWeight: '500' },
});
