import { StyleSheet, View, ViewStyle, Platform, StyleProp } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Tokens } from '../../theme/tokens';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    blur?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, blur = true }) => {
    const theme = useTheme();

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
                borderWidth: 1,
            },
            style
        ]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 12, // More structured squared look
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease',
            }
        }),
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    }
});
