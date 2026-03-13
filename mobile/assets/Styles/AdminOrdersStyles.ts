import { StyleSheet, Platform } from 'react-native';
import { MD3Theme, MD3Colors } from 'react-native-paper';
import { Tokens } from '../../src/theme/tokens';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
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
    searchContainer: {
        padding: Tokens.spacing.md,
        backgroundColor: 'transparent',
    },
    searchBar: {
        elevation: 0,
        borderRadius: Tokens.borderRadius.lg,
        backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.dark ? 'rgba(255, 255, 255, 0.1)' : theme.colors.outline,
    },
    content: {
        flex: 1,
    },
    mainContent: {
        width: '100%',
        maxWidth: 800,
        alignSelf: 'center',
        padding: Tokens.spacing.md,
        paddingTop: 0,
    },
    sectionTitle: {
        fontWeight: '700',
        fontSize: 18,
        color: theme.colors.onSurface,
        marginBottom: Tokens.spacing.md,
        letterSpacing: 0.5,
    },
    card: {
        marginBottom: Tokens.spacing.lg,
    },
    cardTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardTitleText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.onSurface,
        flex: 1,
    },
    buyerText: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    orderProgress: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    statusText: {
        fontWeight: '700',
        color: theme.colors.primary,
        fontSize: 11,
        letterSpacing: 0.5,
    },
    unitsText: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 12,
        fontWeight: '600',
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        marginBottom: 6,
        backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 0,
        gap: 6,
    },
    actionButton: {
        borderRadius: Tokens.borderRadius.md,
    },
    modal: {
        padding: Tokens.spacing.xl,
        margin: Tokens.spacing.lg,
        borderRadius: Tokens.borderRadius.xl,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.outline,
    },
    modalTitle: {
        fontWeight: '700',
        color: theme.colors.error,
        marginBottom: Tokens.spacing.sm,
    },
    modalSubtitle: {
        marginBottom: Tokens.spacing.lg,
        color: theme.colors.onSurfaceVariant,
        fontWeight: '600',
    },
    modalInput: {
        marginBottom: Tokens.spacing.xl,
        backgroundColor: 'transparent',
    },
    responsiveModal: {
        maxWidth: 600,
        alignSelf: 'center',
        width: '95%',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    emptyText: {
        textAlign: 'center',
        marginVertical: 40,
        color: theme.colors.onSurfaceVariant,
        fontSize: 16,
        fontWeight: '600',
    }
});
