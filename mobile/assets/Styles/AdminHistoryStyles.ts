import { StyleSheet, Platform } from 'react-native';
import { MD3Theme } from 'react-native-paper';
import { Tokens } from '../../src/theme/tokens';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    centered: {
        justifyContent: 'center',
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
        padding: Tokens.spacing.lg,
        paddingTop: 0,
    },
    sectionTitle: {
        fontWeight: '700',
        fontSize: 18,
        color: theme.colors.onSurface,
        marginBottom: Tokens.spacing.lg,
        letterSpacing: 0.5,
    },
    card: {
        marginBottom: Tokens.spacing.md,
    },
    cardContentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardCol: {
        flex: 1,
    },
    cardTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 8,
        marginBottom: 4,
    },
    cardTitleText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.onSurface,
        flex: 1,
    },
    buyerText: {
        fontSize: 13,
        color: theme.colors.onSurfaceVariant,
        fontWeight: '600',
    },
    statusText: {
        fontWeight: '700',
        fontSize: 11,
        letterSpacing: 0.5,
    },
    notesBox: {
        marginTop: 12,
        padding: Tokens.spacing.md,
        borderRadius: Tokens.borderRadius.md,
        backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
        borderWidth: 1,
        borderColor: theme.colors.outline,
    },
    notesText: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 12,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    emptyText: {
        textAlign: 'center',
        marginVertical: 40,
        color: theme.colors.onSurfaceVariant,
        fontSize: 16,
        fontWeight: '600',
    }
});
