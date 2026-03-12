import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, useWindowDimensions, Platform, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, Appbar, useTheme, SegmentedButtons } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { TrendingUp, BarChart as ChartIcon, Package, Zap, Activity, AlertCircle } from 'lucide-react-native';
import { analyticsService, setToken } from '../../src/services/api';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { createStyles } from '../../assets/Styles/AdminDashboardStyles';
import { SkeletonLoader } from '../../src/components/SkeletonLoader';
import { GlassCard } from '../../src/components/v2/GlassCard';
import { TransitionView } from '../../src/components/v2/TransitionView';
import { Tokens } from '../../src/theme/tokens';

const KPICard = ({ icon: Icon, label, value, color, index }: any) => {
    const theme = useTheme();
    const styles = createStyles(theme);
    return (
        <TransitionView index={index} type="scale" style={styles.kpiCard}>
            <GlassCard style={styles.kpiCardInner}>
                <Icon size={20} color={color} />
                <Text style={[styles.kpiValue, { color }]}>{value}</Text>
                <Text style={styles.kpiLabel}>{label}</Text>
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
    const [predictionWindow, setPredictionWindow] = useState('7');

    const fetchData = async (window: string = predictionWindow) => {
        try {
            const [analyticsRes, predictionsRes] = await Promise.all([
                analyticsService.getProductionSummary().catch(() => ({ data: null })),
                analyticsService.getPredictions(parseInt(window)).catch(() => ({ data: [] }))
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
                <Appbar.Header style={styles.appbarHeader}>
                    <Appbar.Content title="Factory Insights" titleStyle={styles.appbarTitle} />
                </Appbar.Header>
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
            <Appbar.Header style={styles.appbarHeader}>
                <Appbar.Content title="Insights" titleStyle={styles.appbarTitle} />
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

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            >
                <View style={styles.mainContent}>
                    {/* KPI Section */}
                    <View style={styles.kpiRow}>
                        <KPICard index={0} icon={Package} label="Orders" value="156" color={theme.colors.primary} />
                        <KPICard index={1} icon={Zap} label="Efficiency" value="89%" color={theme.colors.secondary} />
                        <KPICard index={2} icon={Activity} label="Growth" value="+12%" color={theme.colors.tertiary} />
                        <KPICard index={3} icon={AlertCircle} label="Alerts" value="3" color={theme.colors.error} />
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
                        <SegmentedButtons
                            value={predictionWindow}
                            onValueChange={(val) => {
                                setPredictionWindow(val);
                                fetchData(val);
                            }}
                            buttons={[
                                { value: '7', label: '7D' },
                                { value: '14', label: '14D' },
                                { value: '30', label: '30D' },
                            ]}
                            style={styles.segmentedButtons}
                        />

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
                                <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>Predicting requirements...</Text>
                            </GlassCard>
                        )}
                    </TransitionView>
                </View>
            </ScrollView>
        </View>
    );
}
