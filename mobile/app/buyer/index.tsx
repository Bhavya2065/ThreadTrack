import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, Appbar, TextInput, Button, Card, ProgressBar, Divider, IconButton, useTheme, Portal, Modal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Truck, Timer, CheckCircle2, AlertTriangle, ShoppingBag, Plus } from 'lucide-react-native';
import { orderService, inventoryService, getUserInfo, setToken } from '../../src/services/api';
import { createStyles } from '../../assets/Styles/BuyerStyles';
import { SkeletonLoader } from '../../src/components/SkeletonLoader';
import { EmptyState } from '../../src/components/EmptyState';
import { GlassCard } from '../../src/components/v2/GlassCard';
import { TransitionView } from '../../src/components/v2/TransitionView';
import { Tokens } from '../../src/theme/tokens';

export default function BuyerTracking() {
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const styles = createStyles(theme);
    const [error, setError] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [orderQuantities, setOrderQuantities] = useState<Record<number, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    const userInfo = getUserInfo();
    const buyerId = userInfo?.id || 0;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchOrders(), fetchProducts(), fetchMaterials()]);
        setLoading(false);
    };

    const fetchMaterials = async () => {
        try {
            const res = await inventoryService.getMaterials();
            setMaterials(res.data);
        } catch (error) {
            console.log('Stock check unavailable');
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await inventoryService.getProducts();
            setProducts(res.data);
        } catch (error) {
        }
    };

    const fetchOrders = async () => {
        setError(null);
        try {
            const res = await orderService.getBuyerOrders(buyerId);
            setOrders(res.data);
        } catch (error: any) {
            if (error.response?.status === 401) {
                setError('Session expired or unauthorized. Please log in again.');
            } else {
                setError('Failed to load your orders. Please check your connection.');
            }
        }
    };

    const handleQuantityChange = (productId: number, val: string) => {
        setOrderQuantities(prev => ({
            ...prev,
            [productId]: val
        }));
    };

    const checkIfInquiryNeeded = () => {
        const itemsToOrder = Object.entries(orderQuantities)
            .filter(([_, qty]) => parseInt(qty) > 0)
            .map(([pId, qty]) => ({
                productId: parseInt(pId),
                quantity: parseInt(qty)
            }));

        for (const item of itemsToOrder) {
            const product = products.find(p => p.ProductID === item.productId);
            if (!product) continue;

            const material = materials.find(m => m.MaterialID === product.BaseMaterialID);
            if (!material) continue;

            const cStock = parseFloat(material.CurrentStock?.toString() || '0');
            const rStock = parseFloat(material.ReservedStock?.toString() || '0');
            const qtyPerUnit = parseFloat(product.MaterialQuantityPerUnit?.toString() || '1');
            
            const netStock = cStock - rStock;
            const maxUnits = Math.floor(netStock / qtyPerUnit);

            if (item.quantity > maxUnits) return true;
        }
        return false;
    };

    const handleCreateOrder = async () => {
        const itemsToOrder = Object.entries(orderQuantities)
            .filter(([_, qty]) => parseInt(qty) > 0)
            .map(([pId, qty]) => ({
                productId: parseInt(pId),
                quantity: parseInt(qty)
            }));

        if (itemsToOrder.length === 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            alert('Please enter a quantity for at least one product.');
            return;
        }

        const needsInquiry = checkIfInquiryNeeded();
        
        setSubmitting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await orderService.createOrder({ 
                items: itemsToOrder,
                status: needsInquiry ? 'Inquiry' : 'Pending'
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsModalVisible(false);
            setOrderQuantities({});
            fetchData();
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            alert(error.response?.data?.error || 'Failed to create order.');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Completed': return { color: theme.colors.primary, bg: theme.dark ? 'rgba(0, 150, 255, 0.1)' : 'rgba(0, 150, 255, 0.1)' };
            case 'Cancelled': return { color: theme.colors.error, bg: theme.dark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.1)' };
            case 'In Progress': return { color: theme.colors.primary, bg: theme.dark ? 'rgba(0, 150, 255, 0.1)' : 'rgba(0, 150, 255, 0.1)' };
            case 'Inquiry': return { color: theme.colors.tertiary, bg: theme.dark ? 'rgba(0, 200, 255, 0.1)' : 'rgba(0, 200, 255, 0.1)' };
            default: return { color: theme.colors.onSurfaceVariant, bg: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' };
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Appbar.Header style={styles.appbarHeader}>
                    <Appbar.Content title="Tracking" titleStyle={styles.appbarTitle} />
                </Appbar.Header>
                <ScrollView style={styles.content}>
                    <View style={styles.mainContent}>
                        <SkeletonLoader height={32} width="40%" style={{ marginBottom: 16 }} />
                        {[1, 2].map(i => (
                            <SkeletonLoader key={i} height={180} width="100%" style={{ marginBottom: 16 }} />
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.errorContainer]}>
                <Truck size={48} color={theme.colors.error} style={styles.errorIcon} />
                <Text variant="headlineSmall" style={styles.errorTitle}>Connection Error</Text>
                <Text style={styles.errorText}>{error}</Text>
                <Button mode="contained" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); fetchOrders(); }} style={styles.retryButton}>Retry</Button>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbarHeader}>
                <Appbar.Content title="Orders" titleStyle={styles.appbarTitle} />
                <Appbar.Action icon="plus" color={theme.colors.primary} onPress={() => { Haptics.selectionAsync(); setIsModalVisible(true); }} />
                <Appbar.Action icon="cog" color={theme.colors.onSurfaceVariant} onPress={() => router.push('/settings')} />
                <Appbar.Action icon="logout" color={theme.colors.onSurfaceVariant} onPress={() => {
                    setToken(null, null);
                    router.replace('/');
                }} />
            </Appbar.Header>

            <ScrollView
                style={styles.content}
                contentContainerStyle={orders.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : null}
                refreshControl={
                    <RefreshControl
                        refreshing={submitting}
                        onRefresh={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); fetchData(); }}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                <View style={styles.mainContent}>
                    <View style={styles.headerRow}>
                        <Text variant="titleLarge" style={styles.sectionTitle}>Active Shipments</Text>
                    </View>

                    {orders.map((order, index) => (
                        <TransitionView key={order.OrderID} index={index}>
                            <GlassCard style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.orderTitle}>{order.ProductName}</Text>
                                    </View>
                                    <View style={[styles.chip, { borderColor: getStatusStyle(order.Status).bg === getStatusStyle(order.Status).bg ? getStatusStyle(order.Status).bg : getStatusStyle(order.Status).color, backgroundColor: getStatusStyle(order.Status).bg, paddingHorizontal: 10, justifyContent: 'center' }]}>
                                        <Text style={{ color: getStatusStyle(order.Status).color, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>{order.Status}</Text>
                                    </View>
                                </View>

                                <Text style={styles.orderDetailText}>Placed on {new Date(order.OrderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</Text>

                                <View style={styles.statusRow}>
                                    <View style={styles.statusItem}>
                                        <CheckCircle2 size={14} color={theme.colors.primary} />
                                        <Text style={styles.statusText}>Ordered</Text>
                                    </View>
                                    <View style={styles.statusItem}>
                                        <CheckCircle2 size={14} color={order.Status !== 'Pending' ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                                        <Text style={[styles.statusText, { color: order.Status !== 'Pending' ? theme.colors.onSurface : theme.colors.onSurfaceVariant }]}>Producing</Text>
                                    </View>
                                    <View style={styles.statusItem}>
                                        <Truck size={14} color={order.Status === 'Completed' ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                                        <Text style={[styles.statusText, { color: order.Status === 'Completed' ? theme.colors.onSurface : theme.colors.onSurfaceVariant }]}>Delivered</Text>
                                    </View>
                                </View>

                                <View style={styles.progressContainer}>
                                    <View style={styles.progressTextRow}>
                                        <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>Production Status</Text>
                                        <Text style={{ fontSize: 12, color: theme.colors.onSurface, fontWeight: '800' }}>
                                            {order.ProducedQuantity} / {order.Quantity}
                                        </Text>
                                    </View>
                                    <ProgressBar
                                        progress={Math.min(order.ProducedQuantity / order.Quantity, 1)}
                                        color={theme.colors.primary}
                                        style={styles.progressBar}
                                    />
                                </View>

                                {order.Status !== 'Completed' && order.Status !== 'Cancelled' && (
                                    <View style={styles.estDelivery}>
                                        <Timer size={14} color={theme.colors.primary} />
                                        <Text style={styles.estText}>
                                            Est. Completion: {(() => {
                                                const baselineMs = 7 * 24 * 60 * 60 * 1000;
                                                const progress = order.ProducedQuantity / (order.Quantity || 1);
                                                const remainingMs = baselineMs * (1 - progress);
                                                return new Date(Date.now() + remainingMs).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                                            })()}
                                        </Text>
                                    </View>
                                )}

                                {(order.CompletionNotes) && (
                                    <View style={[styles.notesContainer, order.Status === 'Cancelled' && { backgroundColor: 'rgba(255, 59, 48, 0.05)', borderColor: 'rgba(255, 59, 48, 0.1)' }]}>
                                        <AlertTriangle size={14} color={order.Status === 'Cancelled' ? theme.colors.error : theme.colors.tertiary} />
                                        <View style={styles.noteTextWrapper}>
                                            <Text style={[styles.notesTitle, order.Status === 'Cancelled' && { color: theme.colors.error }]}>
                                                {order.Status === 'Cancelled' ? 'Cancellation Reason' : 'Manufacturer Note'}
                                            </Text>
                                            <Text style={styles.notesText}>{order.CompletionNotes}</Text>
                                        </View>
                                    </View>
                                )}
                            </GlassCard>
                        </TransitionView>
                    ))}

                    {orders.length === 0 && (
                        <EmptyState
                            icon={ShoppingBag}
                            title="No Orders Yet"
                            message="Create your first bulk order to start tracking."
                            iconColor={Tokens.colors.primary}
                        />
                    )}
                </View>
            </ScrollView>

            <Portal>
                <Modal
                    visible={isModalVisible}
                    onDismiss={() => setIsModalVisible(false)}
                    contentContainerStyle={[styles.modalContent, styles.responsiveModal]}
                >
                    <Text variant="headlineSmall" style={[styles.sectionTitle, { marginBottom: 20 }]}>New Order</Text>
                    <ScrollView style={{ maxHeight: 400 }}>
                        {products.length > 0 ? (
                            products.map(p => {
                                const material = materials.find(m => m.MaterialID === p.BaseMaterialID);
                                const netStock = material ? material.CurrentStock - (material.ReservedStock || 0) : 0;
                                const canProduce = material ? Math.floor(netStock / p.MaterialQuantityPerUnit) : 0;
                                const isAvailable = canProduce > 0;

                                return (
                                    <View key={p.ProductID} style={{ marginBottom: Tokens.spacing.md, padding: Tokens.spacing.md, borderRadius: Tokens.borderRadius.md, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderWidth: 1, borderColor: theme.colors.outline }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.productNameText}>{p.ProductName}</Text>
                                                <Text
                                                    style={[
                                                        styles.availabilityText,
                                                        { color: isAvailable ? theme.colors.primary : theme.colors.error }
                                                    ]}
                                                >
                                                    {isAvailable ? `Available (Max ${canProduce})` : 'Out of Stock'}
                                                </Text>
                                            </View>
                                            <TextInput
                                                value={orderQuantities[p.ProductID] || ''}
                                                onChangeText={(val) => handleQuantityChange(p.ProductID, val)}
                                                keyboardType="numeric"
                                                mode="outlined"
                                                dense
                                                style={{ width: 80, height: 40, backgroundColor: 'transparent' }}
                                                outlineColor={theme.colors.outline}
                                                activeOutlineColor={theme.colors.primary}
                                                textColor={theme.colors.onSurface}
                                            />
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <View style={styles.noProductsWrapper}>
                                <Text style={styles.noProductsText}>No products available for ordering.</Text>
                            </View>
                        )}
                    </ScrollView>

                    {checkIfInquiryNeeded() && (
                        <View style={{ marginTop: 10, padding: 10, backgroundColor: 'rgba(0, 150, 255, 0.1)', borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <AlertTriangle size={18} color={theme.colors.primary} />
                            <Text style={{ flex: 1, fontSize: 12, color: theme.colors.primary, fontWeight: '600' }}>
                                Requested quantity exceeds current stock. This will be sent as a Bulk Inquiry.
                            </Text>
                        </View>
                    )}

                    <View style={styles.modalButtons}>
                        <Button onPress={() => { Haptics.selectionAsync(); setIsModalVisible(false); setOrderQuantities({}); }} disabled={submitting} textColor={theme.colors.onSurfaceVariant}>Cancel</Button>
                        <Button
                            mode="contained"
                            onPress={handleCreateOrder}
                            loading={submitting}
                            disabled={submitting}
                            labelStyle={{ fontWeight: '900' }}
                        >
                            {checkIfInquiryNeeded() ? 'Send Bulk Inquiry' : 'Place Order'}
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
}
