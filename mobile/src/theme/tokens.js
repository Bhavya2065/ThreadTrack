export const Tokens = {
    colors: {
        // Modern Sapphire Branding
        primary: '#2563EB',       // Vibrant Sapphire Blue
        secondary: '#6366F1',     // Indigo Accent
        accent: '#10B981',        // Emerald Success

        // Semantic
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',

        // Theme-Specific
        background: '#F1F5F9',
        surface: '#FFFFFF',
        glass: '#FFFFFF',
        glassBorder: '#E2E8F0',
        textPrimary: '#1E293B',
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
    background: '#F1F5F9',      // Soft Slate Gray for contrast
    surface: '#FFFFFF',         // Card surface
    surfaceVariant: '#F8FAFC',  // Subtle backgrounds
    onSurface: '#0F172A',       // Primary text
    onSurfaceVariant: '#475569',// Secondary text
    outline: '#E2E8F0',         // Borders
    glass: '#FFFFFF',
    glassBorder: '#E2E8F0',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
};

export const DarkThemeColors = {
    background: '#0F172A',      // Midnight Navy
    surface: '#1E293B',         // Slate Dark surface
    surfaceVariant: '#334155',  // Action areas
    onSurface: '#F8FAFC',       // High contrast white
    onSurfaceVariant: '#94A3B8',// Secondary text gray
    outline: '#334155',         // Dark borders
    glass: '#1E293B',
    glassBorder: '#334155',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
};
