import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, useWindowDimensions, Platform, TouchableOpacity } from 'react-native';
import { Text, Title, Paragraph, ProgressBar, MD3Colors, Appbar, Button, Portal, Modal, TextInput, useTheme, Searchbar, Divider } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ShoppingBag, AlertTriangle, ArrowRight, User, Calendar } from 'lucide-react-native';
import { orderService, setToken } from '../../src/services/api';
import { createStyles } from '../../assets/Styles/AdminOrdersStyles';
import { GlassCard } from '../../src/components/v2/GlassCard';
import { TransitionView } from '../../src/components/v2/TransitionView';
import { EmptyState } from '../../src/components/EmptyState';
import { Tokens } from '../../src/theme/tokens';
import { useToast } from '../../src/context/ToastContext';

export default function AdminOrders() {
    const { showToast } = useToast();
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

    const handleUpdateStatus = async (orderId: number, reqStatus: string, skipCheck = false) => {
        if (reqStatus === 'Completed' && !skipCheck) {
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
            if (reqStatus === 'Approved') {
                await orderService.approveOrder(orderId);
            } else if (reqStatus === 'Manufacturing') {
                await orderService.startManufacturing(orderId);
            } else {
                await orderService.updateOrderStatus(orderId, reqStatus);
            }
            fetchData();
        } catch (error: any) {
            showToast({
                title: 'Error',
                message: error.response?.data?.error || 'Failed to update status',
                type: 'error'
            });
        }
    };

    const handleConfirmModal = async () => {
        if (!reasonText.trim()) {
            showToast({
                title: 'Required',
                message: 'Please provide a reason.',
                type: 'warning'
            });
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
                showToast({
                    title: 'Success',
                    message: `Order ${modalMode === 'Cancel' ? 'cancelled' : 'finalized'} successfully`,
                    type: 'success'
                });
            } catch (error) {
                showToast({
                    title: 'Action Failed',
                    message: `Failed to ${modalMode?.toLowerCase()} order`,
                    type: 'error'
                });
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
                {!(Platform.OS === 'web' && width >= 768) && (
                    <Appbar.Header style={styles.appbarHeader}>
                        <Appbar.Content title="Production" titleStyle={styles.appbarTitle} />
                    </Appbar.Header>
                )}
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={Tokens.colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {!(Platform.OS === 'web' && width >= 768) && (
                <Appbar.Header style={styles.appbarHeader}>
                    <Appbar.Content title="Production" titleStyle={styles.appbarTitle} />
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
                contentContainerStyle={filteredOrders.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : null}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Tokens.colors.primary} />}
            >
                <View style={styles.mainContent}>
                    {filteredOrders.map((order, index) => (
                        <TransitionView key={order.OrderID} index={index}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                 onPress={() => router.push({ pathname: '/admin/order/[id]', params: { id: order.OrderID.toString(), from: 'orders' } })}
                            >
                                <GlassCard style={styles.card}>
                                    <View style={styles.cardTitleRow}>
                                        <Text style={styles.cardTitleText}>{order.ProductName}</Text>

                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <User size={14} color={theme.colors.onSurfaceVariant} />
                                            <Text style={[styles.buyerText, { marginBottom: 0, marginLeft: 6 }]}>{order.BuyerName}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Calendar size={14} color={theme.colors.onSurfaceVariant} />
                                            <Text style={[styles.buyerText, { marginBottom: 0, marginLeft: 6 }]}>
                                                {(() => {
                                                    const d = new Date(order.OrderDate);
                                                    const date = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                                                    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                    return `${date} • ${time}`;
                                                })()}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.orderProgress}>
                                        <Text style={[styles.statusText,
                                        order.Status === 'Inquiry' && { color: theme.colors.tertiary },
                                        order.Status === 'Approved' && { color: theme.colors.primary },
                                        order.Status === 'Manufacturing' && { color: theme.colors.secondary }
                                        ]}>{order.Status}</Text>
                                        <Text style={styles.unitsText}>{order.ProducedQuantity} / {order.Quantity} units</Text>
                                    </View>

                                    <View style={styles.progressBarContainer}>
                                        <ProgressBar
                                            progress={Math.min(order.ProducedQuantity / order.Quantity, 1)}
                                            color={order.ProducedQuantity >= order.Quantity ? theme.colors.primary : theme.colors.primary}
                                            style={styles.progressBar}
                                        />
                                    </View>



                                    <View style={styles.cardActions}>
                                        {order.Status === 'Inquiry' && (
                                            <Button mode="contained" compact onPress={() => handleUpdateStatus(order.OrderID, 'Pending')} style={[styles.actionButton, { backgroundColor: theme.colors.tertiary }]} labelStyle={{ fontWeight: 'normal' }}>Accept Inquiry</Button>
                                        )}
                                        {order.Status === 'Pending' && (
                                            <Button mode="contained" compact onPress={() => handleUpdateStatus(order.OrderID, 'Approved')} style={[styles.actionButton, { backgroundColor: theme.colors.primary }]} labelStyle={{ fontWeight: 'normal' }}>Approve</Button>
                                        )}
                                        {order.Status === 'Approved' && (
                                            <Button mode="contained" compact onPress={() => handleUpdateStatus(order.OrderID, 'Manufacturing')} style={[styles.actionButton, { backgroundColor: '#4CAF50' }]} labelStyle={{ fontWeight: 'normal', color: 'white' }}>Start Mfg</Button>
                                        )}
                                        {order.Status === 'Manufacturing' && (
                                            <Button mode="contained" compact onPress={() => handleUpdateStatus(order.OrderID, 'Completed')} style={styles.actionButton} labelStyle={{ fontWeight: 'normal' }}>Finalize</Button>
                                        )}
                                        <Button mode="outlined" compact textColor={theme.colors.error} onPress={() => handleCancelOrder(order.OrderID)} style={[styles.actionButton, { borderColor: theme.colors.error }]}>{order.Status === 'Pending' ? 'Reject' : 'Cancel'}</Button>
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
                            iconColor={Tokens.colors.primary}
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
                            labelStyle={{ fontWeight: 'normal' }}
                        >
                            Confirm {modalMode}
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
}

