// AK FISH Profile Screen

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing } from '../config';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, isAuthenticated, logout } = useAuthStore();

  const menuItems = [
    { icon: 'location', label: 'My Waypoints', screen: 'Waypoints' as const },
    { icon: 'map', label: 'Offline Maps', screen: 'Settings' as const },
    { icon: 'notifications', label: 'Notifications', screen: 'Settings' as const },
    { icon: 'settings', label: 'Settings', screen: 'Settings' as const },
  ];

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <View style={styles.logoContainer}>
          <Ionicons name="fish" size={80} color={Colors.primary} />
          <Text style={styles.appName}>AK FISH</Text>
        </View>
        <Text style={styles.authTitle}>Welcome to AK FISH</Text>
        <Text style={styles.authText}>Sign in to track your catches, save waypoints, and get personalized alerts.</Text>
        <TouchableOpacity style={styles.signInButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tierColors = { FREE: Colors.gray500, PREMIUM: Colors.primary, ELITE: Colors.kingColor };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user?.displayName?.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <Text style={styles.displayName}>{user?.displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.tierBadge, { backgroundColor: tierColors[user?.subscriptionTier || 'FREE'] }]}>
          <Text style={styles.tierText}>{user?.subscriptionTier} Member</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={() => navigation.navigate(item.screen)}>
            <Ionicons name={item.icon as any} size={24} color={Colors.primary} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        ))}
      </View>

      {user?.subscriptionTier === 'FREE' && (
        <TouchableOpacity style={styles.upgradeCard}>
          <Ionicons name="rocket" size={32} color={Colors.kingColor} />
          <View style={styles.upgradeContent}>
            <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
            <Text style={styles.upgradeText}>Get offline maps, unlimited waypoints, and run predictions</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.kingColor} />
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  authContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  logoContainer: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  appName: { fontSize: 32, fontWeight: 'bold', color: Colors.primary, marginTop: Spacing.sm },
  authTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.charcoal },
  authText: { fontSize: 16, color: Colors.gray600, textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl },
  signInButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing['3xl'], paddingVertical: Spacing.md, borderRadius: 8, marginBottom: Spacing.md },
  signInText: { color: Colors.surface, fontSize: 16, fontWeight: '600' },
  registerButton: { borderWidth: 2, borderColor: Colors.primary, paddingHorizontal: Spacing['3xl'], paddingVertical: Spacing.md, borderRadius: 8 },
  registerText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
  profileHeader: { alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.surface },
  avatarContainer: { marginBottom: Spacing.md },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: Colors.surface },
  displayName: { fontSize: 24, fontWeight: 'bold', color: Colors.charcoal },
  email: { fontSize: 14, color: Colors.gray500, marginTop: 4 },
  tierBadge: { marginTop: Spacing.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.xs, borderRadius: 20 },
  tierText: { color: Colors.surface, fontSize: 12, fontWeight: '600' },
  menuContainer: { backgroundColor: Colors.surface, marginTop: Spacing.base },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  menuLabel: { flex: 1, marginLeft: Spacing.md, fontSize: 16, color: Colors.charcoal },
  upgradeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.kingColor + '15', margin: Spacing.base, padding: Spacing.base, borderRadius: 12, borderWidth: 1, borderColor: Colors.kingColor },
  upgradeContent: { flex: 1, marginLeft: Spacing.md },
  upgradeTitle: { fontSize: 16, fontWeight: '600', color: Colors.charcoal },
  upgradeText: { fontSize: 12, color: Colors.gray600, marginTop: 2 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.base, margin: Spacing.base, backgroundColor: Colors.error + '10', borderRadius: 8 },
  logoutText: { color: Colors.error, fontSize: 16, fontWeight: '500' },
});
