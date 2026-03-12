import { StyleSheet, Platform } from 'react-native';
import { MD3Theme, MD3Colors } from 'react-native-paper';
import { Tokens } from '../../src/theme/tokens';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    syncText: {
        textAlign: 'center',
        marginTop: 10,
        color: theme.colors.onSurfaceVariant,
        fontWeight: '600',
    },
    errorContainer: {
        justifyContent: 'center',
        padding: Tokens.spacing.xl,
    },
    errorIcon: {
        alignSelf: 'center',
        marginBottom: Tokens.spacing.lg,
    },
    errorTitle: {
        textAlign: 'center',
        color: theme.colors.error,
        fontWeight: '700',
        fontSize: 18,
    },
    errorText: {
        textAlign: 'center',
        color: theme.colors.onSurfaceVariant,
        marginVertical: Tokens.spacing.md,
        fontWeight: '600',
    },
    retryButton: {
        marginTop: Tokens.spacing.lg,
        borderRadius: Tokens.borderRadius.lg,
    },
    appbarHeader: {
        backgroundColor: 'transparent',
        elevation: 0,
    },
    appbarTitle: {
        fontWeight: '700',
        letterSpacing: 0.5,
        color: theme.colors.onSurface,
        fontSize: 20,
    },
    content: {
        flex: 1,
    },
    mainContent: {
        width: '100%',
        maxWidth: 800,
        alignSelf: 'center',
        padding: Tokens.spacing.lg,
    },
    card: {
        marginBottom: Tokens.spacing.lg,
    },
    inputHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Tokens.spacing.lg,
    },
    input: {
        marginBottom: Tokens.spacing.md,
        backgroundColor: 'transparent',
    },
    submitButton: {
        marginTop: Tokens.spacing.sm,
        paddingVertical: 8,
        borderRadius: Tokens.borderRadius.lg,
    },
    sectionTitle: {
        marginBottom: Tokens.spacing.lg,
        fontWeight: '700',
        fontSize: 18,
        color: theme.colors.onSurface,
        letterSpacing: 0.5,
    },
    label: {
        fontSize: 12,
        marginBottom: 8,
        marginTop: 14,
        fontWeight: '600',
        color: theme.colors.onSurfaceVariant,
        letterSpacing: 0.5,
    },
    orderSelection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: Tokens.spacing.lg,
        gap: 10,
    },
    orderChip: {
        backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        borderColor: theme.colors.outline,
    },
    progressSection: {
        marginBottom: Tokens.spacing.xl,
        padding: Tokens.spacing.lg,
        backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
        borderRadius: Tokens.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.outline,
    },
    progressTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    boldLabel: {
        fontWeight: '600',
        color: theme.colors.onSurface,
    },
    remainingText: {
        color: theme.colors.primary,
        fontWeight: '700',
        fontSize: 16,
    },
    progressBarContainer: {
        height: 12,
        width: '100%',
        backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 6,
        backgroundColor: theme.colors.primary,
    },
    completedHint: {
        marginTop: 10,
        color: Tokens.colors.success,
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 13,
    },
    logIcon: {
        marginTop: 12,
    },
    noLogsText: {
        textAlign: 'center',
        marginVertical: Tokens.spacing.xl,
        color: theme.colors.onSurfaceVariant,
        fontSize: 15,
        fontWeight: '600',
    }
});
