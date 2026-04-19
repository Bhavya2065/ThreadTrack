import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Alert, Platform, useWindowDimensions, Pressable } from 'react-native';
import { Text, Button, Portal, Modal, TextInput, MD3Colors, Appbar, IconButton, Chip, useTheme, RadioButton, Menu } from 'react-native-paper';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Plus, Trash2, Edit3, Package, Layers } from 'lucide-react-native';
import { inventoryService } from '../../src/services/api';
import { createStyles } from '../../assets/Styles/InventoryMgmtStyles';
import { GlassCard } from '../../src/components/v2/GlassCard';
import { TransitionView } from '../../src/components/v2/TransitionView';
import { EmptyState } from '../../src/components/EmptyState';
import { useToast } from '../../src/context/ToastContext';

export default function InventoryManagement() {
    const { showToast } = useToast();
    const router = useRouter();
    const theme = useTheme();
    const styles = createStyles(theme);
    const { width } = useWindowDimensions();
    const [loading, setLoading] = useState(true);
    const [materials, setMaterials] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const [isMaterialModalVisible, setIsMaterialModalVisible] = useState(false);
    const [isStockModalVisible, setIsStockModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { refillMaterialId, refillAmount } = useLocalSearchParams();
    const [materialForm, setMaterialForm] = useState({ name: '', stock: '', unit: '', min: '' });
    const [stockForm, setStockForm] = useState({ id: null as number | null, name: '', amount: '' });

    useEffect(() => {
        if (refillMaterialId && refillAmount && materials.length > 0) {
            const mId = parseInt(refillMaterialId as string);
            const material = materials.find(m => m.MaterialID === mId);
            if (material) {
                setStockForm({
                    id: mId,
                    name: material.Name,
                    amount: refillAmount as string
                });
                setIsStockModalVisible(true);
                // Clear params after opening so it doesn't re-trigger on material updates
                router.setParams({ refillMaterialId: undefined, refillAmount: undefined });
            }
        }
    }, [refillMaterialId, refillAmount, materials]);

    useEffect(() => {
        fetchData();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [])
    );

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mRes, pRes] = await Promise.all([
                inventoryService.getMaterials(),
                inventoryService.getProducts()
            ]);
            setMaterials(mRes.data);
            setProducts(pRes.data);
        } catch (error) {
            showToast({
                title: 'Data Error',
                message: 'Failed to fetch inventory data.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMaterial = async () => {
        if (!materialForm.name || !materialForm.stock || !materialForm.unit) {
            showToast({
                title: 'Required Fields',
                message: 'All fields are required.',
                type: 'warning'
            });
            return;
        }
        setSubmitting(true);
        try {
            await inventoryService.createMaterial({
                materialName: materialForm.name,
                currentStock: parseFloat(materialForm.stock),
                unit: materialForm.unit,
                minimumRequired: parseFloat(materialForm.min || '0')
            });
            setIsMaterialModalVisible(false);
            setMaterialForm({ name: '', stock: '', unit: '', min: '' });
            fetchData();
            showToast({
                title: 'Material Created',
                message: 'Successfully added new raw material.',
                type: 'success'
            });
        } catch (error) {
            showToast({
                title: 'Failed',
                message: 'Failed to create material.',
                type: 'error'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddStock = async () => {
        if (!stockForm.id || !stockForm.amount) {
            showToast({
                title: 'Missing Info',
                message: 'Quantity is required.',
                type: 'warning'
            });
            return;
        }
        setSubmitting(true);
        try {
            await inventoryService.addMaterialStock(stockForm.id, parseFloat(stockForm.amount));
            setIsStockModalVisible(false);
            setStockForm({ id: null, name: '', amount: '' });
            fetchData();
            showToast({
                title: 'Stock Updated',
                message: 'Successfully updated material availability.',
                type: 'success'
            });
        } catch (error) {
            showToast({
                title: 'Update Failed',
                message: 'Failed to update stock.',
                type: 'error'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteMaterial = (id: number) => {
        const performDelete = async () => {
            try {
                await inventoryService.deleteMaterial(id);
                fetchData();
                showToast({
                    title: 'Deleted',
                    message: 'Material removed from inventory.',
                    type: 'success'
                });
            } catch (error: any) {
                showToast({
                    title: 'Error',
                    message: error.response?.data?.error || 'Failed to delete material.',
                    type: 'error'
                });
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete this material?')) {
                performDelete();
            }
        } else {
            Alert.alert('Confirm Delete', 'Are you sure you want to delete this material?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: performDelete }
            ]);
        }
    };


    const handleDeleteProduct = (id: number) => {
        const performDelete = async () => {
            try {
                await inventoryService.deleteProduct(id);
                fetchData();
                showToast({
                    title: 'Deleted',
                    message: 'Product removed from catalog.',
                    type: 'success'
                });
            } catch (error) {
                showToast({
                    title: 'Error',
                    message: 'Failed to delete product.',
                    type: 'error'
                });
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Delete this product?')) {
                performDelete();
            }
        } else {
            Alert.alert('Confirm Delete', 'Delete this product?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: performDelete }
            ]);
        }
    };

    const openEditProduct = (p: any) => {
        router.push({
            pathname: '/admin/add_product',
            params: {
                id: p.ProductID.toString(),
                name: p.ProductName,
                materialIds: p.MaterialIDs ? p.MaterialIDs.join(',') : '',
                quantityPerUnit: p.MaterialQuantityPerUnit.toString(),
                price: p.Price ? p.Price.toString() : '',
                imageUrl: p.ImageUrl || '',
                isActive: p.IsActive.toString()
            }
        });
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Appbar.Header style={styles.appbarHeader}>
                    <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onSurfaceVariant} />
                    <Appbar.Content title="Inventory" titleStyle={styles.appbarTitle} />
                </Appbar.Header>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Appbar.Header style={styles.appbarHeader}>
                <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onSurfaceVariant} />
                <Appbar.Content title="Inventory" titleStyle={styles.appbarTitle} />
            </Appbar.Header>

            <ScrollView style={styles.content}>
                <View style={styles.mainContent}>
                    <View style={styles.sectionHeader}>
                        <Text variant="titleLarge" style={styles.sectionTitle}>Raw Materials</Text>
                        <Button mode="contained" icon="plus" onPress={() => setIsMaterialModalVisible(true)} labelStyle={{ fontWeight: '500' }}>Add</Button>
                    </View>

                    <View style={{ gap: 10, marginBottom: 30 }}>
                        {materials.length === 0 && !loading && (
                            <EmptyState icon={Layers} title="No Materials" message="Add raw materials to track stock." />
                        )}
                        {materials.map((m) => (
                            <GlassCard key={m.MaterialID} style={styles.itemCard}>
                                <View style={styles.cardRow}>
                                    <View style={styles.cardCol}>
                                        <View style={styles.titleRow}>
                                            <Text style={styles.bold}>{m.Name}</Text>
                                            <View style={m.CurrentStock <= m.MinStockThreshold ? styles.inactiveChip : styles.activeChip}>
                                                <Text style={styles.chipText}>{m.CurrentStock <= m.MinStockThreshold ? 'Low' : 'Decent'}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.metaRow}>
                                            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}>In Stock: {m.CurrentStock.toFixed(2)} {m.Unit}</Text>
                                        </View>
                                        <Text style={{ color: theme.colors.error, fontSize: 13, marginTop: 4 }}>Reserve: {m.ReservedStock.toFixed(2)}</Text>
                                    </View>
                                    <View style={styles.actionRow}>
                                        <IconButton
                                            icon={() => <Plus size={22} color={theme.colors.primary} />}
                                            onPress={() => { setStockForm({ id: m.MaterialID, name: m.Name, amount: '' }); setIsStockModalVisible(true); }}
                                            size={22}
                                            style={{ margin: 0 }}
                                        />
                                        <IconButton
                                            icon={() => <Trash2 size={22} color={theme.colors.error} />}
                                            onPress={() => handleDeleteMaterial(m.MaterialID)}
                                            size={22}
                                            style={{ margin: 0 }}
                                        />
                                    </View>
                                </View>
                            </GlassCard>
                        ))}
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text variant="titleLarge" style={styles.sectionTitle}>Catalog</Text>
                        <Button mode="contained" icon="plus" onPress={() => router.push('/admin/add_product')} labelStyle={{ fontWeight: '500' }}>Add</Button>
                    </View>

                    {products.length === 0 && !loading && (
                        <EmptyState icon={Package} title="No Products" message="Create your product catalog here." />
                    )}

                    {products.map((p) => {
                        const productMaterials = materials.filter(m => p.MaterialIDs?.includes(m.MaterialID));
                        let canProduce = Infinity;
                        if (productMaterials.length > 0) {
                            productMaterials.forEach(m => {
                                const potential = Math.floor(m.CurrentStock / p.MaterialQuantityPerUnit);
                                if (potential < canProduce) canProduce = potential;
                            });
                        } else {
                            canProduce = 0;
                        }
                        const isAvailable = canProduce > 0 && canProduce !== Infinity;
                        if (canProduce === Infinity) canProduce = 0;

                        return (
                            <TransitionView key={p.ProductID}>
                                <GlassCard style={styles.itemCard}>
                                    <View style={styles.cardRow}>
                                        <View style={styles.cardCol}>
                                            <View style={styles.titleRow}>
                                                <Text style={styles.bold}>{p.ProductName}</Text>
                                                <View style={p.IsActive ? styles.activeChip : styles.inactiveChip}>
                                                    <Text style={styles.chipText}>{p.IsActive ? 'Live' : 'Hidden'}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.metaRow}>
                                                <Text style={styles.priceText}>₹{p.Price}</Text>
                                                <Text style={isAvailable ? styles.availableText : styles.outOfStockText}>
                                                    Potential: {canProduce}
                                                </Text>
                                            </View>
                                            <Text style={{ marginTop: 4, fontSize: 12, color: theme.colors.onSurfaceVariant }}>
                                                Base: {productMaterials.map(m => m.Name).join(', ') || 'N/A'} ({p.MaterialQuantityPerUnit}/unit)
                                            </Text>
                                        </View>
                                        <View style={styles.actionRow}>
                                            <IconButton
                                                icon={() => <Edit3 size={22} color={theme.colors.primary} />}
                                                onPress={() => openEditProduct(p)}
                                                size={22}
                                                style={{ margin: 0 }}
                                            />
                                            <IconButton
                                                icon={() => <Trash2 size={22} color={theme.colors.error} />}
                                                onPress={() => handleDeleteProduct(p.ProductID)}
                                                size={22}
                                                style={{ margin: 0 }}
                                            />
                                        </View>
                                    </View>
                                </GlassCard>
                            </TransitionView>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Add Stock Modal */}
            <Portal>
                <Modal visible={isStockModalVisible} onDismiss={() => setIsStockModalVisible(false)} contentContainerStyle={[styles.modal, styles.responsiveModal]}>
                    <Text variant="headlineSmall" style={styles.modalTitle}>Refill Stock</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>Adding to: {stockForm.name}</Text>
                    <TextInput
                        label="Quantity"
                        value={stockForm.amount}
                        onChangeText={t => setStockForm({ ...stockForm, amount: t })}
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.input}
                        outlineColor={theme.colors.outline}
                        activeOutlineColor={theme.colors.primary}
                        textColor={theme.colors.onSurface}
                    />
                    <View style={styles.modalButtons}>
                        <Button mode="outlined" onPress={() => setIsStockModalVisible(false)} textColor={theme.colors.error} style={{ borderColor: theme.colors.error }} labelStyle={{ fontWeight: '500' }}>Cancel</Button>
                        <Button mode="contained" onPress={handleAddStock} loading={submitting} labelStyle={{ fontWeight: '500' }}>Confirm Update</Button>
                    </View>
                </Modal>
            </Portal>

            <Portal>
                <Modal visible={isMaterialModalVisible} onDismiss={() => setIsMaterialModalVisible(false)} contentContainerStyle={[styles.modal, styles.responsiveModal]}>
                    <Text variant="headlineSmall" style={styles.modalTitle}>New Material</Text>
                    <TextInput label="Name" value={materialForm.name} onChangeText={t => setMaterialForm({ ...materialForm, name: t })} mode="outlined" style={styles.input} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} />
                    <TextInput label="Initial Stock" value={materialForm.stock} onChangeText={t => setMaterialForm({ ...materialForm, stock: t })} keyboardType="numeric" mode="outlined" style={styles.input} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} />
                    <TextInput label="Unit (e.g. Metric Tons)" value={materialForm.unit} onChangeText={t => setMaterialForm({ ...materialForm, unit: t })} mode="outlined" style={styles.input} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} />
                    <TextInput label="Alert Threshold" value={materialForm.min} onChangeText={t => setMaterialForm({ ...materialForm, min: t })} keyboardType="numeric" mode="outlined" style={styles.input} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} />
                    <View style={styles.modalButtons}>
                        <Button mode="outlined" onPress={() => setIsMaterialModalVisible(false)} textColor={theme.colors.error} style={{ borderColor: theme.colors.error }} labelStyle={{ fontWeight: '500' }}>Cancel</Button>
                        <Button mode="contained" onPress={handleCreateMaterial} loading={submitting} labelStyle={{ fontWeight: '500' }}>Create</Button>
                    </View>
                </Modal>
            </Portal>

        </View>
    );
}
