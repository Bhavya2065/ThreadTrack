import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Alert, Pressable, useWindowDimensions } from 'react-native';
import { Text, Button, TextInput, Appbar, useTheme, Chip, Menu, IconButton, RadioButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { inventoryService } from '../../src/services/api';
import { createStyles } from '../../assets/Styles/InventoryMgmtStyles';

export default function AddProduct() {
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
            Alert.alert('Error', 'Failed to fetch materials.');
        } finally {
            setLoading(false);
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
                Alert.alert('Success', 'Product updated successfully.');
            } else {
                await inventoryService.createProduct(data);
                Alert.alert('Success', 'Product created successfully.');
            }
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Failed to save product.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Appbar.Header style={styles.appbarHeader}>
                    <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onSurfaceVariant} />
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
                <Appbar.BackAction onPress={() => router.back()} color={theme.colors.onSurfaceVariant} />
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
                                        borderRadius: 10,
                                        paddingHorizontal: 16,
                                        height: 56,
                                        justifyContent: 'center',
                                        backgroundColor: theme.colors.surface,
                                        width: '100%'
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingRight: 40, alignItems: 'center' }}>
                                        {productForm.materialIds.length === 0 ? (
                                            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 16, letterSpacing: 0.15 }}>Select the Materials</Text>
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
                                    <View style={{ position: 'absolute', right: 4, top: 8 }}>
                                        <IconButton icon={isMaterialMenuVisible ? "chevron-up" : "chevron-down"} size={24} style={{ margin: 0 }} />
                                    </View>
                                </Pressable>
                            }
                            contentStyle={{
                                backgroundColor: theme.colors.surface,
                                borderRadius: 12,
                                paddingVertical: 8,
                                width: width * 0.9,
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
                                fontWeight: 'normal',
                                color: theme.colors.primary,
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
                        <Button mode="outlined" onPress={() => router.back()} style={{ marginTop: 12, borderColor: theme.colors.error }} contentStyle={{ height: 48 }} textColor={theme.colors.error} labelStyle={{ fontSize: 16, fontWeight: '700' }}>
                            Cancel
                        </Button>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
