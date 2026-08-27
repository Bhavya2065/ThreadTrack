import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, useWindowDimensions, Platform, TouchableOpacity } from 'react-native';
import { Text, ProgressBar, Appbar, Button, useTheme } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { Package, AlertTriangle, Settings, FileText } from 'lucide-react-native';
import { inventoryService, setToken } from '../../src/services/api';
import { reportExporter } from '../../src/utils/reportExporter';
import { createStyles } from '../../assets/Styles/AdminInventoryStyles';
import { GlassCard } from '../../src/components/v2/GlassCard';
import { TransitionView } from '../../src/components/v2/TransitionView';
import { Tokens } from '../../src/theme/tokens';

export default function AdminInventory() {
    const router = useRouter();
    const theme = useTheme();
    const styles = createStyles(theme);
    const { width } = useWindowDimensions();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [materials, setMaterials] = useState([]);

    const fetchData = async () => {
        try {
            const res = await inventoryService.getMaterials();
            setMaterials(res.data);
        } catch (error) {
            console.error('Failed to fetch inventory', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading) {
        return (
            <View style={styles.container}>
                {!(Platform.OS === 'web' && width >= 768) && (
                    <Appbar.Header style={styles.appbarHeader}>
                        <Appbar.Content title="Inventory" titleStyle={styles.appbarTitle} />
                    </Appbar.Header>
                )}
                <View style={{ flex: 1, padding: 16 }}>
                    <GlassCard style={{ height: 300, opacity: 0.5 }}><Text style={{ color: Tokens.colors.textMuted }}>Loading stocks...</Text></GlassCard>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {!(Platform.OS === 'web' && width >= 768) && (
                <Appbar.Header style={styles.appbarHeader}>
                    <Appbar.Content title="Inventory" titleStyle={styles.appbarTitle} />
                    <Appbar.Action
                        icon="cog"
                        color={theme.colors.onSurfaceVariant}
                        onPress={() => router.push('/admin/inventory_mgmt')}
                    />
                    {(Platform.OS !== 'web' || width < 768) && (
                        <>
                            <Appbar.Action
                                icon="logout"
                                color={theme.colors.onSurfaceVariant}
                                onPress={() => {
                                    setToken(null, null);
                                    router.replace('/');
                                }}
                            />
                        </>
                    )}
                </Appbar.Header>
            )}

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Tokens.colors.primary} />}
            >
                <View style={styles.mainContent}>
                    <TransitionView index={0}>
                        <View style={styles.headerRow}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Stock Levels</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Button
                                    mode="text"
                                    icon={() => <FileText size={16} color={materials.length === 0 ? theme.colors.onSurfaceDisabled : theme.colors.primary} />}
                                    onPress={() => reportExporter.exportInventoryToPDF(materials, "Inventory Report")}
                                    textColor={theme.colors.primary}
                                    labelStyle={{ fontWeight: '700' }}
                                    disabled={materials.length === 0}
                                >
                                    PDF
                                </Button>
                                <Button
                                    mode="text"
                                    icon={() => <FileText size={16} color={materials.length === 0 ? theme.colors.onSurfaceDisabled : theme.colors.primary} />}
                                    onPress={() => reportExporter.exportInventoryToCSV(materials)}
                                    textColor={theme.colors.primary}
                                    labelStyle={{ fontWeight: '700' }}
                                    disabled={materials.length === 0}
                                >
                                    CSV
                                </Button>
                            </View>
                        </View>
                    </TransitionView>

                    {materials.some(m => m.CurrentStock <= m.MinimumRequired) && (
                        <TransitionView index={1} type="fade">
                            <View style={styles.alertContainer}>
                                <AlertTriangle size={20} color={theme.colors.error} />
                                <Text style={styles.alertText}>CRITICAL: Some stocks are below minimum threshold!</Text>
                            </View>
                        </TransitionView>
                    )}

                    <TransitionView index={2}>
                        <GlassCard>
                            {materials.length === 0 ? (
                                <View style={{ padding: 32, alignItems: 'center' }}>
                                    <Package size={54} color={theme.colors.primary} style={{ marginBottom: 16, opacity: 0.7 }} />
                                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700', letterSpacing: 0.5 }}>
                                        No Raw Material Stock
                                    </Text>
                                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, fontWeight: '500', textAlign: 'center' }}>
                                        Add materials in the management section to get started.
                                    </Text>
                                    <Button 
                                        mode="contained" 
                                        onPress={() => router.push('/admin/inventory_mgmt')}
                                        style={{ marginTop: 24, borderRadius: 12 }}
                                        contentStyle={{ paddingVertical: 4 }}
                                        labelStyle={{ fontWeight: '700' }}
                                    >
                                        Manage Inventory
                                    </Button>
                                </View>
                            ) : (
                                materials.map((item, index) => {
                                    const isLow = item.CurrentStock <= item.MinimumRequired;
                                    return (
                                        <TouchableOpacity 
                                            key={item.MaterialID || index} 
                                            activeOpacity={0.7}
                                            onPress={() => router.push('/admin/inventory_mgmt')}
                                        >
                                            <View style={styles.inventoryItem}>
                                                <View style={styles.inventoryInfo}>
                                                    <Package size={20} color={isLow ? theme.colors.error : (index % 2 === 0 ? theme.colors.primary : theme.colors.secondary)} />
                                                    <Text
                                                        numberOfLines={1}
                                                        ellipsizeMode="tail"
                                                        style={[styles.inventoryName, isLow && { color: theme.colors.error }]}
                                                    >
                                                        {item.name}
                                                    </Text>
                                                </View>
                                                <Text
                                                    variant="bodySmall"
                                                    style={[styles.stockValues, isLow && { color: theme.colors.error, fontWeight: 'bold' }]}
                                                >
                                                    {Number(item.CurrentStock).toFixed(2)} {item.Unit}
                                                </Text>
                                            </View>
                                            <ProgressBar
                                                progress={Math.min(item.CurrentStock / (item.MinimumRequired * 5 || 1), 1)}
                                                color={isLow ? theme.colors.error : (index % 2 === 0 ? theme.colors.primary : theme.colors.secondary)}
                                                style={styles.progressBar}
                                            />
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </GlassCard>
                    </TransitionView>
                </View>
            </ScrollView>
        </View>
    );
}
