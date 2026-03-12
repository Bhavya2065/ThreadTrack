import { StyleSheet, Platform } from 'react-native';
import { MD3Theme } from 'react-native-paper';
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
        fontWeight: '900',
        letterSpacing: 2,
        color: theme.colors.onSurface,
        fontSize: 22,
        textTransform: 'uppercase',
    },
    content: {
        flex: 1,
    },
    mainContent: {
        width: '100%',
        maxWidth: 1200,
        alignSelf: 'center',
        padding: Tokens.spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Tokens.spacing.lg,
    },
    sectionTitle: {
        fontWeight: '900',
        fontSize: 18,
        color: theme.colors.onSurface,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    card: {
        padding: Tokens.spacing.md,
    },
    inventoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Tokens.spacing.sm,
    },
    inventoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    inventoryName: {
        fontWeight: '800',
        fontSize: 16,
        marginLeft: 12,
        color: theme.colors.onSurface,
    },
    stockValues: {
        textAlign: 'right',
        fontWeight: '900',
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
        marginBottom: Tokens.spacing.lg,
        backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    },
    alertContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.dark ? 'rgba(255, 82, 82, 0.08)' : 'rgba(255, 82, 82, 0.05)',
        padding: Tokens.spacing.md,
        borderRadius: Tokens.borderRadius.lg,
        marginBottom: Tokens.spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 82, 82, 0.15)',
    },
    alertText: {
        marginLeft: 12,
        color: Tokens.colors.error,
        fontWeight: '800',
        flex: 1,
        fontSize: 14,
    },
});
