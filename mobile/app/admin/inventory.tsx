import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, useWindowDimensions, Platform, TouchableOpacity } from 'react-native';
import { Text, ProgressBar, MD3Colors, Appbar, Button, useTheme } from 'react-native-paper';
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
    const [materials, setMaterials] = useState<any[]>([]);

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
                                    icon={() => <FileText size={16} color={theme.colors.primary} />}
                                    onPress={() => reportExporter.exportInventoryToPDF(materials, "Inventory Report")}
                                    textColor={theme.colors.primary}
                                    labelStyle={{ fontWeight: '700' }}
                                >
                                    PDF
                                </Button>
                                <Button
                                    mode="text"
                                    icon={() => <FileText size={16} color={theme.colors.primary} />}
                                    onPress={() => reportExporter.exportInventoryToCSV(materials)}
                                    textColor={theme.colors.primary}
                                    labelStyle={{ fontWeight: '700' }}
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
                            {materials.map((item, index) => {
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
                                                    {item.Name}
                                                </Text>
                                            </View>
                                            <Text
                                                variant="bodySmall"
                                                style={[styles.stockValues, isLow && { color: theme.colors.error, fontWeight: 'bold' }]}
                                            >
                                                {item.CurrentStock} {item.Unit}
                                            </Text>
                                        </View>
                                        <ProgressBar
                                            progress={Math.min(item.CurrentStock / (item.MinimumRequired * 5 || 1), 1)}
                                            color={isLow ? theme.colors.error : (index % 2 === 0 ? theme.colors.primary : theme.colors.secondary)}
                                            style={styles.progressBar}
                                        />
                                    </TouchableOpacity>
                                );
                            })}
                        </GlassCard>
                    </TransitionView>
                </View>
            </ScrollView>
        </View>
    );
}
