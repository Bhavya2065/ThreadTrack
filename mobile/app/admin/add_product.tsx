import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Alert, Pressable, useWindowDimensions } from 'react-native';
import { Text, Button, TextInput, Appbar, useTheme, Chip, Menu, IconButton, RadioButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { inventoryService } from '../../src/services/api';
import { createStyles } from '../../assets/Styles/InventoryMgmtStyles';
import { useToast } from '../../src/context/ToastContext';
import { CustomDropdown } from '../../src/components/v2/CustomDropdown';
import { Layers } from 'lucide-react-native';

export default function AddProduct() {
    const { showToast } = useToast();
    const router = useRouter();
    const theme = useTheme();
    const styles = createStyles(theme);
    const { width } = useWindowDimensions();
    const params = useLocalSearchParams();

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [materials, setMaterials] = useState<any[]>([]);
    const [isMaterialMenuVisible, setIsMaterialMenuVisible] = useState(false);

    const [productForm, setProductForm] = useState({
        id: params.id ? parseInt(params.id as string) : null as number | null,
        name: (params.name as string) || '',
        materialIds: params.materialIds ? (params.materialIds as string).split(',') : [] as string[],
        quantityPerUnit: (params.quantityPerUnit as string) || '',
        price: (params.price as string) || '',
        imageUrl: (params.imageUrl as string) || '',
        isActive: params.isActive === 'true' || params.isActive === undefined
    });

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const res = await inventoryService.getMaterials();
            setMaterials(res.data);
        } catch (error) {
            showToast({
                title: 'Sync Error',
                message: 'Failed to fetch materials.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProduct = async () => {
        if (!productForm.name || !productForm.materialIds || productForm.materialIds.length === 0 || !productForm.quantityPerUnit) {
            showToast({
                title: 'Incomplete',
                message: 'Name, material, and quantity are required.',
                type: 'warning'
            });
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
                showToast({
                    title: 'Updated',
                    message: 'Product updated successfully.',
                    type: 'success'
                });
            } else {
                await inventoryService.createProduct(data);
                showToast({
                    title: 'Created',
                    message: 'Product created successfully.',
                    type: 'success'
                });
            }
            router.push('/admin/inventory_mgmt');
        } catch (error) {
            showToast({
                title: 'Save Failed',
                message: 'Failed to save product.',
                type: 'error'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Appbar.Header style={styles.appbarHeader}>
                    <Appbar.BackAction onPress={() => router.push('/admin/inventory_mgmt')} color={theme.colors.onSurfaceVariant} />
                    <Appbar.Content title={productForm.id ? "Edit Product" : "New Catalog Item"} titleStyle={styles.appbarTitle} />
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
                <Appbar.BackAction onPress={() => router.push('/admin/inventory_mgmt')} color={theme.colors.onSurfaceVariant} />
                <Appbar.Content title={productForm.id ? "Edit Product" : "New Catalog Item"} titleStyle={styles.appbarTitle} />
            </Appbar.Header>

            <ScrollView style={styles.content}>
                <View style={[styles.mainContent, { paddingBottom: 40 }]}>
                    <TextInput
                        label="Product Name"
                        value={productForm.name}
                        onChangeText={t => setProductForm({ ...productForm, name: t })}
                        mode="outlined"
                        style={[styles.input, { backgroundColor: theme.colors.surface }]}
                        outlineColor={theme.colors.outline}
                        outlineStyle={{ borderRadius: 10 }}
                        activeOutlineColor={theme.colors.primary}
                        textColor={theme.colors.onSurface}
                        disabled={!!productForm.id}
                    />

                    <CustomDropdown
                        label="Raw Materials"
                        value={productForm.materialIds}
                        multiSelect
                        placeholder="Select the Materials"
                        onSelect={(id) => {
                            const isSelected = productForm.materialIds.includes(id);
                            const newIds = isSelected
                                ? productForm.materialIds.filter(mid => mid !== id)
                                : [...productForm.materialIds, id];
                            setProductForm({ ...productForm, materialIds: newIds });
                        }}
                        options={materials.map(m => ({
                            label: m.Name,
                            value: m.MaterialID.toString(),
                            icon: <Layers size={18} color="#64748b" />
                        }))}
                    />

                    <TextInput label="Qty per Unit" value={productForm.quantityPerUnit} onChangeText={t => setProductForm({ ...productForm, quantityPerUnit: t })} keyboardType="numeric" mode="outlined" style={[styles.input, { backgroundColor: theme.colors.surface }]} outlineStyle={{ borderRadius: 10 }} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} />
                    <TextInput label="Unit Price (₹)" value={productForm.price} onChangeText={t => setProductForm({ ...productForm, price: t })} keyboardType="numeric" mode="outlined" style={[styles.input, { backgroundColor: theme.colors.surface }]} outlineStyle={{ borderRadius: 10 }} outlineColor={theme.colors.outline} activeOutlineColor={theme.colors.primary} textColor={theme.colors.onSurface} />

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

                    <View style={{ marginTop: 30 }}>
                        <Button mode="contained" onPress={handleSaveProduct} loading={submitting} contentStyle={{ height: 48 }} labelStyle={{ fontSize: 16, fontWeight: '700' }}>
                            {productForm.id ? 'Save Changes' : 'Create Product'}
                        </Button>
                        <Button mode="outlined" onPress={() => router.push('/admin/inventory_mgmt')} style={{ marginTop: 12, borderColor: theme.colors.error }} contentStyle={{ height: 48 }} textColor={theme.colors.error} labelStyle={{ fontSize: 16, fontWeight: '700' }}>
                            Cancel
                        </Button>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
