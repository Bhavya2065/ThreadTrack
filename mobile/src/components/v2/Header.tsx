import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Appbar, Text, useTheme, Avatar, Button } from 'react-native-paper';
import { useRouter, usePathname } from 'expo-router';
import { LayoutDashboard, Package, ShoppingCart, Settings, Menu, Bell } from 'lucide-react-native';
import { Tokens } from '../../theme/tokens';

export const Header = () => {
    const theme = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const isDesktop = width >= 768;

    const navItems = [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
        { label: 'Inventory', icon: Package, path: '/admin/inventory' },
        { label: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
    ] as const;

    const isActive = (path: string) => pathname.startsWith(path);

    if (isWeb && isDesktop) {
        return (
            <View style={[styles.webHeader, {
                backgroundColor: theme.dark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                borderBottomColor: theme.colors.outline,
            }]}>
                <View style={styles.container}>
                    <TouchableOpacity onPress={() => router.push('/admin')} style={styles.logoContainer}>
                        <View style={[styles.logoIcon, { backgroundColor: theme.colors.primary }]}>
                            <View style={styles.weavePattern} />
                        </View>
                        <Text variant="titleLarge" style={[styles.logoText, { color: theme.colors.onSurface }]}>
                            ThreadTrack
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.navLinks}>
                        {navItems.map((item) => (
                            <TouchableOpacity
                                key={item.path}
                                onPress={() => router.push(item.path)}
                                style={[
                                    styles.navItem,
                                    isActive(item.path) && styles.navItemActive
                                ]}
                            >
                                <item.icon
                                    size={18}
                                    color={isActive(item.path) ? theme.colors.primary : theme.colors.onSurfaceVariant}
                                />
                                <Text style={[
                                    styles.navLabel,
                                    { color: isActive(item.path) ? theme.colors.primary : theme.colors.onSurfaceVariant }
                                ]}>
                                    {item.label}
                                </Text>
                                {isActive(item.path) && (
                                    <View style={[styles.activeIndicator, { backgroundColor: theme.colors.primary }]} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.rightSection}>
                        <TouchableOpacity style={styles.iconButton}>
                            <Bell size={20} color={theme.colors.onSurfaceVariant} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/settings')}
                            style={styles.profileButton}
                        >
                            <Avatar.Text
                                size={32}
                                label="AD"
                                style={{ backgroundColor: theme.colors.primaryContainer }}
                                labelStyle={{ color: theme.colors.onPrimaryContainer }}
                            />
                            <View style={styles.profileInfo}>
                                <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>Admin User</Text>
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Factory Manager</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    // Mobile / Tablet Header
    return (
        <Appbar.Header style={[styles.appbar, {
            backgroundColor: theme.dark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            borderBottomColor: theme.colors.outline,
        }]}>
            {pathname !== '/admin' && (
                <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onSurfaceVariant} />
            )}
            <Appbar.Content
                title="ThreadTrack"
                titleStyle={[styles.logoText, { color: theme.colors.onSurface }]}
            />
            <Appbar.Action icon="bell-outline" onPress={() => { }} color={theme.colors.onSurfaceVariant} />
            <Appbar.Action icon="cog-outline" onPress={() => router.push('/settings')} color={theme.colors.onSurfaceVariant} />
        </Appbar.Header>
    );
};

const styles = StyleSheet.create({
    webHeader: {
        height: 72,
        width: '100%',
        borderBottomWidth: 1,
        zIndex: 1000,
        ...Platform.select({
            web: {
                position: 'sticky',
                top: 0,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
            }
        })
    },
    container: {
        maxWidth: 1200,
        width: '100%',
        height: '100%',
        marginHorizontal: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 48,
    },
    logoIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    weavePattern: {
        width: 16,
        height: 16,
        borderWidth: 2,
        borderColor: '#FFF',
        borderRadius: 2,
        transform: [{ rotate: '45deg' }],
    },
    logoText: {
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    navLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 4,
        position: 'relative',
    },
    navItemActive: {
        backgroundColor: 'rgba(0, 97, 255, 0.05)',
        borderRadius: 8,
    },
    navLabel: {
        marginLeft: 8,
        fontWeight: '600',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -20,
        left: 16,
        right: 16,
        height: 3,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: 8,
        marginRight: 12,
    },
    profileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        paddingRight: 12,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    profileInfo: {
        marginLeft: 10,
    },
    appbar: {
        elevation: 0,
        borderBottomWidth: 1,
        ...Platform.select({
            web: {
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
            }
        })
    }
});
