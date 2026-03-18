import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, Platform, useWindowDimensions } from 'react-native';
import { Text, ProgressBar, Appbar, Divider, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ShoppingBag, Calendar, User, Package, Clock, AlertCircle, Factory, Scale } from 'lucide-react-native';
import { orderService, inventoryService } from '../../../src/services/api';
import { createStyles } from '../../../assets/Styles/OrderDetailsStyles';
import { GlassCard } from '../../../src/components/v2/GlassCard';
import { TransitionView } from '../../../src/components/v2/TransitionView';
import { Tokens } from '../../../src/theme/tokens';

export default function OrderDetails() {
    const { id, from } = useLocalSearchParams();
    const router = useRouter();
    const theme = useTheme();
    const styles = createStyles(theme);
    const { width } = useWindowDimensions();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [order, setOrder] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);

    const fetchData = async () => {
        const orderId = parseInt(id as string);
        if (isNaN(orderId)) {
            setLoading(false);
            return;
        }
        try {
            const [orderRes, mRes, pRes] = await Promise.all([
                orderService.getOrderDetails(orderId),
                inventoryService.getMaterials(),
                inventoryService.getProducts()
            ]);
            setOrder(orderRes.data);
            setMaterials(mRes.data);
            setProducts(pRes.data);
        } catch (error: any) {
            console.error('Failed to fetch order details', error);
            const serverError = error.response?.data?.error || error.message;
            alert(`Error: ${serverError}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [id])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Appbar.Header style={styles.appbarHeader}>
                    <Appbar.BackAction onPress={() => {
                        if (from === 'orders') router.replace('/admin/orders');
                        else if (from === 'recent') router.replace('/admin/recent');
                        else router.back();
                    }} color={theme.colors.onSurfaceVariant} />
                    <Appbar.Content title="Order Details" titleStyle={styles.appbarTitle} />
                </Appbar.Header>
                <View style={[styles.centered, { flex: 1 }]}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.container}>
                <Appbar.Header style={styles.appbarHeader}>
                    <Appbar.BackAction onPress={() => {
                        if (from === 'orders') router.replace('/admin/orders');
                        else if (from === 'recent') router.replace('/admin/recent');
                        else router.back();
                    }} color={theme.colors.onSurfaceVariant} />
                </Appbar.Header>
                <View style={[styles.centered, { flex: 1 }]}>
                    <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>Order not found</Text>
                </View>
            </View>
        );
    }

    const rawProgress = order.ProducedQuantity / order.Quantity;
    const progress = Math.min(rawProgress, 1);
    const isLargeScreen = Platform.OS === 'web' && width >= 768;

    const getStatusColors = (status: string) => {
        switch (status) {
            case 'Completed': return { bg: theme.dark ? 'rgba(0, 150, 255, 0.15)' : 'rgba(0, 150, 255, 0.15)', text: theme.colors.primary, border: theme.colors.primary };
            case 'Cancelled': return { bg: theme.dark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.15)', text: theme.colors.error, border: theme.colors.error };
            case 'In Progress': return { bg: theme.dark ? 'rgba(0, 150, 255, 0.15)' : 'rgba(0, 150, 255, 0.15)', text: theme.colors.primary, border: theme.colors.primary };
            case 'Inquiry': return { bg: theme.dark ? 'rgba(0, 200, 255, 0.15)' : 'rgba(0, 200, 255, 0.15)', text: theme.colors.tertiary, border: theme.colors.tertiary };
            default: return { bg: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', text: theme.colors.onSurfaceVariant, border: theme.colors.outline };
        }
    };

    const statusColors = getStatusColors(order.Status);

    const getPlannerData = () => {
        if (!order || !products.length || !materials.length) return null;
        const product = products.find(p => p.ProductName === order.ProductName);
        if (!product) return null;
        const material = materials.find(m => product.MaterialIDs?.includes(m.MaterialID));
        if (!material) return null;

        const qtyPerUnit = product.MaterialQuantityPerUnit || 0;
        const currentStock = material.CurrentStock || 0;
        const totalOrdered = order.Quantity;
        const capacityUnits = qtyPerUnit > 0 ? Math.floor(currentStock / qtyPerUnit) : 0;
        const immediate = Math.min(totalOrdered, capacityUnits);
        const pending = Math.max(0, totalOrdered - immediate);
        const shortage = Math.max(0, (totalOrdered * qtyPerUnit) - currentStock);

        return {
            materialName: material.Name,
            unit: material.Unit,
            qtyPerUnit,
            capacityUnits,
            immediate,
            pending,
            shortage,
            totalNeeded: totalOrdered * qtyPerUnit,
            hasShortage: shortage > 0
        };
    };

    const planner = getPlannerData();

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbarHeader}>
                <Appbar.BackAction onPress={() => {
                    if (from === 'orders') router.replace('/admin/orders');
                    else if (from === 'recent') router.replace('/admin/recent');
                    else router.back();
                }} color={theme.colors.onSurfaceVariant} />
                <Appbar.Content title={`Order #${order.OrderID}`} titleStyle={styles.appbarTitle} />
            </Appbar.Header>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Tokens.colors.primary} />}
            >
                <View style={[styles.mainContent, isLargeScreen && styles.webLayout]}>
                    <View style={isLargeScreen ? styles.flex1_5 : {}}>
                        <TransitionView index={0}>
                            <GlassCard style={styles.card}>
                                <View style={styles.headerRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.productName}>{order.ProductName}</Text>
                                        <Text style={styles.quantitySub}>{order.Quantity} Units</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
                                        <Text style={[styles.statusText, { color: statusColors.text }]}>
                                            {order.Status}
                                        </Text>
                                    </View>
                                </View>

                                <Divider style={styles.divider} />

                                <View style={styles.infoGrid}>
                                    <View style={styles.infoItem}>
                                        <User size={18} color={theme.colors.primary} />
                                        <View style={styles.infoTextContainer}>
                                            <Text style={styles.labelSmall}>Buyer</Text>
                                            <Text style={styles.bodyMedium}>{order.BuyerName}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Calendar size={18} color={theme.colors.secondary} />
                                        <View style={styles.infoTextContainer}>
                                            <Text style={styles.labelSmall}>Placed On</Text>
                                            <Text style={styles.bodyMedium}>{new Date(order.OrderDate).toLocaleDateString()}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Package size={18} color={theme.colors.tertiary} />
                                        <View style={styles.infoTextContainer}>
                                            <Text style={styles.labelSmall}>Product Name</Text>
                                            <Text style={styles.bodyMedium}>{order.ProductName || 'N/A'}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.progressContainer}>
                                    <View style={styles.progressHeader}>
                                        <Text style={{ fontWeight: 'normal', color: theme.colors.onSurface }}>Fulfillment</Text>
                                        <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
                                    </View>
                                    <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
                                    <Text style={styles.progressSub}>
                                        {Math.min(order.ProducedQuantity, order.Quantity)} / {order.Quantity} units completed
                                    </Text>
                                </View>
                            </GlassCard>
                        </TransitionView>

                        {planner && (order.Status === 'Inquiry' || order.Status === 'Pending' || order.Status === 'In Progress') && (
                            <TransitionView index={1}>
                                <GlassCard style={styles.plannerCard}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 }}>
                                        <Factory size={20} color={theme.colors.primary} />
                                        <Text style={styles.plannerTitle}>Fulfillment Planner</Text>
                                    </View>

                                    <View style={styles.plannerStats}>
                                        <View style={styles.statBox}>
                                            <Text style={styles.statLabel}>Immediate Production</Text>
                                            <Text style={[styles.statValue, { color: theme.colors.primary }]}>{planner.immediate} Units</Text>
                                        </View>
                                        <View style={styles.statBox}>
                                            <Text style={styles.statLabel}>Pending Stock</Text>
                                            <Text style={[styles.statValue, planner.pending > 0 ? { color: theme.colors.error } : { color: theme.colors.onSurfaceVariant }]}>
                                                {planner.pending} Units
                                            </Text>
                                        </View>
                                    </View>

                                    <Divider style={{ marginBottom: 16, opacity: 0.2 }} />

                                    <View style={{ gap: 8 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={styles.labelSmall}>Material Required ({planner.materialName})</Text>
                                            <Text style={styles.bodyMedium}>{planner.totalNeeded.toFixed(1)} {planner.unit}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={styles.labelSmall}>Current Stock</Text>
                                            <Text style={[styles.bodyMedium, planner.hasShortage && { color: theme.colors.error }]}>
                                                {materials.find(m => m.Name === planner.materialName)?.CurrentStock?.toFixed(1) || 0} {planner.unit}
                                            </Text>
                                        </View>
                                    </View>

                                    {planner.hasShortage && (
                                        <View style={[styles.shortageAlert, { marginTop: 20 }]}>
                                            <AlertCircle size={20} color={theme.colors.error} />
                                            <Text style={styles.shortageText}>
                                                Purchase {planner.shortage.toFixed(1)} {planner.unit} more {planner.materialName} to fulfill complete order.
                                            </Text>
                                        </View>
                                    )}
                                </GlassCard>
                            </TransitionView>
                        )}

                        {order.CompletionNotes && (
                            <TransitionView index={1}>
                                <GlassCard style={styles.notesCard}>
                                    <Text style={styles.notesTitle}>Remarks</Text>
                                    <Text style={styles.notesText}>“{order.CompletionNotes}”</Text>
                                </GlassCard>
                            </TransitionView>
                        )}
                    </View>

                    <View style={isLargeScreen ? [styles.flex1, styles.largeMarginLeft] : styles.topMargin}>
                        <TransitionView index={2}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>Production History</Text>
                            <GlassCard style={styles.timelineCard}>
                                {order.timeline && order.timeline.length > 0 ? (
                                    order.timeline.map((log: any, index: number) => (
                                        <View key={log.LogID} style={styles.timelineItem}>
                                            <View style={styles.timelineIndicator}>
                                                <View style={styles.dot} />
                                                {index < order.timeline.length - 1 && <View style={styles.line} />}
                                            </View>
                                            <View style={styles.timelineContent}>
                                                <View style={styles.timelineHeader}>
                                                    <Text style={styles.timelineQuantity}>+{log.QuantityProduced} Units</Text>
                                                    <Text style={styles.timelineTime}>
                                                        {new Date(log.LogDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Text>
                                                </View>
                                                <Text style={styles.timelineMeta}>
                                                    by {log.WorkerName} • {new Date(log.LogDate).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <View style={styles.emptyTimeline}>
                                        <Clock size={32} color={theme.colors.onSurfaceVariant} />
                                        <Text style={styles.emptyTimelineText}>No units logged yet</Text>
                                    </View>
                                )}
                            </GlassCard>
                        </TransitionView>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
