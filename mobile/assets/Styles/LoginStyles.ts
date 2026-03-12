import { StyleSheet, Platform } from 'react-native';
import { MD3Theme } from 'react-native-paper';
import { Tokens } from '../../src/theme/tokens';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    animatedBackground: {
        ...StyleSheet.absoluteFillObject,
        opacity: theme.dark ? 0.4 : 0.6,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: Tokens.spacing.xl,
        maxWidth: 500,
        alignSelf: 'center',
        width: '100%',
    },
    header: {
        alignItems: 'center',
        marginBottom: Tokens.spacing.xl,
    },
    logoWrapper: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: theme.colors.primary + '10', // Light primary tint
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Tokens.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.primary + '20',
    },
    title: {
        color: theme.colors.onSurface,
        fontWeight: '900',
        letterSpacing: -0.5,
        fontSize: 32,
        textAlign: 'center',
    },
    subtitle: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 16,
        letterSpacing: -0.2,
        fontWeight: '600',
        marginTop: 6,
        textAlign: 'center',
        opacity: 0.8,
    },
    card: {
        borderRadius: Tokens.borderRadius.xl,
        overflow: 'hidden',
    },
    input: {
        marginBottom: Tokens.spacing.md,
        backgroundColor: 'transparent',
    },
    loginButton: {
        marginTop: Tokens.spacing.md,
        borderRadius: 12,
        paddingVertical: 8,
        backgroundColor: theme.colors.primary,
        elevation: 0,
    },
    buttonLabel: {
        fontWeight: '600',
        letterSpacing: 0.5,
        fontSize: 16,
    },
    divider: {
        marginVertical: Tokens.spacing.xl,
        backgroundColor: theme.colors.outline,
        opacity: 0.5,
    },
    roleLabel: {
        marginBottom: Tokens.spacing.md,
        textAlign: 'center',
        color: theme.colors.onSurfaceVariant,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontWeight: '800',
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 12,
    },
    quickAccessButton: {
        opacity: 0.8,
    }
});
