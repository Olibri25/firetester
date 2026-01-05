// AK FISH Map Layer Selector Component

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../config';
import { useSettingsStore } from '../store/settingsStore';

interface MapLayerSelectorProps {
  onClose: () => void;
}

type MapStyle = 'satellite' | 'topo' | 'hybrid' | 'nautical';

export function MapLayerSelector({ onClose }: MapLayerSelectorProps) {
  const settings = useSettingsStore();

  const mapStyles: { id: MapStyle; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'satellite', label: 'Satellite', icon: 'planet' },
    { id: 'topo', label: 'Topographic', icon: 'map' },
    { id: 'hybrid', label: 'Hybrid', icon: 'layers' },
    { id: 'nautical', label: 'Nautical', icon: 'boat' },
  ];

  const layers = [
    { id: 'publicLand' as const, label: 'Public Land', icon: 'leaf', enabled: settings.showPublicLand },
    { id: 'fishCountStations' as const, label: 'Fish Count Stations', icon: 'analytics', enabled: settings.showFishCountStations },
    { id: 'stockedLakes' as const, label: 'Stocked Lakes', icon: 'fish', enabled: settings.showStockedLakes },
    { id: 'regulationZones' as const, label: 'Regulation Zones', icon: 'document-text', enabled: settings.showRegulationZones },
  ];

  return (
    <Modal visible={true} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Map Layers</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.gray600} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Map Style</Text>
            <View style={styles.styleGrid}>
              {mapStyles.map((style) => (
                <TouchableOpacity
                  key={style.id}
                  style={[styles.styleButton, settings.mapStyle === style.id && styles.styleButtonActive]}
                  onPress={() => settings.setMapStyle(style.id)}
                >
                  <Ionicons name={style.icon} size={24} color={settings.mapStyle === style.id ? Colors.surface : Colors.primary} />
                  <Text style={[styles.styleLabel, settings.mapStyle === style.id && styles.styleLabelActive]}>{style.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Data Layers</Text>
            {layers.map((layer) => (
              <View key={layer.id} style={styles.layerRow}>
                <View style={styles.layerIcon}>
                  <Ionicons name={layer.icon as any} size={20} color={Colors.primary} />
                </View>
                <Text style={styles.layerLabel}>{layer.label}</Text>
                <Switch
                  value={layer.enabled}
                  onValueChange={() => settings.toggleMapLayer(layer.id)}
                  trackColor={{ true: Colors.primary, false: Colors.gray300 }}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  title: { fontSize: 20, fontWeight: '600', color: Colors.charcoal },
  closeButton: { padding: 4 },
  content: { padding: Spacing.base },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.gray500, marginBottom: Spacing.md, marginTop: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  styleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  styleButton: { width: '48%', backgroundColor: Colors.gray100, borderRadius: 12, padding: Spacing.md, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  styleButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primaryDark },
  styleLabel: { fontSize: 14, color: Colors.charcoal, marginTop: Spacing.xs, fontWeight: '500' },
  styleLabelActive: { color: Colors.surface },
  layerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  layerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  layerLabel: { flex: 1, marginLeft: Spacing.md, fontSize: 16, color: Colors.charcoal },
});
