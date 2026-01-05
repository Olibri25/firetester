// AK FISH Register Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing } from '../config';
import { useAuthStore } from '../store/authStore';

export function RegisterScreen() {
  const navigation = useNavigation();
  const register = useAuthStore((state) => state.register);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName || !email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
    setIsLoading(true);
    try {
      await register(email, password, displayName);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.error?.message || 'Could not create account');
    } finally { setIsLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join AK FISH and start tracking your Alaska fishing adventures</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color={Colors.gray500} />
          <TextInput style={styles.input} placeholder="Display Name" placeholderTextColor={Colors.gray500} value={displayName} onChangeText={setDisplayName} />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={Colors.gray500} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors.gray500} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.gray500} />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor={Colors.gray500} value={password} onChangeText={setPassword} secureTextEntry />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.gray500} />
          <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor={Colors.gray500} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        </View>

        <TouchableOpacity style={[styles.registerButton, isLoading && styles.buttonDisabled]} onPress={handleRegister} disabled={isLoading}>
          <Text style={styles.registerText}>{isLoading ? 'Creating Account...' : 'Create Account'}</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>By creating an account, you agree to our Terms of Service and Privacy Policy</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, padding: Spacing.xl, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.charcoal, textAlign: 'center' },
  subtitle: { fontSize: 16, color: Colors.gray500, textAlign: 'center', marginBottom: Spacing['2xl'] },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.gray200 },
  input: { flex: 1, paddingVertical: Spacing.md, marginLeft: Spacing.sm, fontSize: 16, color: Colors.charcoal },
  registerButton: { backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: 8, alignItems: 'center', marginTop: Spacing.md },
  buttonDisabled: { opacity: 0.7 },
  registerText: { color: Colors.surface, fontSize: 16, fontWeight: '600' },
  termsText: { fontSize: 12, color: Colors.gray500, textAlign: 'center', marginTop: Spacing.lg },
});
