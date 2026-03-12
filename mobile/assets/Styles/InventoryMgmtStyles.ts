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
    content: {
        flex: 1,
    },
    mainContent: {
        padding: Tokens.spacing.md,
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Tokens.spacing.md,
    },
    sectionTitle: {
        fontWeight: '700',
        fontSize: 18,
        color: theme.colors.onSurface,
        letterSpacing: 0.5,
    },
    itemCard: {
        marginBottom: Tokens.spacing.sm,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardCol: {
        flex: 1,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    activeChip: {
        backgroundColor: theme.dark ? 'rgba(0, 212, 255, 0.08)' : 'rgba(0, 212, 255, 0.05)',
        borderColor: theme.colors.primary,
        borderWidth: 1,
    },
    inactiveChip: {
        backgroundColor: theme.dark ? 'rgba(255, 82, 82, 0.08)' : 'rgba(255, 82, 82, 0.05)',
        borderColor: theme.colors.error,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.onSurface,
        letterSpacing: 0.5,
    },
    bold: {
        fontWeight: '600',
        color: theme.colors.onSurface,
        fontSize: 16,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 6,
    },
    priceText: {
        color: theme.colors.primary,
        fontWeight: '700',
        fontSize: 14,
    },
    availableText: {
        color: Tokens.colors.success,
        fontWeight: '600',
        fontSize: 12,
    },
    outOfStockText: {
        color: theme.colors.error,
        fontWeight: '600',
        fontSize: 12,
    },
    modal: {
        padding: Tokens.spacing.xl,
        margin: Tokens.spacing.lg,
        borderRadius: Tokens.borderRadius.xl,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.outline,
    },
    responsiveModal: {
        maxWidth: 600,
        alignSelf: 'center',
        width: '95%',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 24,
        gap: 12,
    },
    input: {
        marginBottom: 16,
        backgroundColor: 'transparent',
    },
    modalTitle: {
        fontWeight: '700',
        color: theme.colors.onSurface,
        fontSize: 20,
        marginBottom: Tokens.spacing.sm,
    },
    modalSubTitle: {
        marginTop: 18,
        fontWeight: '600',
        fontSize: 13,
        color: theme.colors.onSurfaceVariant,
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    selectionWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginVertical: 10,
    },
    selectionItem: {
        marginBottom: 6,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 18,
        paddingHorizontal: 6,
    },
    label: {
        fontSize: 16,
        color: theme.colors.onSurface,
        fontWeight: '700',
    }
});
