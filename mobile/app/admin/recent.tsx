import React, { useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, useWindowDimensions, Platform, TouchableOpacity } from 'react-native';
import { Text, Appbar, useTheme, Searchbar, Button } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { orderService, setToken } from '../../src/services/api';
import { FileText, Clock } from 'lucide-react-native';
import { reportExporter } from '../../src/utils/reportExporter';
import { createStyles } from '../../assets/Styles/AdminHistoryStyles';
import { GlassCard } from '../../src/components/v2/GlassCard';
import { TransitionView } from '../../src/components/v2/TransitionView';
import { EmptyState } from '../../src/components/EmptyState';
import { Tokens } from '../../src/theme/tokens';

export default function AdminHistory() {
    const router = useRouter();
    const theme = useTheme();
    const styles = createStyles(theme);
    const { width } = useWindowDimensions();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        try {
            const res = await orderService.getOrders();
            setHistory(res.data.filter((o: any) => o.Status === 'Completed' || o.Status === 'Cancelled'));
        } catch (error) {
            console.error('Failed to fetch history', error);
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

    const filteredHistory = history.filter(order =>
        order.ProductName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.OrderID.toString().includes(searchQuery) ||
        order.BuyerName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <View style={styles.container}>
                {!(Platform.OS === 'web' && width >= 768) && (
                    <Appbar.Header style={styles.appbarHeader}>
                        <Appbar.Content title="Activity Logs" titleStyle={styles.appbarTitle} />
                    </Appbar.Header>
                )}
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {!(Platform.OS === 'web' && width >= 768) && (
                <Appbar.Header style={styles.appbarHeader}>
                    <Appbar.Content title="Activity Logs" titleStyle={styles.appbarTitle} />

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
                    placeholder="Filter logs by ID, product, buyer..."
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
                    <View style={styles.headerRow}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Activity Summary</Text>
                        <Button
                            mode="text"
                            icon={() => <FileText size={18} color={theme.colors.primary} />}
                            onPress={() => reportExporter.exportOrdersToPDF(history, "Order History Report")}
                            textColor={theme.colors.primary}
                            labelStyle={{ fontWeight: '700', fontSize: 13 }}
                        >
                            Export PDF
                        </Button>
                    </View>
                    {filteredHistory.map((order, index) => (
                        <TransitionView key={order.OrderID} index={index}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => router.push({ pathname: '/admin/order/[id]', params: { id: order.OrderID.toString(), from: 'recent' } })}
                            >
                                <GlassCard style={styles.card}>
                                    <View style={styles.cardContentRow}>
                                        <View style={styles.cardCol}>
                                            <View style={styles.cardTitleRow}>
                                                <Text style={styles.cardTitleText}>#{order.OrderID} {order.ProductName}</Text>
                                            </View>
                                            <Text style={styles.buyerText}>{order.BuyerName} • {order.Quantity} Units</Text>
                                        </View>
                                        <View style={[
                                            {
                                                backgroundColor: order.Status === 'Completed'
                                                    ? (theme.colors.primary.startsWith('#') ? theme.colors.primary.slice(0, 7) + '15' : 'rgba(0, 97, 255, 0.1)')
                                                    : (theme.colors.error.startsWith('#') ? theme.colors.error.slice(0, 7) + '15' : 'rgba(239, 68, 68, 0.1)')
                                            },
                                            {
                                                borderColor: order.Status === 'Completed' ? theme.colors.primary : theme.colors.error,
                                                borderWidth: 1,
                                                borderRadius: 12,
                                                paddingHorizontal: 10,
                                                paddingVertical: 4
                                            }
                                        ]}>
                                            <Text style={[styles.statusText, { color: order.Status === 'Completed' ? theme.colors.primary : theme.colors.error, marginLeft: 0 }]}>
                                                {order.Status}
                                            </Text>
                                        </View>
                                    </View>

                                    {order.CompletionNotes && (
                                        <View style={styles.notesBox}>
                                            <Text style={styles.notesText}>“{order.CompletionNotes}”</Text>
                                        </View>
                                    )}
                                </GlassCard>
                            </TouchableOpacity>
                        </TransitionView>
                    ))}
                    {filteredHistory.length === 0 && (
                        <EmptyState
                            icon={Clock}
                            title="No Logs"
                            message={searchQuery ? "No matches found." : "Your activity history is empty."}
                        />
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
