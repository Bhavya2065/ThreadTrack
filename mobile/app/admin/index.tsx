import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, useWindowDimensions, Platform, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, Appbar, useTheme } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { TrendingUp, BarChart as ChartIcon, Package, Zap, Activity, AlertCircle } from 'lucide-react-native';
import { analyticsService, setToken } from '../../src/services/api';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { createStyles } from '../../assets/Styles/AdminDashboardStyles';
import { SkeletonLoader } from '../../src/components/SkeletonLoader';
import { GlassCard } from '../../src/components/v2/GlassCard';
import { TransitionView } from '../../src/components/v2/TransitionView';
import { Tokens } from '../../src/theme/tokens';

const MiniChart = ({ color }: { color: string }) => {
    const theme = useTheme();
    const styles = createStyles(theme);
    const bars = [12, 18, 14, 22, 16];
    return (
        <View style={styles.miniChartContainer}>
            {bars.map((h, i) => (
                <View key={i} style={[styles.miniChartBar, { height: h, backgroundColor: color, opacity: 0.4 + (i * 0.12) }]} />
            ))}
        </View>
    );
};

const KPICard = ({ icon: Icon, label, value, color, index, trend, footer }: any) => {
    const theme = useTheme();
    const styles = createStyles(theme);
    return (
        <TransitionView index={index} type="scale" style={styles.kpiCard}>
            <View style={[styles.kpiTopBar, { backgroundColor: color }]} />
            <GlassCard style={styles.kpiCardInner}>
                <View style={styles.kpiHeader}>
                    <View style={[styles.kpiIconContainer, { backgroundColor: theme.dark ? color + '20' : color + '10' }]}>
                        <Icon size={24} color={color} />
                    </View>
                    {trend && (
                        <View style={[styles.kpiTrendBadge, { backgroundColor: theme.colors.primaryContainer + '40' }]}>
                            <Text style={[styles.kpiTrendText, { color: theme.colors.primary }]}>{trend}</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.kpiValue}>{value}</Text>
                <Text style={styles.kpiLabel}>{label}</Text>

                {Platform.OS === 'web' && (
                    <>
                        <View style={styles.kpiDivider} />
                        <View style={styles.kpiFooter}>
                            <Text style={styles.kpiFooterText} numberOfLines={2}>{footer}</Text>
                            <MiniChart color={color} />
                        </View>
                    </>
                )}
            </GlassCard>
        </TransitionView>
    );
};

export default function AdminAnalytics() {
    const router = useRouter();
    const theme = useTheme();
    const styles = createStyles(theme);
    const { width } = useWindowDimensions();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [analytics, setAnalytics] = useState<any>(null);
    const [predictions, setPredictions] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const [analyticsRes, predictionsRes] = await Promise.all([
                analyticsService.getProductionSummary().catch(() => ({ data: null })),
                analyticsService.getPredictions(7).catch(() => ({ data: [] }))
            ]);
            setAnalytics(analyticsRes.data);
            setPredictions(predictionsRes.data);
        } catch (error) {
            console.error('Failed to fetch analytics', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await fetchData();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRefreshing(false);
    }, []);

    const chartConfig = {
        backgroundColor: 'transparent',
        backgroundGradientFrom: theme.colors.surface,
        backgroundGradientTo: theme.colors.surface,
        decimalPlaces: 0,
        color: (opacity = 1) => theme.colors.primary,
        labelColor: (opacity = 1) => theme.colors.onSurfaceVariant,
        style: { borderRadius: 16 },
        propsForDots: {
            r: "5",
            strokeWidth: "2",
            stroke: theme.colors.primary,
            fill: theme.dark ? theme.colors.background : theme.colors.surface
        }
    };

    const chartWidth = Math.min(width - 64, 500);

    if (loading) {
        return (
            <View style={styles.container}>
                {!(Platform.OS === 'web' && width >= 768) && (
                    <Appbar.Header style={styles.appbarHeader}>
                        <Appbar.Content title="Factory Insights" titleStyle={styles.appbarTitle} />
                    </Appbar.Header>
                )}
                <ScrollView style={styles.content}>
                    <View style={styles.mainContent}>
                        <SkeletonLoader height={100} width="100%" style={{ marginBottom: 16 }} />
                        <SkeletonLoader height={220} width="100%" style={{ marginBottom: 16 }} />
                        <SkeletonLoader height={220} width="100%" />
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {!(Platform.OS === 'web' && width >= 768) && (
                <Appbar.Header style={styles.appbarHeader}>
                    <Appbar.Content title="Insights" titleStyle={styles.appbarTitle} />
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

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            >
                <View style={styles.mainContent}>
                    {/* KPI Section */}
                    <View style={styles.kpiRow}>
                        <KPICard 
                            index={0} 
                            icon={Package} 
                            label="Active orders" 
                            value={analytics?.stats?.activeOrders?.toString() || "0"} 
                            color="#2196F3" 
                            trend={`${analytics?.stats?.activeOrdersTrend > 0 ? '+' : ''}${analytics?.stats?.activeOrdersTrend || 0}%`}
                            footer={`${analytics?.stats?.completedToday || 0} completed today`}
                        />
                        <KPICard 
                            index={1} 
                            icon={Zap} 
                            label="Efficiency rate" 
                            value={`${analytics?.stats?.efficiency || 0}%`} 
                            color="#4CAF50" 
                            trend="+0.0%"
                            footer={`Target: ${analytics?.stats?.targetEfficiency || 90}%`}
                        />
                        <KPICard 
                            index={2} 
                            icon={TrendingUp} 
                            label="Units produced" 
                            value={analytics?.stats?.totalProduced?.toLocaleString() || "0"} 
                            color="#FF9800" 
                            trend={`${analytics?.stats?.productionTrend > 0 ? '+' : ''}${analytics?.stats?.productionTrend || 0}%`}
                            footer={`vs ${analytics?.stats?.lastWeekProduced || 0} last week`}
                        />
                        <KPICard 
                            index={3} 
                            icon={AlertCircle} 
                            label="Critical alerts" 
                            value={analytics?.stats?.alerts?.toString() || "0"} 
                            color="#F44336" 
                            trend={analytics?.stats?.alerts > 0 ? `${analytics?.stats?.alerts} items` : null}
                            footer={`${analytics?.stats?.lowStockCount || 0} low-stock warnings`}
                        />
                    </View>

                    {/* Analytics Section */}
                    <TransitionView index={4}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Production Analytics</Text>
                        {analytics && analytics.weeklyProduction && analytics.weeklyProduction.length > 0 ? (
                            <View style={styles.analyticsWrapper}>
                                <GlassCard style={styles.chartCard}>
                                    <View style={styles.chartHeader}>
                                        <TrendingUp size={20} color={theme.colors.primary} />
                                        <Text variant="titleSmall" style={styles.chartTitle}>Weekly Output</Text>
                                    </View>
                                    <LineChart
                                        data={{
                                            labels: analytics.weeklyProduction.map((d: any) => new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })),
                                            datasets: [{ data: analytics.weeklyProduction.map((d: any) => d.total) }]
                                        }}
                                        width={chartWidth}
                                        height={180}
                                        chartConfig={chartConfig}
                                        bezier
                                        style={styles.chart}
                                    />
                                </GlassCard>
                            </View>
                        ) : (
                            <GlassCard style={styles.analyticsWrapper}>
                                <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>No production recorded in the last 7 days.</Text>
                            </GlassCard>
                        )}
                    </TransitionView>

                    <TransitionView index={5}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>Inventory Forecasting</Text>

                        {predictions && predictions.length > 0 && predictions.some(p => typeof p.days_remaining === 'number') ? (
                            <View style={styles.analyticsWrapper}>
                                <GlassCard style={styles.chartCard}>
                                    <View style={styles.chartHeader}>
                                        <ChartIcon size={20} color={theme.colors.primary} />
                                        <Text variant="titleSmall" style={styles.chartTitle}>Days Remaining</Text>
                                    </View>
                                    <BarChart
                                        data={{
                                            labels: predictions.map(p => p.material.substring(0, 8)),
                                            datasets: [{
                                                data: predictions.map(p => {
                                                    const days = typeof p.days_remaining === 'number' ? p.days_remaining : 0;
                                                    return Math.min(days, 30);
                                                })
                                            }]
                                        }}
                                        width={chartWidth}
                                        height={180}
                                        yAxisLabel=""
                                        yAxisSuffix="d"
                                        chartConfig={{ ...chartConfig, color: (opacity = 1) => theme.colors.primary }}
                                        style={styles.chart}
                                        fromZero
                                    />
                                </GlassCard>
                            </View>
                        ) : (
                            <GlassCard style={styles.analyticsWrapper}>
                                <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
                                    {predictions.length === 0 ? "No raw materials found in inventory" : "Predicting requirements..."}
                                </Text>
                            </GlassCard>
                        )}
                    </TransitionView>
                </View>
            </ScrollView>
        </View>
    );
}
