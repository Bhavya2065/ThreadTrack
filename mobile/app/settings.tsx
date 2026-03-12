import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Appbar, List, Switch, useTheme, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Moon, Sun, Bell, Globe, Shield, LogOut } from 'lucide-react-native';
import { useAppTheme } from './_layout';
import { setToken } from '../src/services/api';
import { createStyles } from '../assets/Styles/SettingsStyles';

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
                <List.Section>
                    <List.Subheader>Appearance</List.Subheader>
                    <List.Item
                        title="Dark Mode"
                        description="Toggle dark and light themes"
                        left={props => (
                            <View style={styles.iconContainer}>
                                {isDarkMode ? <Moon size={24} color={theme.colors.primary} /> : <Sun size={24} color={theme.colors.primary} />}
                            </View>
                        )}
                        right={() => (
                            <Switch value={isDarkMode} onValueChange={toggleTheme} color={theme.colors.primary} />
                        )}
                    />
                </List.Section>

                <Divider />

                <List.Section>
                    <List.Subheader>System</List.Subheader>
                    <List.Item
                        title="Notifications"
                        description="Manage app notifications"
                        left={props => <View style={styles.iconContainer}><Bell size={24} color={theme.colors.outline} /></View>}
                        right={() => <List.Icon icon="chevron-right" />}
                        onPress={() => { }}
                    />
                    <List.Item
                        title="Language"
                        description="English (United States)"
                        left={props => <View style={styles.iconContainer}><Globe size={24} color={theme.colors.outline} /></View>}
                        right={() => <List.Icon icon="chevron-right" />}
                        onPress={() => { }}
                    />
                    <List.Item
                        title="Privacy & Security"
                        left={props => <View style={styles.iconContainer}><Shield size={24} color={theme.colors.outline} /></View>}
                        right={() => <List.Icon icon="chevron-right" />}
                        onPress={() => { }}
                    />
                </List.Section>

                <Divider />

                <List.Section>
                    <List.Item
                        title="Logout"
                        titleStyle={{ color: theme.colors.error, fontWeight: '700' }}
                        left={props => <View style={styles.iconContainer}><LogOut size={24} color={theme.colors.error} /></View>}
                        onPress={() => {
                            setToken(null, null);
                            router.replace('/');
                        }}
                    />
                </List.Section>

                <View style={styles.footer}>
                    <Text variant="bodySmall" style={styles.footerText}>ThreadTrack v1.0.0</Text>
                </View>
            </ScrollView>
        </View>
    );
}
