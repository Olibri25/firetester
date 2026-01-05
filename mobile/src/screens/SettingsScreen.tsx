// AK FISH Settings Screen
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../config';
import { useSettingsStore } from '../store/settingsStore';

export function SettingsScreen() {
  const settings = useSettingsStore();

  const SettingRow = ({ icon, label, value, onToggle }: any) => (
    <View style={styles.settingRow}>
      <Ionicons name={icon} size={22} color={Colors.primary} />
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: Colors.primary, false: Colors.gray300 }} />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Map Settings</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.settingRow}>
          <Ionicons name="map" size={22} color={Colors.primary} />
          <Text style={styles.settingLabel}>Map Style</Text>
          <Text style={styles.settingValue}>{settings.mapStyle}</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Map Layers</Text>
      <View style={styles.section}>
        <SettingRow icon="map-outline" label="Public Land" value={settings.showPublicLand} onToggle={() => settings.toggleMapLayer('publicLand')} />
        <SettingRow icon="analytics" label="Fish Count Stations" value={settings.showFishCountStations} onToggle={() => settings.toggleMapLayer('fishCountStations')} />
        <SettingRow icon="fish" label="Stocked Lakes" value={settings.showStockedLakes} onToggle={() => settings.toggleMapLayer('stockedLakes')} />
        <SettingRow icon="document-text" label="Regulation Zones" value={settings.showRegulationZones} onToggle={() => settings.toggleMapLayer('regulationZones')} />
      </View>

      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.section}>
        <SettingRow icon="warning" label="Emergency Orders" value={settings.notifications.emergencyOrders} onToggle={(v: boolean) => settings.setNotificationSetting('emergencyOrders', v)} />
        <SettingRow icon="analytics" label="Fish Count Alerts" value={settings.notifications.fishCountAlerts} onToggle={(v: boolean) => settings.setNotificationSetting('fishCountAlerts', v)} />
        <SettingRow icon="fish" label="Stocking Alerts" value={settings.notifications.stockingAlerts} onToggle={(v: boolean) => settings.setNotificationSetting('stockingAlerts', v)} />
        <SettingRow icon="partly-sunny" label="Weather Alerts" value={settings.notifications.weatherAlerts} onToggle={(v: boolean) => settings.setNotificationSetting('weatherAlerts', v)} />
      </View>

      <Text style={styles.sectionTitle}>Display</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.settingRow}>
          <Ionicons name="moon" size={22} color={Colors.primary} />
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Text style={styles.settingValue}>{settings.darkMode}</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
        </TouchableOpacity>
        <SettingRow icon="contrast" label="High Contrast" value={settings.highContrastMode} onToggle={settings.setHighContrastMode} />
      </View>

      <Text style={styles.sectionTitle}>Offline</Text>
      <View style={styles.section}>
        <TouchableOpacity style={styles.settingRow}>
          <Ionicons name="download" size={22} color={Colors.primary} />
          <Text style={styles.settingLabel}>Downloaded Maps</Text>
          <Text style={styles.settingValue}>{settings.offlineMapRegions.length} regions</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.gray500, marginLeft: Spacing.base, marginTop: Spacing.lg, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  section: { backgroundColor: Colors.surface },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  settingLabel: { flex: 1, fontSize: 16, color: Colors.charcoal, marginLeft: Spacing.md },
  settingValue: { fontSize: 14, color: Colors.gray500, marginRight: Spacing.sm, textTransform: 'capitalize' },
});
