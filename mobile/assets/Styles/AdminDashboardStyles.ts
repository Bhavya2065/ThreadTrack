import { StyleSheet, Platform } from 'react-native';
import { MD3Theme } from 'react-native-paper';
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
    kpiRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: Tokens.spacing.lg,
    },
    kpiCard: {
        width: Platform.OS === 'web' ? '23.5%' : '48%',
        marginBottom: Tokens.spacing.md,
    },
    kpiCardInner: {
        padding: Tokens.spacing.md,
        alignItems: 'flex-start',
    },
    kpiValue: {
        fontSize: 24,
        fontWeight: '900',
        color: theme.colors.primary,
        marginVertical: 4,
        ...Platform.select({
            web: {
                textShadow: theme.dark ? `0 0 10px ${theme.colors.primary}50` : 'none',
            }
        }),
    },
    kpiLabel: {
        fontSize: 10,
        color: theme.colors.onSurfaceVariant,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '800',
    },
    sectionTitle: {
        fontWeight: '900',
        fontSize: 18,
        marginBottom: Tokens.spacing.lg,
        color: theme.colors.onSurface,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    analyticsWrapper: {
        marginBottom: Tokens.spacing.xl,
    },
    chartCard: {
        overflow: 'hidden',
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Tokens.spacing.md,
    },
    chartTitle: {
        marginLeft: Tokens.spacing.sm,
        color: theme.colors.onSurface,
        fontWeight: '800',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    chart: {
        marginVertical: Tokens.spacing.sm,
        borderRadius: Tokens.borderRadius.xl,
        alignSelf: 'center',
    },
    segmentedButtons: {
        marginBottom: Tokens.spacing.lg,
        paddingHorizontal: Tokens.spacing.sm,
    }
});
