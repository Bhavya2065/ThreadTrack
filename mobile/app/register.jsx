import React, { useState, useEffect } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { authService } from '../src/services/api';
import { createStyles } from '../assets/Styles/LoginStyles';
import { GlassCard } from '../src/components/v2/GlassCard';
import { useToast } from '../src/context/ToastContext';
import { CustomDropdown } from '../src/components/v2/CustomDropdown';
import { ShoppingBag, HardHat, User } from 'lucide-react-native';
export default function RegisterScreen() {
    const { showToast } = useToast();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [role, setRole] = useState('Buyer');
    const [roles, setRoles] = useState(['Buyer', 'Worker']);
    const [usernameCriteria, setUsernameCriteria] = useState({
        length: false,
        noSpace: true,
        letterAndDigit: false,
    });
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        noSpace: true,
        specialChar: false,
    });
    const [isUsernameFocused, setIsUsernameFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await authService.getRoles();
                if (res.data && res.data.length > 0) {
                    const filteredRoles = res.data.filter((r) => r !== 'Admin');
                    setRoles(filteredRoles);
                    if (filteredRoles.includes('Buyer'))
                        setRole('Buyer');
                    else if (filteredRoles.length > 0)
                        setRole(filteredRoles[0]);
                }
            }
            catch (err) {
                console.error('Failed to fetch roles', err);
            }
        };
        fetchRoles();
    }, []);
    const theme = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    // Real-time username validation
    const validateUsername = (user) => {
        setUsername(user);
        setUsernameCriteria({
            length: user.length >= 6,
            noSpace: !/\s/.test(user),
            letterAndDigit: /[a-zA-Z]/.test(user) && /[0-9]/.test(user),
        });
    };
    // Real-time password validation
    const validatePassword = (pass) => {
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
            showToast({
                title: 'Form Incomplete',
                message: 'Please fill in all fields.',
                type: 'warning'
            });
            return;
        }
        // Username validation
        const { length: uLength, noSpace: uNoSpace, letterAndDigit: uLetterAndDigit } = usernameCriteria;
        if (!uLength || !uNoSpace || !uLetterAndDigit) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            showToast({
                title: 'Validation',
                message: 'Username does not meet all criteria.',
                type: 'warning'
            });
            return;
        }
        const { length, lowercase, uppercase, number, noSpace, specialChar } = passwordCriteria;
        if (!length || !lowercase || !uppercase || !number || !noSpace || !specialChar) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            showToast({
                title: 'Security',
                message: 'Password does not meet all security criteria.',
                type: 'warning'
            });
            return;
        }
        if (password !== confirmPassword) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            showToast({
                title: 'Password Mismatch',
                message: 'Passwords do not match.',
                type: 'error'
            });
            return;
        }
        setLoading(true);
        try {
            const res = await authService.register({ username, password, role });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast({
                title: 'Request Sent',
                message: 'Registration successful! Your Requet is sending to Super Admin for review.',
                type: 'success'
            });
            // Optional: Delay redirect to allow reading the toast
            setTimeout(() => {
                router.replace('/');
            }, 2000);
        }
        catch (err) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            // Proper Error handling with specific types from API
            const errorMsg = err.response?.data?.error || err.message || 'Registration failed.';
            showToast({
                title: 'Registration Error',
                message: errorMsg,
                type: 'error'
            });
        }
        finally {
            setLoading(false);
        }
    };
    const CriteriaItem = ({ label, met }) => (<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
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
    </View>);
    return (<View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <View style={{ width: 40, height: 40, backgroundColor: theme.colors.primary, borderRadius: 8, transform: [{ rotate: '45deg' }] }}/>
            </View>
            <Text style={styles.title}>Join ThreadTrack</Text>
            <Text style={styles.subtitle}>Start Your Supply Chain Journey</Text>
          </View>

          <GlassCard>
            <TextInput label="Username" value={username} onChangeText={validateUsername} onFocus={() => {
            setIsUsernameFocused(true);
            setIsPasswordFocused(false);
        }} mode="outlined" style={styles.input} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} autoCapitalize="none"/>

            {/* Username Checklist - Only shown when username field is focused */}
            {isUsernameFocused && (<View style={{ marginTop: 8, marginBottom: 16, paddingLeft: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 8, color: theme.colors.onSurface }}>
                  Username must contain the following:
                </Text>
                <CriteriaItem label="Minimum 6 characters" met={usernameCriteria.length}/>
                <CriteriaItem label="No blank space is allowed" met={usernameCriteria.noSpace}/>
                <CriteriaItem label="Contain both letter and digit" met={usernameCriteria.letterAndDigit}/>
              </View>)}
            <TextInput label="Password" value={password} onChangeText={validatePassword} onFocus={() => {
            setIsUsernameFocused(false);
            setIsPasswordFocused(true);
        }} mode="outlined" secureTextEntry={!showPassword} style={styles.input} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} right={<TextInput.Icon icon={showPassword ? "eye" : "eye-off"} onPress={() => setShowPassword(!showPassword)}/>}/>

            {/* Password Checklist - Only shown when password field is focused */}
            {isPasswordFocused && (<View style={{ marginTop: 8, marginBottom: 16, paddingLeft: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 8, color: theme.colors.onSurface }}>
                  Password must contain the following:
                </Text>
                <CriteriaItem label="A lowercase letter" met={passwordCriteria.lowercase}/>
                <CriteriaItem label="A capital (uppercase) letter" met={passwordCriteria.uppercase}/>
                <CriteriaItem label="A number" met={passwordCriteria.number}/>
                <CriteriaItem label="At least one special character" met={passwordCriteria.specialChar}/>
                <CriteriaItem label="No blank space is allowed" met={passwordCriteria.noSpace}/>
                <CriteriaItem label="Minimum 8 characters" met={passwordCriteria.length}/>
              </View>)}

            <TextInput label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} onFocus={() => setIsPasswordFocused(false)} mode="outlined" secureTextEntry={!showConfirmPassword} style={styles.input} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} right={<TextInput.Icon icon={showConfirmPassword ? "eye" : "eye-off"} onPress={() => setShowConfirmPassword(!showConfirmPassword)}/>}/>

            <CustomDropdown label="Requested Role" value={role} onSelect={setRole} options={roles.map(r => ({
            label: r,
            value: r,
            icon: r.toLowerCase() === 'buyer' ? <ShoppingBag size={18} color="#64748b"/> :
                r.toLowerCase() === 'worker' ? <HardHat size={18} color="#64748b"/> :
                    <User size={18} color="#64748b"/>
        }))}/>

            <Button mode="contained" onPress={() => handleRegister()} style={styles.signUpButton} labelStyle={styles.buttonLabel} loading={loading} disabled={loading}>
              Sign Up
            </Button>

            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 8 }}>
              <Text variant="labelSmall" style={styles.alreadyAccountLabel}>Already have an account?</Text>
              <Button mode="text" onPress={() => router.replace('/')} labelStyle={{ fontSize: 14, fontWeight: 'bold' }} textColor={theme.colors.primary} compact>
                Back to Login
              </Button>
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>);
}
