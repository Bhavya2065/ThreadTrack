import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, TextInput, Button, Appbar, List, Divider, MD3Colors, useTheme, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ClipboardList, CheckCircle, PackageOpen, History } from 'lucide-react-native';
import { productionService, inventoryService, orderService, getUserInfo, setToken } from '../../src/services/api';
import { createStyles } from '../../assets/Styles/WorkerStyles';
import { SkeletonLoader } from '../../src/components/SkeletonLoader';
import { EmptyState } from '../../src/components/EmptyState';
import { GlassCard } from '../../src/components/v2/GlassCard';
import { TransitionView } from '../../src/components/v2/TransitionView';
import { Tokens } from '../../src/theme/tokens';

export default function WorkerInput() {
    const theme = useTheme();
    const styles = createStyles(theme);
    const [quantity, setQuantity] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [offlineCount, setOfflineCount] = useState(0);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const router = useRouter();

    const userInfo = getUserInfo();
    const workerId = userInfo?.id || 0;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        const synced = await productionService.syncOfflineLogs();
        if (synced > 0) {
            console.log(`[Worker] Synced ${synced} logs`);
        }

        const count = await productionService.getOfflineQueueCount();
        setOfflineCount(count);

        try {
            const [productsRes, logsRes, ordersRes] = await Promise.all([
                inventoryService.getProducts(),
                productionService.getLogs(workerId),
                orderService.getOrders()
            ]);
            setProducts(productsRes.data);
            setLogs(logsRes.data);

            const activeOrders = ordersRes.data.filter((o: any) => o.Status !== 'Completed');
            setOrders(activeOrders);

            // Auto-shift: if nothing selected, or if current selection is no longer active, select first available
            if (activeOrders.length > 0) {
                const currentStillActive = activeOrders.some((o: any) => o.OrderID === selectedOrderId);
                if (!selectedOrderId || !currentStillActive) {
                    setSelectedOrderId(activeOrders[0].OrderID);
                }
            } else {
                setSelectedOrderId(null);
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                setError('Session expired or unauthorized. Please log in again.');
            } else {
                setError('Failed to load production data. Please check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!quantity || isNaN(Number(quantity))) {
            Alert.alert('Invalid Input', 'Please enter a valid quantity.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        if (!selectedOrderId) {
            alert('Order Required: Please select which order you are working on.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        const selectedOrder = orders.find(o => o.OrderID === selectedOrderId);
        if (selectedOrder) {
            const remaining = Math.max(0, selectedOrder.Quantity - selectedOrder.ProducedQuantity);
            if (parseInt(quantity) > remaining) {
                alert(remaining === 0 ? 'This order is already complete!' : `Input Error! This order only has ${remaining} units remaining. You cannot log ${quantity} units.`);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }
        }

        setSubmitting(true);
        try {
            const selectedOrder = orders.find(o => o.OrderID === selectedOrderId);
            await productionService.logProduction({
                workerId,
                productId: selectedOrder?.ProductID || 1,
                orderId: selectedOrderId,
                quantityProduced: parseInt(quantity)
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSnackbarMessage('Output logged successfully!');
            setSnackbarVisible(true);
            setQuantity('');
            fetchData();
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            if (error.message === 'OFFLINE_QUEUED') {
                Alert.alert('Offline', 'Log queued locally. Will sync online.');
                setQuantity('');
                const count = await productionService.getOfflineQueueCount();
                setOfflineCount(count);
                return;
            }
            Alert.alert('Error', error.response?.data?.error || 'Failed to log output.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Appbar.Header style={styles.appbarHeader}>
                    <Appbar.Content title="Production Log" titleStyle={styles.appbarTitle} />
                </Appbar.Header>
                <ScrollView style={styles.content}>
                    <View style={styles.mainContent}>
                        <SkeletonLoader height={350} width="100%" style={{ marginBottom: 16 }} />
                        <SkeletonLoader height={200} width="100%" />
                    </View>
                </ScrollView>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.errorContainer]}>
                <ClipboardList size={48} color={theme.colors.error} style={styles.errorIcon} />
                <Text variant="headlineSmall" style={styles.errorTitle}>Connection Error</Text>
                <Text style={styles.errorText}>{error}</Text>
                <Button mode="contained" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); fetchData(); }} style={styles.retryButton}>Retry</Button>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbarHeader}>
                <Appbar.Content title="Log Output" titleStyle={styles.appbarTitle} />
                <Appbar.Action icon="cog" color={theme.colors.onSurfaceVariant} onPress={() => router.push('/settings')} />
                <Appbar.Action icon="logout" color={theme.colors.onSurfaceVariant} onPress={() => {
                    setToken(null, null);
                    router.replace('/');
                }} />
            </Appbar.Header>

            <ScrollView style={styles.content} contentContainerStyle={orders.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : null}>
                <View style={styles.mainContent}>
                    <TransitionView index={0}>
                        <GlassCard>
                            {orders.length > 0 ? (
                                <>
                                    <View style={styles.inputHeader}>
                                        <ClipboardList size={20} color={theme.colors.primary} />
                                        <Text style={styles.sectionTitle}>Log Active Order</Text>
                                    </View>

                                    <Text style={styles.label}>Select Order</Text>
                                    <View style={styles.orderSelection}>
                                        {offlineCount > 0 && (
                                            <View style={{ backgroundColor: 'rgba(255, 171, 0, 0.1)', padding: 12, borderRadius: 8, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255, 171, 0, 0.2)' }}>
                                                <Text style={{ color: theme.colors.tertiary, fontSize: 12, fontWeight: '600' }}>{offlineCount} log(s) pending sync</Text>
                                                <Button mode="text" compact onPress={fetchData} loading={submitting} textColor={theme.colors.tertiary}>Sync</Button>
                                            </View>
                                        )}
                                        {orders.map(order => (
                                            <Button
                                                key={order.OrderID}
                                                mode={selectedOrderId === order.OrderID ? "contained" : "outlined"}
                                                onPress={() => {
                                                    Haptics.selectionAsync();
                                                    setSelectedOrderId(order.OrderID);
                                                }}
                                                style={[styles.orderChip, selectedOrderId === order.OrderID && { borderColor: theme.colors.primary, borderWidth: 1.5 }]}
                                                labelStyle={{ fontSize: 11, fontWeight: '700' }}
                                                textColor={theme.colors.onSurface}
                                                buttonColor={selectedOrderId === order.OrderID ? 'rgba(0, 97, 255, 0.1)' : 'transparent'}
                                            >
                                                #{order.OrderID}
                                            </Button>
                                        ))}
                                    </View>

                                    {selectedOrderId && (
                                        <View style={styles.progressSection}>
                                            {(() => {
                                                const order = orders.find(o => o.OrderID === selectedOrderId);
                                                const target = order?.Quantity || 0;
                                                const produced = order?.ProducedQuantity || 0;
                                                const remaining = Math.max(0, target - produced);
                                                const progress = target > 0 ? produced / target : 0;

                                                return (
                                                    <>
                                                        <View style={styles.progressTextRow}>
                                                            <Text style={{ color: theme.colors.onSurfaceVariant }}>Progress: <Text style={styles.boldLabel}>{produced} / {target}</Text></Text>
                                                            <Text style={styles.remainingText}>{remaining} left</Text>
                                                        </View>
                                                        <View style={styles.progressBarContainer}>
                                                            <View style={[
                                                                styles.progressBarFill,
                                                                {
                                                                    width: `${Math.min(100, progress * 100)}%`,
                                                                    backgroundColor: progress >= 1 ? theme.colors.primary : theme.colors.primary,
                                                                    shadowColor: theme.colors.primary,
                                                                    shadowOffset: { width: 0, height: 0 },
                                                                    shadowOpacity: 0.8,
                                                                    shadowRadius: 10,
                                                                }
                                                            ]} />
                                                        </View>
                                                        {remaining === 0 && (
                                                            <Text style={styles.completedHint}>Ready for review</Text>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </View>
                                    )}

                                    <TextInput
                                        label="Product"
                                        value={orders.find(o => o.OrderID === selectedOrderId)?.ProductName || 'Select an order...'}
                                        mode="outlined"
                                        disabled
                                        style={styles.input}
                                        outlineColor={theme.colors.outline}
                                        activeOutlineColor={theme.colors.primary}
                                        textColor={theme.colors.onSurface}
                                    />

                                    <TextInput
                                        label="Units Completed"
                                        value={quantity}
                                        onChangeText={setQuantity}
                                        mode="outlined"
                                        keyboardType="numeric"
                                        style={styles.input}
                                        placeholder="0"
                                        outlineColor={theme.colors.outline}
                                        activeOutlineColor={theme.colors.primary}
                                        textColor={theme.colors.onSurface}
                                    />

                                    <Button
                                        mode="contained"
                                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleSubmit(); }}
                                        style={styles.submitButton}
                                        icon="check"
                                        loading={submitting}
                                        disabled={submitting || (orders.find(o => o.OrderID === selectedOrderId)?.Quantity - orders.find(o => o.OrderID === selectedOrderId)?.ProducedQuantity <= 0)}
                                        labelStyle={{ fontWeight: '900' }}
                                    >
                                        Log Production
                                    </Button>
                                </>
                            ) : (
                                <EmptyState
                                    icon={CheckCircle}
                                    title="All Orders Completed"
                                    message="Great job! You have finished all active orders. New orders will appear here once assigned."
                                    iconColor={Tokens.colors.success}
                                />
                            )}
                        </GlassCard>
                    </TransitionView>

                    <TransitionView index={1}>
                        <Text style={[styles.sectionTitle, styles.historySection]}>Contribution History</Text>
                        <GlassCard style={{ padding: 0 }}>
                            {logs.map((log, index) => (
                                <View key={log.LogID || index}>
                                    <List.Item
                                        title={`${log.QuantityProduced} ${log.ProductName}`}
                                        titleStyle={{ color: theme.colors.onSurface, fontWeight: '600' }}
                                        description={new Date(log.LogDate).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        descriptionStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}
                                        left={props => <CheckCircle {...props} color={theme.colors.primary} size={20} style={styles.logIcon} />}
                                    />
                                    {index < logs.length - 1 && <Divider style={{ backgroundColor: theme.colors.outline, opacity: 0.3 }} />}
                                </View>
                            ))}
                            {logs.length === 0 && (
                                <EmptyState
                                    icon={History}
                                    title="No Recent Activity"
                                    message="Logs will appear here once submitted."
                                />
                            )}
                        </GlassCard>
                    </TransitionView>
                </View>
            </ScrollView>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                style={{ backgroundColor: theme.colors.primary }}
            >
                {snackbarMessage}
            </Snackbar>
        </View>
    );
}
