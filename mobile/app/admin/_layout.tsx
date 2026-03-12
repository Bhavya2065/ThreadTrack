import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { useTheme, Text, TouchableRipple, IconButton, Tooltip } from 'react-native-paper';
import { TrendingUp, Package, ShoppingBag, History, Settings, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react-native';
import { setToken } from '../../src/services/api';
import { Tokens } from '../../src/theme/tokens';

export default function AdminLayout() {
    const theme = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const { width } = useWindowDimensions();
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const isLargeScreen = Platform.OS === 'web' && width >= 768;

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const sidebarWidth = isCollapsed ? 80 : 280;

    const navItems = [
        { name: 'index', label: 'Dashboard', icon: TrendingUp, path: '/admin' },
        { name: 'inventory', label: 'Inventory', icon: Package, path: '/admin/inventory' },
        { name: 'orders', label: 'Production', icon: ShoppingBag, path: '/admin/orders' },
        { name: 'recent', label: 'History', icon: History, path: '/admin/recent' },
        { name: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
    ];

    const Sidebar = () => (
        <View style={[
            styles.sidebar,
            {
                width: sidebarWidth,
                backgroundColor: theme.colors.surface,
                borderRightColor: theme.colors.outline,
            }
        ]}>
            <View style={[styles.sidebarHeader, isCollapsed && { paddingHorizontal: 0, alignItems: 'center' }]}>
                {!isCollapsed ? (
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={[styles.logoText, { color: theme.colors.primary }]}>ThreadTrack</Text>
                            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700', letterSpacing: 1 }}>ADMIN CONSOLE</Text>
                        </View>
                        <TouchableRipple
                            onPress={() => setIsCollapsed(true)}
                            rippleColor="rgba(0,0,0,0.1)"
                            style={[styles.collapseButton, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}
                        >
                            <PanelLeftClose size={18} color={theme.colors.primary} />
                        </TouchableRipple>
                    </View>
                ) : (
                    <TouchableRipple
                        onPress={() => setIsCollapsed(false)}
                        rippleColor="rgba(0,0,0,0.1)"
                        style={[styles.collapseButton, { backgroundColor: theme.colors.primary, marginTop: 10, borderColor: 'transparent' }]}
                    >
                        <PanelLeftOpen size={20} color="#FFFFFF" />
                    </TouchableRipple>
                )}
            </View>

            <View style={styles.sidebarNav}>
                {navItems.map((item) => {
                    const isActive = pathname === item.path || (item.name === 'index' && pathname === '/admin/');
                    return (
                        <TouchableRipple
                            key={item.name}
                            onPress={() => router.push(item.path as any)}
                            {...({
                                onMouseEnter: () => isCollapsed && setHoveredItem(item.name),
                                onMouseLeave: () => setHoveredItem(null),
                            } as any)}
                            style={[
                                styles.navItem,
                                isActive && {
                                    backgroundColor: theme.dark ? 'rgba(0, 97, 255, 0.1)' : 'rgba(0, 97, 255, 0.05)',
                                    borderColor: theme.colors.primary,
                                    borderWidth: 1
                                }
                            ]}
                        >
                            <View style={[styles.navItemContent, isCollapsed && { justifyContent: 'center', paddingHorizontal: 0 }]}>
                                <item.icon
                                    size={22}
                                    color={isActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
                                />
                                {!isCollapsed && (
                                    <Text style={[
                                        styles.navLabel,
                                        { color: isActive ? theme.colors.primary : theme.colors.onSurfaceVariant },
                                        isActive && { fontWeight: '900' }
                                    ]}>
                                        {item.label}
                                    </Text>
                                )}
                                {isCollapsed && hoveredItem === item.name && (
                                    <View style={[styles.customTooltip, { backgroundColor: theme.colors.elevation.level3, borderColor: theme.colors.outline }]}>
                                        <Text variant="labelSmall" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>{item.label}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableRipple>
                    );
                })}
            </View>

            <View style={styles.sidebarFooter}>
                <TouchableRipple
                    onPress={() => {
                        setToken(null, null);
                        router.replace('/');
                    }}
                    {...({
                        onMouseEnter: () => isCollapsed && setHoveredItem('logout'),
                        onMouseLeave: () => setHoveredItem(null),
                    } as any)}
                    style={styles.navItem}
                >
                    <View style={[styles.navItemContent, isCollapsed && { justifyContent: 'center', paddingHorizontal: 0 }]}>
                        <LogOut size={22} color={theme.colors.error} />
                        {!isCollapsed && <Text style={[styles.navLabel, { color: theme.colors.error, fontWeight: '700' }]}>Logout</Text>}
                        {isCollapsed && hoveredItem === 'logout' && (
                            <View style={[styles.customTooltip, { backgroundColor: theme.colors.elevation.level3, borderColor: theme.colors.outline }]}>
                                <Text variant="labelSmall" style={{ color: theme.colors.error, fontWeight: '700' }}>Logout</Text>
                            </View>
                        )}
                    </View>
                </TouchableRipple>
            </View>
        </View >
    );

    if (Platform.OS === 'web' && !isMounted) {
        return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
    }

    if (isLargeScreen) {
        return (
            <View style={[styles.webContainer, { backgroundColor: theme.colors.background }]}>
                <Sidebar />
                <View style={styles.webContent}>
                    <Tabs screenOptions={{ tabBarButton: () => null, tabBarStyle: { display: 'none' }, headerShown: false }}>
                        <Tabs.Screen name="index" />
                        <Tabs.Screen name="inventory" />
                        <Tabs.Screen name="orders" />
                        <Tabs.Screen name="recent" />
                        <Tabs.Screen name="settings" />
                        <Tabs.Screen name="inventory_mgmt" />
                        <Tabs.Screen name="order/[id]" />
                    </Tabs>
                </View>
            </View>
        );
    }

    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: Tokens.colors.primary,
            tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
            tabBarStyle: {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.outline,
                height: 70,
                paddingBottom: 12,
                paddingTop: 8,
                elevation: 10,
                borderTopWidth: 1,
            },
            tabBarLabelStyle: {
                fontWeight: '900',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: 1,
            },
            headerShown: false,
        }}>
            <Tabs.Screen name="index" options={{ title: 'Insights', tabBarIcon: ({ color }) => <TrendingUp size={24} color={color} /> }} />
            <Tabs.Screen name="inventory" options={{ title: 'Stock', tabBarIcon: ({ color }) => <Package size={24} color={color} /> }} />
            <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} /> }} />
            <Tabs.Screen name="recent" options={{ title: 'History', tabBarIcon: ({ color }) => <History size={24} color={color} /> }} />
            <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Settings size={24} color={color} /> }} />
            <Tabs.Screen name="inventory_mgmt" options={{ href: null }} />
            <Tabs.Screen name="order/[id]" options={{ href: null }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    webContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebar: {
        height: '100%',
        borderRightWidth: 1,
        paddingVertical: 32,
        ...Platform.select({
            web: {
                // backdropFilter removed for minimal solid aesthetic
            }
        })
    },
    sidebarHeader: {
        paddingHorizontal: 24,
        marginBottom: 48,
        minHeight: 60,
        justifyContent: 'center',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    collapseButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    logoText: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -1,
    },
    sidebarNav: {
        flex: 1,
        paddingHorizontal: 16,
    },
    navItem: {
        borderRadius: 14,
        marginBottom: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    navItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        position: 'relative',
    },
    customTooltip: {
        position: 'absolute',
        left: 70,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        zIndex: 1000,
        borderWidth: 1,
        ...Platform.select({
            web: {
                boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.2)'
            }
        }),
        minWidth: 110,
    },
    navLabel: {
        marginLeft: 16,
        fontSize: 14,
    },
    sidebarFooter: {
        paddingHorizontal: 16,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    webContent: {
        flex: 1,
    }
});

