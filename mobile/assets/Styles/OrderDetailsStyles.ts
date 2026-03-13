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
        alignItems: 'center',
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
        padding: Tokens.spacing.lg,
        width: '100%',
        maxWidth: 1200,
        alignSelf: 'center',
    },
    webLayout: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    card: {
        marginBottom: Tokens.spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Tokens.spacing.lg,
    },
    productName: {
        fontWeight: '700',
        fontSize: 24,
        color: theme.colors.onSurface,
        letterSpacing: -0.5,
    },
    quantitySub: {
        color: theme.colors.onSurfaceVariant,
        fontWeight: '600',
        marginTop: 2,
        fontSize: 14,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    statusText: {
        fontWeight: '700',
        fontSize: 11,
        letterSpacing: 0.5,
    },
    divider: {
        marginVertical: Tokens.spacing.md,
        backgroundColor: theme.colors.outline,
        height: 1,
        opacity: 0.3,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
        marginBottom: Tokens.spacing.lg,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minWidth: '40%',
    },
    infoTextContainer: {
        justifyContent: 'center',
    },
    labelSmall: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    bodyMedium: {
        color: theme.colors.onSurface,
        fontWeight: '600',
        fontSize: 15,
    },
    progressContainer: {
        marginTop: 12,
        backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
        padding: Tokens.spacing.lg,
        borderRadius: Tokens.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.outline,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    progressPercent: {
        color: theme.colors.primary,
        fontWeight: '700',
        fontSize: 24,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    },
    progressSub: {
        textAlign: 'right',
        marginTop: 10,
        color: theme.colors.onSurfaceVariant,
        fontWeight: '600',
        fontSize: 13,
    },
    notesCard: {
        marginBottom: Tokens.spacing.md,
    },
    notesTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.onSurface,
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    notesText: {
        color: theme.colors.onSurfaceVariant,
        fontStyle: 'italic',
        lineHeight: 22,
        fontSize: 14,
    },
    sectionTitle: {
        marginBottom: Tokens.spacing.lg,
        fontWeight: '700',
        fontSize: 18,
        color: theme.colors.onSurface,
        letterSpacing: 0.5,
    },
    timelineCard: {
        overflow: 'hidden',
    },
    timelineItem: {
        flexDirection: 'row',
    },
    timelineIndicator: {
        alignItems: 'center',
        width: 32,
        marginRight: 16,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 14,
        backgroundColor: theme.colors.primary,
        ...Platform.select({
            web: {
                boxShadow: theme.dark ? '0 0 10px rgba(0, 212, 255, 0.5)' : 'none',
            }
        }),
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: theme.colors.outline,
        opacity: 0.3,
    },
    timelineContent: {
        flex: 1,
        paddingVertical: 10,
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    timelineQuantity: {
        fontWeight: '700',
        color: theme.colors.primary,
        fontSize: 16,
    },
    timelineTime: {
        color: theme.colors.onSurfaceVariant,
        fontSize: 12,
        fontWeight: '700',
    },
    timelineMeta: {
        color: theme.colors.onSurface,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyTimeline: {
        alignItems: 'center',
        padding: 56,
    },
    emptyTimelineText: {
        marginTop: 16,
        color: theme.colors.onSurfaceVariant,
        fontWeight: '700',
        fontSize: 14,
    },
    flex1_5: {
        flex: 1.5,
    },
    flex1: {
        flex: 1,
    },
    largeMarginLeft: {
        marginLeft: 24,
    },
    topMargin: {
        marginTop: 16,
    }
});
