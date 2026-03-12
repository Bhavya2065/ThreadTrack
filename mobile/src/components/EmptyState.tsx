import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, message }) => {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <Icon size={64} color={theme.colors.outline} style={styles.icon} />
            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
                {title}
            </Text>
            <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
                {message}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        minHeight: 300,
    },
    icon: {
        marginBottom: 16,
        opacity: 0.5,
    },
    title: {
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: '600',
    },
    message: {
        textAlign: 'center',
        opacity: 0.7,
    },
});
