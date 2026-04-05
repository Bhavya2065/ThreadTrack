import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, Alert, Dimensions, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, TextInput, Button, useTheme, Divider, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { authService } from '../src/services/api';
import { createStyles } from '../assets/Styles/LoginStyles';
import { GlassCard } from '../src/components/v2/GlassCard';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    noSpace: true,
    specialChar: false,
  });

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  // Real-time password validation
  const validatePassword = (pass: string) => {
    setPassword(pass);
    setPasswordCriteria({
      length: pass.length >= 8,
      lowercase: /[a-z]/.test(pass),
      uppercase: /[A-Z]/.test(pass),
      number: /[0-9]/.test(pass),
      noSpace: !/\s/.test(pass),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
    });
  };

  const handleRegister = async () => {
    Haptics.selectionAsync();

    if (!username || !password || !confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setErrorMessage('Please fill in all fields.');
      setErrorVisible(true);
      return;
    }

    if (username.length < 4) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setErrorMessage('Username must be at least 4 characters.');
      setErrorVisible(true);
      return;
    }

    const { length, lowercase, uppercase, number, noSpace, specialChar } = passwordCriteria;
    if (!length || !lowercase || !uppercase || !number || !noSpace || !specialChar) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setErrorMessage('Password does not meet all security criteria.');
      setErrorVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setErrorMessage('Passwords do not match.');
      setErrorVisible(true);
      return;
    }

    setLoading(true);
    try {
      // Role is hardcoded as 'Buyer' on the backend for public registrations, 
      // but we pass it anyway to match API signature.
      const res = await authService.register({ username, password, role: 'Buyer' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessMessage('User registered successfully! Please log in.');
      setSuccessVisible(true);
      // Optional: Delay redirect to allow reading the snackbar
      setTimeout(() => {
        router.replace('/');
      }, 3000);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Proper Error handling with specific types from API
      const errorMsg = err.response?.data?.error || err.message || 'Registration failed.';
      setErrorMessage(errorMsg);
      setErrorVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const CriteriaItem = ({ label, met }: { label: string; met: boolean }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
      <Text style={{ 
        color: met ? '#15AD66' : '#EF4444', 
        fontSize: 14, 
        marginRight: 8,
        fontWeight: 'bold'
      }}>
        {met ? '✓' : '✕'}
      </Text>
      <Text style={{ 
        color: met ? '#15AD66' : '#EF4444', 
        fontSize: 13,
        fontWeight: met ? '600' : '400'
      }}>
        {label}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <View style={{ width: 40, height: 40, backgroundColor: theme.colors.primary, borderRadius: 8, transform: [{ rotate: '45deg' }] }} />
            </View>
            <Text style={styles.title}>Join ThreadTrack</Text>
            <Text style={styles.subtitle}>Start Your Supply Chain Journey</Text>
          </View>

          <GlassCard>
            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              onFocus={() => setIsPasswordFocused(false)}
              mode="outlined"
              style={styles.input}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              autoCapitalize="none"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={validatePassword}
              onFocus={() => setIsPasswordFocused(true)}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              right={<TextInput.Icon icon={showPassword ? "eye" : "eye-off"} onPress={() => setShowPassword(!showPassword)} />}
            />

            {/* Password Checklist - Only shown when password field is focused */}
            {isPasswordFocused && (
              <View style={{ marginTop: 8, marginBottom: 16, paddingLeft: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 8, color: theme.colors.onSurface }}>
                  Password must contain the following:
                </Text>
                <CriteriaItem label="A lowercase letter" met={passwordCriteria.lowercase} />
                <CriteriaItem label="A capital (uppercase) letter" met={passwordCriteria.uppercase} />
                <CriteriaItem label="A number" met={passwordCriteria.number} />
                <CriteriaItem label="At least one special character" met={passwordCriteria.specialChar} />
                <CriteriaItem label="No blank space is allowed" met={passwordCriteria.noSpace} />
                <CriteriaItem label="Minimum 8 characters" met={passwordCriteria.length} />
              </View>
            )}

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setIsPasswordFocused(false)}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              right={<TextInput.Icon icon={showConfirmPassword ? "eye" : "eye-off"} onPress={() => setShowConfirmPassword(!showConfirmPassword)} />}
            />

            <Button
              mode="contained"
              onPress={() => handleRegister()}
              style={styles.signUpButton}
              labelStyle={styles.buttonLabel}
              loading={loading}
              disabled={loading}
            >
              Sign Up
            </Button>

            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 8 }}>
              <Text variant="labelSmall" style={styles.alreadyAccountLabel}>Already have an account?</Text>
              <Button
                mode="text"
                onPress={() => router.replace('/')}
                labelStyle={{ fontSize: 14, fontWeight: 'bold' }}
                textColor={theme.colors.primary}
                compact
              >
                Back to Login
              </Button>
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={errorVisible}
        onDismiss={() => setErrorVisible(false)}
        action={{
          label: 'Dismiss',
          onPress: () => setErrorVisible(false),
        }}
        style={{ backgroundColor: theme.colors.error }}
        duration={5000}
      >
        {errorMessage}
      </Snackbar>

      <Snackbar
        visible={successVisible}
        onDismiss={() => setSuccessVisible(false)}
        action={{
          label: 'Go to Login',
          onPress: () => router.replace('/'),
        }}
        style={{ backgroundColor: '#15AD66' }} // Custom Success Green
        duration={5000}
      >
        {successMessage}
      </Snackbar>
    </View>
  );
}
