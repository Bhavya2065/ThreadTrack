import { StyleSheet, Platform } from 'react-native';
import { Tokens } from '../../src/theme/tokens';
// Accepts the current window width so layouts adapt to any screen size.
// Called without a width (legacy callers), it falls back to the old 2x2 grid.
export const createStyles = (theme, width = 0) => {
    const isDesktop = width >= 900;
    const isPhone = width > 0 && width < 600;
    // Max 2 cards per row on phone/tablet, 4 across on desktop.
    const kpiCardWidth = isDesktop ? '24%' : '48.5%';
    return StyleSheet.create({
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
        fontWeight: 'normal',
        letterSpacing: 0.5,
        color: theme.colors.onSurface,
        fontSize: 20,
    },
    content: {
        flex: 1,
    },
    mainContent: {
        width: '100%',
        maxWidth: 1200,
        alignSelf: 'center',
        padding: isPhone ? Tokens.spacing.md : Tokens.spacing.lg,
    },
    kpiRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: Tokens.spacing.lg,
    },
    kpiCard: {
        width: kpiCardWidth,
        marginBottom: Tokens.spacing.md,
        borderRadius: 16,
        overflow: 'hidden',
    },
    kpiTopBar: {
        height: 4,
        width: '100%',
    },
    kpiCardInner: {
        padding: Tokens.spacing.md,
        alignItems: 'flex-start',
    },
    kpiHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
    },
    kpiIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    kpiTrendBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    kpiTrendText: {
        fontSize: 12,
        fontWeight: '700',
    },
    kpiValue: {
        fontSize: isDesktop ? 32 : 28,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        marginBottom: 2,
    },
    kpiLabel: {
        fontSize: 14,
        color: theme.colors.onSurfaceVariant,
        fontWeight: '600',
        marginBottom: 16,
    },
    kpiDivider: {
        height: 1,
        width: '100%',
        backgroundColor: theme.colors.outlineVariant,
        opacity: 0.5,
        marginBottom: 12,
    },
    kpiFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    kpiFooterText: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
        flex: 1,
    },
    miniChartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 2,
        height: 20,
    },
    miniChartBar: {
        width: 3,
        borderRadius: 1,
    },
    sectionTitle: {
        fontWeight: 'normal',
        fontSize: 18,
        marginBottom: Tokens.spacing.lg,
        color: theme.colors.onSurface,
        letterSpacing: 0.5,
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
        fontWeight: 'normal',
        fontSize: 14,
        letterSpacing: 0.5,
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
};
