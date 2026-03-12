export const Tokens = {
    colors: {
        // Core Branding Professional
        primary: '#0061FF',       // Trust Blue
        secondary: '#697077',     // Neutral Slate
        accent: '#15AD66',        // Success Green

        // Semantic
        success: '#15AD66',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',

        // Theme-Specific (Refined)
        background: '#F8FAFC',
        surface: '#FFFFFF',
        glass: '#FFFFFF',
        glassBorder: '#E2E8F0',
        textPrimary: '#0F172A',
        textSecondary: '#475569',
        textMuted: '#94A3B8',
        divider: '#E2E8F0',
    },

    glows: {
        primary: 'none',
        secondary: 'none',
        success: 'none',
        error: 'none',
    },

    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
        huge: 64,
    },

    borderRadius: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
    },

    shadows: {
        neon: 'none',
        glass: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.025)',
        deep: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.025)',
    },

    typography: {
        h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
        h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
        h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
        bodyLarge: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
        bodyMedium: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
        bodySmall: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
        labelBold: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
    }
};

export const LightThemeColors = {
    background: '#F8FAFC',      // Clean Light Slate Background
    surface: '#FFFFFF',         // Pure White Cards
    surfaceVariant: '#F1F5F9',  // Subtle Gray for Hover/Secondary
    onSurface: '#0F172A',       // High Contrast Dark Slate Text
    onSurfaceVariant: '#475569',// Medium Gray for Labels
    outline: '#E2E8F0',         // Crisp Borders
    glass: '#FFFFFF',           // Removing transparent glass, using solid white
    glassBorder: '#E2E8F0',     // Solid subtle border
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
};

export const DarkThemeColors = {
    background: '#0F172A',      // Deep Navy Dark Background
    surface: '#1E293B',         // Solid Slate Dark Cards
    surfaceVariant: '#334155',  // Medium Slate for Action Areas
    onSurface: '#F8FAFC',       // High Contrast White Text
    onSurfaceVariant: '#94A3B8',// Soft Gray for Labels
    outline: '#334155',         // Clean Dark Borders
    glass: '#1E293B',           // Solid Dark Slate
    glassBorder: '#334155',     // Solid Dark Border
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
};
