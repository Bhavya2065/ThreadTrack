import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, TextInput, Button, useTheme, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { authService, setToken } from '../src/services/api';
import { createStyles } from '../assets/Styles/LoginStyles';
import { GlassCard } from '../src/components/v2/GlassCard';
import { useToast } from '../src/context/ToastContext';
export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const theme = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const { showToast } = useToast();
    const handleLogin = async () => {
        Haptics.selectionAsync();
        if (!username || !password) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            showToast({
                title: 'Input Required',
                message: 'Please enter both username and password.',
                type: 'warning'
            });
            return;
        }
        if (username.length < 3) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            showToast({
                title: 'Validation Error',
                message: 'Username must be at least 3 characters.',
                type: 'warning'
            });
            return;
        }
        setLoading(true);
        try {
            const res = await authService.login(username, password);
            const { token, role, id, username: loggedUsername } = res.data;
            await setToken(token, { id, role, username: loggedUsername });
            showToast({
                title: 'Success',
                message: `Welcome back, ${loggedUsername}!`,
                type: 'success'
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Handle routing based on role, mapping Super Admin to the admin portal
            const targetRole = role.toLowerCase();
            const route = (targetRole === 'super admin' || targetRole === 'admin') ? 'admin' : targetRole;
            router.replace(`/${route}`);
        }
        catch (err) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const errorMsg = err.response?.data?.message || 'Invalid username or password.';
            showToast({
                title: 'Login Failed',
                message: errorMsg,
                type: 'error'
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleSimulatedLogin = async (role) => {
        Haptics.selectionAsync();
        let credentials = { username: 'admin', password: 'admin123' };
        if (role === 'worker')
            credentials = { username: 'worker1', password: 'worker123' };
        if (role === 'buyer')
            credentials = { username: 'buyer1', password: 'buyer123' };
        try {
            const res = await authService.login(credentials.username, credentials.password);
            const { token, role: resRole, id, username: loggedUsername } = res.data;
            await setToken(token, { id, role: resRole, username: loggedUsername });
            showToast({
                title: 'Developer Login',
                message: `Authenticated as ${resRole}`,
                type: 'success'
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace(`/${role}`);
        }
        catch (err) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            showToast({
                title: 'Simulation Error',
                message: 'Could not log in as test user.',
                type: 'error'
            });
        }
    };
    return (<View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <View style={{ width: 40, height: 40, backgroundColor: theme.colors.primary, borderRadius: 8, transform: [{ rotate: '45deg' }] }}/>
          </View>
          <Text style={styles.title}>ThreadTrack</Text>
          <Text style={styles.subtitle}>B2B Supply Chain Excellence</Text>
        </View>

        <GlassCard>
          <TextInput label="Username" value={username} onChangeText={setUsername} mode="outlined" style={styles.input} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} autoCapitalize="none"/>
          <TextInput label="Password" value={password} onChangeText={setPassword} mode="outlined" secureTextEntry={!showPassword} style={styles.input} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} right={<TextInput.Icon icon={showPassword ? "eye" : "eye-off"} onPress={() => setShowPassword(!showPassword)}/>}/>

          <Button mode="contained" onPress={() => handleLogin()} style={styles.signInButton} labelStyle={styles.buttonLabel} loading={loading} disabled={loading}>
            Sign In
          </Button>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 8 }}>
            <Text variant="labelSmall" style={styles.newAccountLabel}>New to ThreadTrack?</Text>
            <Button mode="text" onPress={() => router.push('/register')} labelStyle={{ fontSize: 14, fontWeight: 'bold' }} textColor={theme.colors.primary} compact>
              Sign Up
            </Button>
          </View>

          <Divider style={styles.divider}/>
          <Text variant="labelSmall" style={styles.roleLabel}>Development Quick-Access:</Text>
          <View style={styles.buttonGroup}>
            <Button mode="text" onPress={() => handleSimulatedLogin('admin')} style={styles.quickAccessButton} textColor={theme.colors.onSurfaceVariant} compact>Admin</Button>
            <Button mode="text" onPress={() => handleSimulatedLogin('worker')} style={styles.quickAccessButton} textColor={theme.colors.onSurfaceVariant} compact>Worker</Button>
            <Button mode="text" onPress={() => handleSimulatedLogin('buyer')} style={styles.quickAccessButton} textColor={theme.colors.onSurfaceVariant} compact>Buyer</Button>
          </View>
        </GlassCard>
      </KeyboardAvoidingView>
    </View>);
}
