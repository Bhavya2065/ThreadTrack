import { StyleSheet } from 'react-native';
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
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    },
    glassItem: {
        marginHorizontal: Tokens.spacing.md,
        marginVertical: 6,
        borderRadius: Tokens.borderRadius.lg,
        overflow: 'hidden',
    },
    footer: {
        padding: 48,
        alignItems: 'center',
        marginTop: 24,
    },
    footerText: {
        color: theme.colors.onSurfaceVariant,
        fontWeight: '800',
        letterSpacing: 2,
        fontSize: 12,
        textTransform: 'uppercase',
    }
});
