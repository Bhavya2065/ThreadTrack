import React, { useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, Platform, useWindowDimensions } from 'react-native';
import { Text, Appbar, Button, useTheme } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { UserCheck, Clock, User, Shield } from 'lucide-react-native';
import { userService } from '../../src/services/api';
import { createStyles } from '../../assets/Styles/InventoryMgmtStyles'; // Reusing similar layout styles
import { GlassCard } from '../../src/components/v2/GlassCard';
import { TransitionView } from '../../src/components/v2/TransitionView';
import { useToast } from '../../src/context/ToastContext';
export default function UserApprovalPortal() {
    const { showToast } = useToast();
    const theme = useTheme();
    const styles = createStyles(theme);
    const { width } = useWindowDimensions();
    const isLargeScreen = Platform.OS === 'web' && width >= 768;
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [processingId, setProcessingId] = useState(null);
    const fetchPendingUsers = async () => {
        try {
            const res = await userService.getPendingUsers();
            setPendingUsers(res.data);
        }
        catch (err) {
            showToast({
                title: 'Sync Error',
                message: 'Failed to fetch pending requests.',
                type: 'error'
            });
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    useFocusEffect(useCallback(() => {
        fetchPendingUsers();
    }, []));
    const onRefresh = () => {
        setRefreshing(true);
        fetchPendingUsers();
    };
    const handleApproval = async (userId, username, action) => {
        setProcessingId(userId);
        try {
            await userService.processApproval(userId, action);
            showToast({
                title: action === 'Approve' ? 'User Approved' : 'User Rejected',
                message: `${username} has been ${action === 'Approve' ? 'granted access' : 'rejected'}.`,
                type: 'success'
            });
            fetchPendingUsers();
        }
        catch (err) {
            showToast({
                title: 'Action Failed',
                message: err.response?.data?.error || 'Failed to process request.',
                type: 'error'
            });
        }
        finally {
            setProcessingId(null);
        }
    };
    if (loading && !refreshing) {
        return (<View style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary}/>
                </View>
            </View>);
    }
    return (<View style={styles.container}>
            <Appbar.Header style={styles.appbarHeader}>
                <Appbar.Content title="User Approval Portal" titleStyle={styles.appbarTitle}/>
            </Appbar.Header>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary}/>}>
                <View style={styles.mainContent}>
                    {pendingUsers.length === 0 ? (<TransitionView index={1} style={{ flex: 1, justifyContent: 'center', marginTop: '20%' }}>
                            <View style={{ alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                                <View style={{ backgroundColor: theme.colors.surfaceVariant, padding: 24, borderRadius: 100, marginBottom: 20, opacity: 0.8 }}>
                                    <UserCheck size={64} color={theme.colors.primary}/>
                                </View>
                                <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: '700', marginBottom: 8 }}>
                                    All Caught Up!
                                </Text>
                                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', maxWidth: 250 }}>
                                    There are currently no pending access requests to review.
                                </Text>
                            </View>
                        </TransitionView>) : (<>
                            <TransitionView index={0}>
                                <View style={{ marginBottom: 20 }}>
                                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
                                        Pending Registrations
                                    </Text>
                                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.8 }}>
                                        Review and approve access requests for new system users.
                                    </Text>
                                </View>
                            </TransitionView>
                            {pendingUsers.map((user, index) => (<TransitionView key={user.UserID} index={index + 1}>
                                    <GlassCard style={{ marginBottom: 16, padding: 16, borderRadius: 16 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 10 }}>
                                                    <View style={{ backgroundColor: theme.colors.primaryContainer, padding: 6, borderRadius: 8 }}>
                                                        <User size={18} color={theme.colors.primary}/>
                                                    </View>
                                                    <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>{user.Username}</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', gap: 16, paddingLeft: 34 }}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                        <Shield size={14} color={theme.colors.secondary}/>
                                                        <Text variant="labelMedium" style={{ color: theme.colors.secondary, fontWeight: '600' }}>{user.RequestedRole}</Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                        <Clock size={14} color={theme.colors.onSurfaceVariant}/>
                                                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                                            {new Date(user.CreatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                                <Button mode="contained" onPress={() => handleApproval(user.UserID, user.Username, 'Approve')} loading={processingId === user.UserID} disabled={processingId !== null} buttonColor={theme.colors.primary} style={{ borderRadius: 10, elevation: 0 }} labelStyle={{ fontSize: 12, fontWeight: '700' }} compact>
                                                    Accept
                                                </Button>
                                                <Button mode="outlined" onPress={() => handleApproval(user.UserID, user.Username, 'Reject')} disabled={processingId !== null} textColor={theme.colors.error} style={{ borderColor: theme.colors.error, borderRadius: 10 }} labelStyle={{ fontSize: 12, fontWeight: '700' }} compact>
                                                    Reject
                                                </Button>
                                            </View>
                                        </View>
                                    </GlassCard>
                                </TransitionView>))}
                        </>)}
                </View>
            </ScrollView>
        </View>);
}
