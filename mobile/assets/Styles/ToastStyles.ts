import { StyleSheet, Platform } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 24 : 50,
        right: Platform.OS === 'web' ? 24 : 0,
        left: Platform.OS === 'web' ? undefined : 0,
        width: Platform.OS === 'web' ? 400 : '100%',
        paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
        alignItems: 'flex-end',
    },
    toast: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        borderWidth: 1.5,
    },
    iconCircle: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    message: {
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 18,
        opacity: 0.9,
    },
    closeButton: {
        padding: 4,
        opacity: 0.6,
        alignSelf: 'flex-start',
        marginTop: -8,
        marginRight: -8,
    },
});
