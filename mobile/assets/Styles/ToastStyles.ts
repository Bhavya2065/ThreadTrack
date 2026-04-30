import { StyleSheet, Platform } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 20 : 50,
        right: Platform.OS === 'web' ? 20 : 0,
        left: Platform.OS === 'web' ? undefined : 0,
        width: Platform.OS === 'web' ? 380 : '100%',
        paddingHorizontal: Platform.OS === 'web' ? 0 : 20,
        alignItems: 'center',
    },
    toast: {
        flexDirection: 'row',
        borderRadius: 20,
        padding: 16,
        width: '100%',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.2,
        marginBottom: 2,
    },
    message: {
        fontSize: 13,
        fontWeight: '500',
        opacity: 0.9,
        lineHeight: 18,
    },
    closeButton: {
        padding: 4,
        opacity: 0.4,
        alignSelf: 'flex-start',
        marginTop: -4,
        marginRight: -4,
    },
});
