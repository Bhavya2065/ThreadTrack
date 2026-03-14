import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Alert, Platform, useWindowDimensions, Pressable } from 'react-native';
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
        materialIds: [] as string[],
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
                Alert.alert('Error', error.response?.data?.error || 'Failed to delete material.');
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
        if (!productForm.name || !productForm.materialIds || productForm.materialIds.length === 0 || !productForm.quantityPerUnit) {
            Alert.alert('Error', 'Name, at least one material, and quantity are required.');
            return;
        }
        setSubmitting(true);
        const data = {
            productName: productForm.name,
            materialIds: productForm.materialIds.map(id => parseInt(id)),
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
            } catch (error) {
                Alert.alert('Error', 'Failed to delete product.');
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
        setProductForm({ id: null, name: '', materialIds: [], quantityPerUnit: '', price: '', imageUrl: '', isActive: true });
    };

    const openEditProduct = (p: any) => {
        setProductForm({
            id: p.ProductID,
            name: p.ProductName,
            materialIds: p.MaterialIDs ? p.MaterialIDs.map((id: any) => id.toString()) : [],
            quantityPerUnit: p.MaterialQuantityPerUnit.toString(),
            price: p.Price ? p.Price.toString() : '',
            imageUrl: p.ImageUrl || '',
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
                                                <Text style={styles.chipText}>{m.CurrentStock <= m.MinStockThreshold ? 'LOW' : 'DECENT'}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.metaRow}>
                                            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}>In Stock: {m.CurrentStock} {m.Unit}</Text>
                                            <Text style={{ color: theme.colors.error, fontSize: 13 }}>Reserve: {m.ReservedStock}</Text>
                                        </View>
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
                        <Button mode="contained" icon="plus" onPress={() => { resetProductForm(); setIsProductModalVisible(true); }} labelStyle={{ fontWeight: '500' }}>Add</Button>
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
                                                    <Text style={styles.chipText}>{p.IsActive ? 'LIVE' : 'HIDDEN'}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.metaRow}>
                                                <Text style={styles.priceText}>₹{p.Price}</Text>
                                                <Text style={isAvailable ? styles.availableText : styles.outOfStockText}>
                                                    {canProduce} potential
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

            <Portal>
                <Modal visible={isProductModalVisible} onDismiss={() => setIsProductModalVisible(false)} contentContainerStyle={styles.modal}>
                    <Text variant="headlineSmall" style={styles.modalTitle}>{productForm.id ? 'Edit Entry' : 'New Catalog Item'}</Text>
                    <TextInput
                        label="Product Name"
                        value={productForm.name}
                        onChangeText={t => setProductForm({ ...productForm, name: t })}
                        mode="outlined"
                        style={styles.input}
                        outlineColor={theme.colors.outline}
                        activeOutlineColor={theme.colors.primary}
                        textColor={theme.colors.onSurface}
                        disabled={!!productForm.id}
                    />

                    <View style={{ width: '100%', marginBottom: 16 }}>
                        <Menu
                            visible={isMaterialMenuVisible}
                            onDismiss={() => setIsMaterialMenuVisible(false)}
                            anchor={
                                <Pressable
                                    onPress={() => setIsMaterialMenuVisible(true)}
                                    style={{
                                        borderWidth: 1,
                                        borderColor: theme.colors.outline,
                                        borderRadius: 4,
                                        paddingHorizontal: 12,
                                        paddingVertical: 14,
                                        minHeight: 56,
                                        justifyContent: 'center',
                                        backgroundColor: 'transparent',
                                        width: '100%'
                                    }}
                                >
                                    <Text style={{
                                        position: 'absolute',
                                        top: -9,
                                        left: 8,
                                        backgroundColor: theme.colors.surface,
                                        paddingHorizontal: 4,
                                        fontSize: 12,
                                        color: theme.colors.onSurfaceVariant,
                                        zIndex: 1
                                    }}>
                                        Assigned Materials
                                    </Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingRight: 40 }}>
                                        {productForm.materialIds.length === 0 ? (
                                            <Text style={{ color: theme.colors.onSurfaceVariant }}>Pick materials...</Text>
                                        ) : (
                                            productForm.materialIds.map(id => {
                                                const m = materials.find(mat => mat.MaterialID.toString() === id);
                                                return m ? (
                                                    <Chip
                                                        key={id}
                                                        compact
                                                        style={{ 
                                                            height: 30, 
                                                            backgroundColor: theme.colors.secondaryContainer,
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            paddingHorizontal: 0
                                                        }}
                                                        textStyle={{ 
                                                            fontSize: 11, 
                                                            color: theme.colors.onSecondaryContainer,
                                                            lineHeight: 16,
                                                            marginVertical: 0,
                                                            textAlignVertical: 'center',
                                                            paddingVertical: 0
                                                        }}
                                                    >
                                                        {m.Name}
                                                    </Chip>
                                                ) : null;
                                            })
                                        )}
                                    </View>
                                    <View style={{ position: 'absolute', right: 4, top: 12 }}>
                                        <IconButton icon={isMaterialMenuVisible ? "chevron-up" : "chevron-down"} size={24} style={{ margin: 0 }} />
                                    </View>
                                </Pressable>
                            }
                            contentStyle={{
                                backgroundColor: theme.colors.surface,
                                borderRadius: 12,
                                paddingVertical: 8,
                                width: width * 0.8,
                                maxWidth: 500
                            }}
                        >
                            <Menu.Item
                                onPress={() => {
                                    if (productForm.materialIds.length === materials.length) {
                                        setProductForm({ ...productForm, materialIds: [] });
                                    } else {
                                        setProductForm({ ...productForm, materialIds: materials.map(m => m.MaterialID.toString()) });
                                    }
                                }}
                                title={productForm.materialIds.length === materials.length ? "Deselect All" : "Select All Items"}
                                leadingIcon={productForm.materialIds.length === materials.length ? "checkbox-multiple-marked" : "checkbox-multiple-blank-outline"}
                            />
                            <View style={{ height: 1, backgroundColor: theme.colors.surfaceVariant, marginVertical: 4 }} />
                            <Text style={{
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                fontSize: 12,
                                fontWeight: '700',
                                color: theme.colors.primary,
                                textTransform: 'uppercase',
                                letterSpacing: 1
                            }}>
                                Materials List
                            </Text>
                            <ScrollView style={{ maxHeight: 250 }}>
                                {materials.map(m => {
                                    const isSelected = productForm.materialIds.includes(m.MaterialID.toString());
                                    return (
                                        <Menu.Item
                                            key={m.MaterialID}
                                            onPress={() => {
                                                const newIds = isSelected
                                                    ? productForm.materialIds.filter(id => id !== m.MaterialID.toString())
                                                    : [...productForm.materialIds, m.MaterialID.toString()];
                                                setProductForm({ ...productForm, materialIds: newIds });
                                            }}
                                            title={m.Name}
                                            leadingIcon={isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
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
                            <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.surfaceVariant, marginTop: 4 }}>
                                <Menu.Item
                                    onPress={() => setIsMaterialMenuVisible(false)}
                                    title="Close Selection"
                                    titleStyle={{
                                        color: theme.colors.primary,
                                        fontWeight: '700',
                                        textAlign: 'center',
                                        fontSize: 14
                                    }}
                                    style={{ height: 44 }}
                                />
                            </View>
                        </Menu>
                    </View>

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
