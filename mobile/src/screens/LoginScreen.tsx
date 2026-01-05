// AK FISH Login Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing } from '../config';
import { useAuthStore } from '../store/authStore';

export function LoginScreen() {
  const navigation = useNavigation();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please enter email and password'); return; }
    setIsLoading(true);
    try {
      await login(email, password);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.error?.message || 'Invalid credentials');
    } finally { setIsLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Ionicons name="fish" size={64} color={Colors.primary} style={styles.logo} />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your AK FISH account</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={Colors.gray500} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors.gray500} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.gray500} />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor={Colors.gray500} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.gray500} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.loginButton, isLoading && styles.buttonDisabled]} onPress={handleLogin} disabled={isLoading}>
          <Text style={styles.loginText}>{isLoading ? 'Signing In...' : 'Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotButton}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: Spacing.xl, justifyContent: 'center' },
  logo: { alignSelf: 'center', marginBottom: Spacing.lg },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.charcoal, textAlign: 'center' },
  subtitle: { fontSize: 16, color: Colors.gray500, textAlign: 'center', marginBottom: Spacing['2xl'] },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.gray200 },
  input: { flex: 1, paddingVertical: Spacing.md, marginLeft: Spacing.sm, fontSize: 16, color: Colors.charcoal },
  loginButton: { backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: 8, alignItems: 'center', marginTop: Spacing.md },
  buttonDisabled: { opacity: 0.7 },
  loginText: { color: Colors.surface, fontSize: 16, fontWeight: '600' },
  forgotButton: { alignItems: 'center', marginTop: Spacing.lg },
  forgotText: { color: Colors.primary, fontSize: 14 },
});
