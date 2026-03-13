import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, Platform, useWindowDimensions } from 'react-native';
import { Text, ProgressBar, Appbar, Divider, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ShoppingBag, Calendar, User, Package, Clock } from 'lucide-react-native';
import { orderService } from '../../../src/services/api';
import { createStyles } from '../../../assets/Styles/OrderDetailsStyles';
import { GlassCard } from '../../../src/components/v2/GlassCard';
import { TransitionView } from '../../../src/components/v2/TransitionView';
import { Tokens } from '../../../src/theme/tokens';

export default function OrderDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const theme = useTheme();
    const styles = createStyles(theme);
    const { width } = useWindowDimensions();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [order, setOrder] = useState<any>(null);

    const fetchData = async () => {
        const orderId = parseInt(id as string);
        if (isNaN(orderId)) {
            setLoading(false);
            return;
        }
        try {
            const res = await orderService.getOrderDetails(orderId);
            setOrder(res.data);
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
                    <Appbar.BackAction onPress={() => router.replace('/admin/recent')} color={theme.colors.onSurfaceVariant} />
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
                    <Appbar.BackAction onPress={() => router.replace('/admin/recent')} color={theme.colors.onSurfaceVariant} />
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
            default: return { bg: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', text: theme.colors.onSurfaceVariant, border: theme.colors.outline };
        }
    };

    const statusColors = getStatusColors(order.Status);

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbarHeader}>
                <Appbar.BackAction onPress={() => router.replace('/admin/recent')} color={theme.colors.onSurfaceVariant} />
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
                                        <Text style={{ fontWeight: '700', color: theme.colors.onSurface }}>Fulfillment</Text>
                                        <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
                                    </View>
                                    <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
                                    <Text style={styles.progressSub}>
                                        {Math.min(order.ProducedQuantity, order.Quantity)} / {order.Quantity} units completed
                                    </Text>
                                </View>
                            </GlassCard>
                        </TransitionView>

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
