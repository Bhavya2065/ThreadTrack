import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Alert, Platform, useWindowDimensions } from 'react-native';
import { Text, Button, Portal, Modal, TextInput, MD3Colors, Appbar, IconButton, Chip, useTheme, RadioButton, Menu } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Plus, Trash2, Edit3, Package, Layers } from 'lucide-react-native';
import { inventoryService } from '../../src/services/api';
import { createStyles } from '../../assets/Styles/InventoryMgmtStyles';
import { GlassCard } from '../../src/components/v2/GlassCard';
import { TransitionView } from '../../src/components/v2/TransitionView';
import { EmptyState } from '../../src/components/EmptyState';

export default function InventoryManagement() {
    const router = useRouter();
    const theme = useTheme();
    const styles = createStyles(theme);
    const { width } = useWindowDimensions();
    const [loading, setLoading] = useState(true);
    const [materials, setMaterials] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const [isMaterialModalVisible, setIsMaterialModalVisible] = useState(false);
    const [isStockModalVisible, setIsStockModalVisible] = useState(false);
    const [isProductModalVisible, setIsProductModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isMaterialMenuVisible, setIsMaterialMenuVisible] = useState(false);

    const [materialForm, setMaterialForm] = useState({ name: '', stock: '', unit: '', min: '' });
    const [stockForm, setStockForm] = useState({ id: null as number | null, name: '', amount: '' });

    const [productForm, setProductForm] = useState({
        id: null as number | null,
        name: '',
        materialId: '',
        quantityPerUnit: '',
        price: '',
        imageUrl: '',
        isActive: true
    });

    useEffect(() => {
        fetchData();
    }, []);

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
            Alert.alert('Error', 'Failed to fetch inventory data.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMaterial = async () => {
        if (!materialForm.name || !materialForm.stock || !materialForm.unit) {
            Alert.alert('Error', 'All fields are required.');
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
        } catch (error) {
            Alert.alert('Error', 'Failed to create material.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddStock = async () => {
        if (!stockForm.id || !stockForm.amount) {
            Alert.alert('Error', 'Quantity is required.');
            return;
        }
        setSubmitting(true);
        try {
            await inventoryService.addMaterialStock(stockForm.id, parseFloat(stockForm.amount));
            setIsStockModalVisible(false);
            setStockForm({ id: null, name: '', amount: '' });
            fetchData();
        } catch (error) {
            Alert.alert('Error', 'Failed to update stock.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteMaterial = (id: number) => {
        const performDelete = async () => {
            try {
                await inventoryService.deleteMaterial(id);
                fetchData();
            } catch (error: any) {
                const msg = error.response?.data?.error || 'Failed to delete material.';
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
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

    const handleSaveProduct = async () => {
        if (!productForm.name || !productForm.materialId || !productForm.quantityPerUnit) {
            Alert.alert('Error', 'Name, material, and quantity are required.');
            return;
        }
        setSubmitting(true);
        const data = {
            productName: productForm.name,
            baseMaterialId: parseInt(productForm.materialId),
            materialQuantityPerUnit: parseFloat(productForm.quantityPerUnit),
            price: productForm.price ? parseFloat(productForm.price) : null,
            imageUrl: productForm.imageUrl || null,
            isActive: productForm.isActive
        };

        try {
            if (productForm.id) {
                await inventoryService.updateProduct(productForm.id, data);
            } else {
                await inventoryService.createProduct(data);
            }
            setIsProductModalVisible(false);
            resetProductForm();
            fetchData();
        } catch (error) {
            Alert.alert('Error', 'Failed to save product.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteProduct = (id: number) => {
        const performDelete = async () => {
            try {
                await inventoryService.deleteProduct(id);
                fetchData();
            } catch (error: any) {
                const msg = error.response?.data?.error || 'Failed to delete product.';
                Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
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

    const resetProductForm = () => {
        setProductForm({ id: null, name: '', materialId: '', quantityPerUnit: '', price: '', imageUrl: '', isActive: true });
    };

    const openEditProduct = (p: any) => {
        setProductForm({
            id: p.ProductID,
            name: p.ProductName,
            materialId: p.BaseMaterialID.toString(),
            quantityPerUnit: p.MaterialQuantityPerUnit.toString(),
            price: p.Price?.toString() || '',
            imageUrl: p.ImageURL || '',
            isActive: p.IsActive
        });
        setIsProductModalVisible(true);
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

                    {materials.length === 0 && (
                        <EmptyState icon={Layers} title="No Materials" message="Add base materials to start production." />
                    )}

                    {materials.map((m, index) => (
                        <TransitionView key={m.MaterialID} index={index}>
                            <GlassCard style={styles.itemCard}>
                                <View style={styles.cardRow}>
                                    <View style={styles.cardCol}>
                                        <Text style={[styles.bold, { fontSize: 16 }]}>{m.Name}</Text>
                                        <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13, marginTop: 4 }}>
                                            Available: <Text style={{ color: theme.colors.primary, fontWeight: '800' }}>{m.CurrentStock} {m.Unit}</Text>
                                        </Text>
                                    </View>
                                    <View style={styles.actionRow}>
                                        <IconButton
                                            icon={() => <Plus size={22} color={theme.colors.primary} />}
                                            onPress={() => {
                                                setStockForm({ id: m.MaterialID, name: m.Name, amount: '' });
                                                setIsStockModalVisible(true);
                                            }}
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
                        </TransitionView>
                    ))}

                    <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                        <Text variant="titleLarge" style={styles.sectionTitle}>Catalog</Text>
                        <Button mode="contained" icon="plus" onPress={() => { resetProductForm(); setIsProductModalVisible(true); }} labelStyle={{ fontWeight: '500' }}>Add</Button>
                    </View>

                    {products.length === 0 && (
                        <EmptyState icon={Package} title="No Products" message="Create your product catalog here." />
                    )}

                    {products.map((p, index) => {
                        const material = materials.find(m => m.MaterialID === p.BaseMaterialID);
                        const canProduce = material ? Math.floor(material.CurrentStock / p.MaterialQuantityPerUnit) : 0;
                        const isAvailable = canProduce > 0;

                        return (
                            <TransitionView key={p.ProductID} index={index}>
                                <GlassCard style={styles.itemCard}>
                                    <View style={styles.cardRow}>
                                        <View style={styles.cardCol}>
                                            <View style={styles.titleRow}>
                                                <Text style={[styles.bold, { fontSize: 16 }]}>{p.ProductName}</Text>
                                                <View style={[p.IsActive ? styles.activeChip : styles.inactiveChip, { paddingHorizontal: 6, borderRadius: 4 }]}>
                                                    <Text style={styles.chipText}>{p.IsActive ? 'Live' : 'Hidden'}</Text>
                                                </View>
                                            </View>

                                            <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
                                                Base: <Text style={styles.bold}>{material?.Name || 'Unknown'}</Text> ({p.MaterialQuantityPerUnit}/unit)
                                            </Text>

                                            <View style={styles.metaRow}>
                                                {p.Price && <Text style={styles.priceText}>₹{p.Price}</Text>}
                                                <Text style={isAvailable ? styles.availableText : styles.outOfStockText}>
                                                    ● {isAvailable ? `${canProduce} potential` : 'Out of Stock'}
                                                </Text>
                                            </View>
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
                <Modal visible={isStockModalVisible} onDismiss={() => setIsStockModalVisible(false)} contentContainerStyle={styles.modal}>
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
                        <Button onPress={() => setIsStockModalVisible(false)} textColor={theme.colors.onSurfaceVariant}>Cancel</Button>
                        <Button mode="contained" onPress={handleAddStock} loading={submitting} labelStyle={{ fontWeight: '500' }}>Confirm Update</Button>
                    </View>
                </Modal>
            </Portal>

            {/* Material Modal */}
            <Portal>
                <Modal visible={isMaterialModalVisible} onDismiss={() => setIsMaterialModalVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="headlineSmall" style={styles.modalTitle}>New Material</Text>
                    <TextInput label="Name" value={materialForm.name} onChangeText={t => setMaterialForm({ ...materialForm, name: t })} mode="outlined" style={styles.input} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} />
                    <TextInput label="Initial Stock" value={materialForm.stock} onChangeText={t => setMaterialForm({ ...materialForm, stock: t })} keyboardType="numeric" mode="outlined" style={styles.input} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} />
                    <TextInput label="Unit (e.g. Metric Tons)" value={materialForm.unit} onChangeText={t => setMaterialForm({ ...materialForm, unit: t })} mode="outlined" style={styles.input} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} />
                    <TextInput label="Alert Threshold" value={materialForm.min} onChangeText={t => setMaterialForm({ ...materialForm, min: t })} keyboardType="numeric" mode="outlined" style={styles.input} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} />
                    <View style={styles.modalButtons}>
                        <Button onPress={() => setIsMaterialModalVisible(false)} textColor={theme.colors.onSurfaceVariant}>Cancel</Button>
                        <Button mode="contained" onPress={handleCreateMaterial} loading={submitting} labelStyle={{ fontWeight: '500' }}>Create</Button>
                    </View>
                </Modal>
            </Portal>

            {/* Product Modal */}
            <Portal>
                <Modal visible={isProductModalVisible} onDismiss={() => setIsProductModalVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="headlineSmall" style={styles.modalTitle}>{productForm.id ? 'Edit Entry' : 'New Catalog Item'}</Text>
                    {!productForm.id && (
                        <TextInput label="Product Name" value={productForm.name} onChangeText={t => setProductForm({ ...productForm, name: t })} mode="outlined" style={styles.input} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} />
                    )}

                    <Text style={styles.modalSubTitle}>Base Material</Text>
                    <Menu
                        visible={isMaterialMenuVisible}
                        onDismiss={() => setIsMaterialMenuVisible(false)}
                        anchor={
                            <View style={{ width: '100%' }}>
                                <TextInput
                                    label="Select Material"
                                    value={materials.find(m => m.MaterialID.toString() === productForm.materialId)?.Name || ''}
                                    mode="outlined"
                                    editable={false}
                                    right={<TextInput.Icon icon={isMaterialMenuVisible ? "chevron-up" : "chevron-down"} onPress={() => setIsMaterialMenuVisible(true)} />}
                                    style={styles.input}
                                    outlineColor={theme.colors.outline}
                                    activeOutlineColor={theme.colors.primary}
                                    textColor={theme.colors.onSurface}
                                    onPressIn={() => setIsMaterialMenuVisible(true)}
                                />
                            </View>
                        }
                        contentStyle={{ 
                            backgroundColor: theme.colors.surface, 
                            borderRadius: 12, 
                            paddingVertical: 8,
                            width: width * 0.8, // Approximation for modal width
                            maxWidth: 500
                        }}
                    >
                        <Text style={{ 
                            paddingHorizontal: 16, 
                            paddingVertical: 12, 
                            fontSize: 14, 
                            fontWeight: '600', 
                            color: theme.colors.onSurfaceVariant 
                        }}>
                            Base Material
                        </Text>
                        <ScrollView style={{ maxHeight: 250 }}>
                            {materials.map(m => {
                                const isSelected = productForm.materialId === m.MaterialID.toString();
                                return (
                                    <Menu.Item
                                        key={m.MaterialID}
                                        onPress={() => {
                                            setProductForm({ ...productForm, materialId: m.MaterialID.toString() });
                                            setIsMaterialMenuVisible(false);
                                        }}
                                        title={m.Name}
                                        leadingIcon={isSelected ? "check-circle" : "circle-outline"}
                                        style={{ 
                                            backgroundColor: isSelected ? (theme.dark ? 'rgba(0, 212, 255, 0.1)' : 'rgba(0, 212, 255, 0.05)') : 'transparent',
                                            marginHorizontal: 8,
                                            borderRadius: 8,
                                            height: 48
                                        }}
                                        titleStyle={{ 
                                            color: isSelected ? theme.colors.primary : theme.colors.onSurface,
                                            fontWeight: isSelected ? '600' : '400',
                                            fontSize: 15
                                        }}
                                    />
                                );
                            })}
                        </ScrollView>
                    </Menu>

                    <TextInput label="Qty per Unit" value={productForm.quantityPerUnit} onChangeText={t => setProductForm({ ...productForm, quantityPerUnit: t })} keyboardType="numeric" mode="outlined" style={styles.input} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} />
                    <TextInput label="Unit Price (₹)" value={productForm.price} onChangeText={t => setProductForm({ ...productForm, price: t })} keyboardType="numeric" mode="outlined" style={styles.input} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} />

                    <View style={{ marginTop: 10 }}>
                        <Text style={styles.label}>Publish Status</Text>
                        <RadioButton.Group onValueChange={value => setProductForm({ ...productForm, isActive: value === 'live' })} value={productForm.isActive ? 'live' : 'hidden'}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}>
                                    <RadioButton value="live" />
                                    <Text style={{ color: theme.colors.onSurface }}>Live</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <RadioButton value="hidden" />
                                    <Text style={{ color: theme.colors.onSurface }}>Hidden</Text>
                                </View>
                            </View>
                        </RadioButton.Group>
                    </View>

                    <View style={styles.modalButtons}>
                        <Button onPress={() => setIsProductModalVisible(false)} textColor={theme.colors.onSurfaceVariant}>Cancel</Button>
                        <Button mode="contained" onPress={handleSaveProduct} loading={submitting} labelStyle={{ fontWeight: '500' }}>Save Changes</Button>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
}
