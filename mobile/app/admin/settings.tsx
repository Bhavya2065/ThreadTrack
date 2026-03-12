import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Appbar, List, Switch, useTheme, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Moon, Sun, Bell, Globe, Shield, LogOut } from 'lucide-react-native';
import { useAppTheme } from '../_layout';
import { setToken } from '../../src/services/api';
import { createStyles } from '../../assets/Styles/SettingsStyles';
import { GlassCard } from '../../src/components/v2/GlassCard';
import { TransitionView } from '../../src/components/v2/TransitionView';
import { Tokens } from '../../src/theme/tokens';

export default function SettingsScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = createStyles(theme);
    const { isDarkMode, toggleTheme } = useAppTheme();

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbarHeader}>
                <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onSurfaceVariant} />
                <Appbar.Content title="Settings" titleStyle={styles.appbarTitle} />
            </Appbar.Header>

            <ScrollView style={styles.content}>
                <View style={{ paddingTop: 12 }}>
                    <TransitionView index={0}>
                        <Text variant="labelLarge" style={{ marginLeft: 24, marginBottom: 8, color: theme.colors.primary, fontWeight: '800' }}>APPEARANCE</Text>
                        <GlassCard style={styles.glassItem}>
                            <List.Item
                                title="Dark Mode"
                                titleStyle={{ color: theme.colors.onSurface, fontWeight: '700' }}
                                description="Switch between light and dark"
                                descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                                left={() => (
                                    <View style={styles.iconContainer}>
                                        {isDarkMode ? <Moon size={22} color={theme.colors.primary} /> : <Sun size={22} color={theme.colors.primary} />}
                                    </View>
                                )}
                                right={() => (
                                    <View style={{ justifyContent: 'center' }}>
                                        <Switch value={isDarkMode} onValueChange={toggleTheme} color={theme.colors.primary} />
                                    </View>
                                )}
                            />
                        </GlassCard>
                    </TransitionView>

                    <TransitionView index={1}>
                        <Text variant="labelLarge" style={{ marginLeft: 24, marginTop: 24, marginBottom: 8, color: theme.colors.primary, fontWeight: '800' }}>PREFERENCES</Text>
                        <GlassCard style={styles.glassItem}>
                            <List.Item
                                title="Notifications"
                                titleStyle={{ color: theme.colors.onSurface, fontWeight: '700' }}
                                left={() => <View style={styles.iconContainer}><Bell size={22} color={theme.colors.onSurfaceVariant} /></View>}
                                right={() => <List.Icon icon="chevron-right" color={theme.colors.outline} />}
                                onPress={() => { }}
                            />
                            <Divider style={{ backgroundColor: theme.colors.outline, opacity: 0.3 }} />
                            <List.Item
                                title="Language"
                                titleStyle={{ color: theme.colors.onSurface, fontWeight: '700' }}
                                left={() => <View style={styles.iconContainer}><Globe size={22} color={theme.colors.onSurfaceVariant} /></View>}
                                right={() => <List.Icon icon="chevron-right" color={theme.colors.outline} />}
                                onPress={() => { }}
                            />
                            <Divider style={{ backgroundColor: theme.colors.outline, opacity: 0.3 }} />
                            <List.Item
                                title="Security"
                                titleStyle={{ color: theme.colors.onSurface, fontWeight: '700' }}
                                left={() => <View style={styles.iconContainer}><Shield size={22} color={theme.colors.onSurfaceVariant} /></View>}
                                right={() => <List.Icon icon="chevron-right" color={theme.colors.outline} />}
                                onPress={() => { }}
                            />
                        </GlassCard>
                    </TransitionView>

                    <TransitionView index={2}>
                        <GlassCard style={[styles.glassItem, { marginTop: 32, borderColor: `${theme.colors.error}30` }]}>
                            <List.Item
                                title="Sign Out"
                                titleStyle={{ color: theme.colors.error, fontWeight: '800' }}
                                left={() => <View style={styles.iconContainer}><LogOut size={22} color={theme.colors.error} /></View>}
                                onPress={() => {
                                    setToken(null, null);
                                    router.replace('/');
                                }}
                            />
                        </GlassCard>
                    </TransitionView>
                </View>

                <View style={styles.footer}>
                    <Text variant="bodySmall" style={styles.footerText}>THREADTRACK v2.0</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>PREMIUM EDITION</Text>
                </View>
            </ScrollView>
        </View>
    );
}
