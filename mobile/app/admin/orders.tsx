import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, useWindowDimensions, Platform, TouchableOpacity } from 'react-native';
import { Text, Title, Paragraph, ProgressBar, MD3Colors, Appbar, Button, Portal, Modal, TextInput, useTheme, Searchbar, Divider } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ShoppingBag, AlertTriangle, ArrowRight, User } from 'lucide-react-native';
import { orderService, setToken } from '../../src/services/api';
import { createStyles } from '../../assets/Styles/AdminOrdersStyles';
import { GlassCard } from '../../src/components/v2/GlassCard';
import { TransitionView } from '../../src/components/v2/TransitionView';
import { EmptyState } from '../../src/components/EmptyState';
import { Tokens } from '../../src/theme/tokens';

export default function AdminOrders() {
    const router = useRouter();
    const theme = useTheme();
    const styles = createStyles(theme);
    const { width } = useWindowDimensions();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [isReasonModalVisible, setIsReasonModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState<'Complete' | 'Cancel' | null>(null);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [reasonText, setReasonText] = useState('');
    const [submittingModal, setSubmittingModal] = useState(false);

    const fetchData = async () => {
        try {
            const res = await orderService.getOrders();
            setOrders(res.data.filter((o: any) => o.Status !== 'Completed' && o.Status !== 'Cancelled'));
        } catch (error) {
            console.error('Failed to fetch orders', error);
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

    const handleUpdateStatus = async (orderId: number, status: string, skipCheck = false) => {
        if (status === 'Completed' && !skipCheck) {
            const order = orders.find(o => o.OrderID === orderId);
            const progress = order ? (order.ProducedQuantity / order.Quantity) : 0;
            if (progress < 1) {
                setModalMode('Complete');
                setSelectedOrderId(orderId);
                setReasonText('');
                setIsReasonModalVisible(true);
                return;
            }
        }
        try {
            await orderService.updateOrderStatus(orderId, status);
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to update status');
        }
    };

    const handleConfirmModal = async () => {
        if (!reasonText.trim()) {
            alert('Please provide a reason.');
            return;
        }
        if (selectedOrderId && modalMode) {
            setSubmittingModal(true);
            try {
                if (modalMode === 'Complete') {
                    await orderService.updateOrderStatus(selectedOrderId, 'Completed', reasonText);
                } else if (modalMode === 'Cancel') {
                    await orderService.cancelOrder(selectedOrderId, reasonText);
                }
                setIsReasonModalVisible(false);
                fetchData();
            } catch (error) {
                alert(`Failed to ${modalMode.toLowerCase()} order`);
            } finally {
                setSubmittingModal(false);
            }
        }
    };

    const handleCancelOrder = (orderId: number) => {
        setModalMode('Cancel');
        setSelectedOrderId(orderId);
        setReasonText('');
        setIsReasonModalVisible(true);
    };

    const filteredOrders = orders.filter(order =>
        order.ProductName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.OrderID.toString().includes(searchQuery) ||
        order.BuyerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <Appbar.Header style={styles.appbarHeader}>
                    <Appbar.Content title="Production" titleStyle={styles.appbarTitle} />
                </Appbar.Header>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={Tokens.colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbarHeader}>
                <Appbar.Content title="Production" titleStyle={styles.appbarTitle} />
                {(Platform.OS !== 'web' || width < 768) && (
                    <>
                        <Appbar.Action icon="cog" color={theme.colors.onSurfaceVariant} onPress={() => router.push('/settings')} />
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

            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Search by ID, product, or buyer..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    mode="bar"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    iconColor={theme.colors.primary}
                    inputStyle={{ color: theme.colors.onSurface }}
                />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Tokens.colors.primary} />}
            >
                <View style={styles.mainContent}>
                    <Text variant="titleLarge" style={styles.sectionTitle}>Active Flows</Text>
                    {filteredOrders.map((order, index) => (
                        <TransitionView key={order.OrderID} index={index}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => router.push({ pathname: '/admin/order/[id]', params: { id: order.OrderID.toString() } })}
                            >
                                <GlassCard style={styles.card}>
                                    <View style={styles.cardTitleRow}>
                                        <Text style={styles.cardTitleText}>#{order.OrderID} {order.ProductName}</Text>

                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                        <User size={14} color={theme.colors.onSurfaceVariant} />
                                        <Text style={[styles.buyerText, { marginBottom: 0, marginLeft: 6 }]}>{order.BuyerName}</Text>
                                    </View>

                                    <View style={styles.orderProgress}>
                                        <Text style={styles.statusText}>{order.Status}</Text>
                                        <Text style={styles.unitsText}>{order.ProducedQuantity} / {order.Quantity} units</Text>
                                    </View>

                                    <ProgressBar
                                        progress={Math.min(order.ProducedQuantity / order.Quantity, 1)}
                                        color={order.ProducedQuantity >= order.Quantity ? theme.colors.primary : theme.colors.primary}
                                        style={styles.progressBar}
                                    />



                                    <View style={styles.cardActions}>
                                        {order.Status === 'Pending' && (
                                            <Button mode="contained" compact onPress={() => handleUpdateStatus(order.OrderID, 'In Progress')} style={styles.actionButton} labelStyle={{ fontWeight: '800' }}>Start Mfg</Button>
                                        )}
                                        {order.Status === 'In Progress' && (
                                            <Button mode="contained" compact onPress={() => handleUpdateStatus(order.OrderID, 'Completed')} style={[styles.actionButton, { backgroundColor: theme.colors.primary }]} labelStyle={{ fontWeight: '800' }}>Finalize</Button>
                                        )}
                                        <Button mode="outlined" compact textColor={theme.colors.error} onPress={() => handleCancelOrder(order.OrderID)} style={[styles.actionButton, { borderColor: theme.colors.error }]}>Cancel</Button>
                                    </View>
                                </GlassCard>
                            </TouchableOpacity>
                        </TransitionView>
                    ))}
                    {filteredOrders.length === 0 && (
                        <EmptyState
                            icon={ShoppingBag}
                            title="No Orders"
                            message={searchQuery ? "Try a different search." : "No active production orders."}
                        />
                    )}
                </View>
            </ScrollView>

            <Portal>
                <Modal visible={isReasonModalVisible} onDismiss={() => setIsReasonModalVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="headlineSmall" style={styles.modalTitle}>{modalMode === 'Cancel' ? 'Cancel Order?' : 'Incomplete Order'}</Text>
                    <Text style={styles.modalSubtitle}>
                        {modalMode === 'Cancel' ? 'Provide a reason for cancellation. This action is permanent.' : 'Production is not yet 100% finished. Why are you closing it early?'}
                    </Text>
                    <TextInput
                        label="Closing Reason"
                        value={reasonText}
                        onChangeText={setReasonText}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={styles.modalInput}
                        outlineColor={theme.colors.outline}
                        activeOutlineColor={theme.colors.primary}
                        textColor={theme.colors.onSurface}
                    />
                    <View style={styles.modalButtons}>
                        <Button onPress={() => setIsReasonModalVisible(false)} disabled={submittingModal} textColor={theme.colors.onSurfaceVariant}>Dismiss</Button>
                        <Button
                            mode="contained"
                            onPress={handleConfirmModal}
                            loading={submittingModal}
                            disabled={submittingModal}
                            buttonColor={modalMode === 'Cancel' ? theme.colors.error : theme.colors.primary}
                            labelStyle={{ fontWeight: '900' }}
                        >
                            Confirm {modalMode}
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
}

