import { StyleSheet, Platform } from 'react-native';
import { MD3Theme } from 'react-native-paper';

export const createStyles = (theme: MD3Theme) => StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 20 : 50,
        right: Platform.OS === 'web' ? 20 : 0,
        left: Platform.OS === 'web' ? undefined : 0,
        width: Platform.OS === 'web' ? 350 : '100%',
        paddingHorizontal: Platform.OS === 'web' ? 0 : 20,
        alignItems: 'center',
    },
    toast: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        borderWidth: Platform.OS === 'web' ? 1 : 0,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    iconContainer: {
        marginRight: 12,
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 15,
        fontWeight: '400',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    message: {
        fontSize: 12,
        color: '#666666',
        fontWeight: '500',
    },
    closeButton: {
        marginLeft: 8,
        justifyContent: 'center',
        opacity: 0.6,
    },
});
