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
        fontWeight: '900',
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
    },
    appbarHeader: {
        backgroundColor: 'transparent',
        elevation: 0,
    },
    appbarTitle: {
        fontWeight: '900',
        letterSpacing: 2,
        color: theme.colors.onSurface,
        fontSize: 20,
        textTransform: 'uppercase',
    },
    content: {
        flex: 1,
    },
    mainContent: {
        width: '100%',
        maxWidth: 1000,
        alignSelf: 'center',
        padding: Tokens.spacing.lg,
    },
    sectionTitle: {
        fontWeight: '900',
        fontSize: 18,
        color: theme.colors.onSurface,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Tokens.spacing.lg,
    },
    modalContent: {
        padding: Tokens.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: Tokens.borderRadius.xl,
        borderWidth: 1,
        borderColor: theme.colors.outline,
    },
    modalLabel: {
        fontSize: 11,
        marginBottom: 8,
        marginTop: 14,
        fontWeight: '800',
        color: theme.colors.onSurfaceVariant,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: Tokens.spacing.xl,
    },
    card: {
        marginBottom: Tokens.spacing.lg,
        padding: Tokens.spacing.lg,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Tokens.spacing.md,
        gap: 10,
    },
    orderTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '900',
        color: theme.colors.onSurface,
        letterSpacing: -0.5,
    },
    chip: {
        height: 30,
        borderRadius: 15,
        backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        borderColor: theme.colors.outline,
    },
    orderDetailText: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 14,
        marginBottom: 4,
        fontWeight: '600',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        marginTop: 18,
        marginBottom: Tokens.spacing.lg,
        paddingHorizontal: 0,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 12,
        marginLeft: 6,
        color: theme.colors.onSurface,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressContainer: {
        marginBottom: Tokens.spacing.xl,
    },
    progressTextRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    },
    estDelivery: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Tokens.spacing.md,
        borderRadius: Tokens.borderRadius.lg,
        backgroundColor: theme.dark ? 'rgba(0, 212, 255, 0.08)' : 'rgba(0, 212, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(0, 212, 255, 0.15)',
    },
    estText: {
        marginLeft: 10,
        fontWeight: '800',
        color: theme.colors.primary,
        fontSize: 13,
    },
    responsiveModal: {
        maxWidth: 600,
        alignSelf: 'center',
        width: '95%',
    },
    selectionWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginVertical: 12,
    },
    input: {
        marginBottom: Tokens.spacing.lg,
        backgroundColor: 'transparent',
    },
    notesContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.dark ? 'rgba(255, 171, 0, 0.08)' : 'rgba(255, 171, 0, 0.05)',
        padding: Tokens.spacing.md,
        borderRadius: Tokens.borderRadius.lg,
        marginBottom: Tokens.spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 171, 0, 0.15)',
    },
    notesTitle: {
        fontWeight: '900',
        color: Tokens.colors.warning,
        fontSize: 13,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    notesText: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 12,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    emptyText: {
        textAlign: 'center',
        marginVertical: Tokens.spacing.xl,
        color: theme.colors.onSurfaceVariant,
        fontWeight: '700',
        fontSize: 16,
    },
    productItemWrapper: {
        marginBottom: 10,
        marginRight: 6,
    },
    productNameText: {
        fontSize: 15,
        fontWeight: '800',
        color: theme.colors.onSurface,
    },
    availabilityText: {
        fontSize: 10,
        marginLeft: 0,
        fontWeight: '900',
        marginTop: 2,
        textTransform: 'uppercase',
    },
    noProductsWrapper: {
        padding: 24,
        alignItems: 'center',
        width: '100%',
    },
    noProductsText: {
        color: theme.colors.onSurfaceVariant,
        fontWeight: '600',
    },
    noteTextWrapper: {
        flex: 1,
        marginLeft: 10,
    }
});
