// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';
import { Platform } from 'react-native';
// import { authService, getUserInfo } from './api';

// Configure how notifications are handled when the app is in the foreground
/*
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});
*/

export const notificationService = {
    /**
     * Registers the device for push notifications and saves the token to the backend.
     */
    registerForPushNotifications: async () => {
        console.log('[Notification] Push notifications disabled for Expo Go compatibility');
        return null;
        /*
        if (!Device.isDevice) {
            console.warn('[Notification] Push notifications only work on physical devices');
            return null;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            throw new Error('Permission not granted for notifications');
        }

        // Get the token from Expo
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: 'your-project-id', // Optional, will use default if omitted
        });
        const token = tokenData.data;

        // Save to backend if user is logged in
        const user = getUserInfo();
        if (user && user.id) {
            await authService.updatePushToken(user.id, token);
            console.log('[Notification] Push token saved to backend');
        }

        // Android details
        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return token;
        */
    },

    /**
     * Sets up listeners for incoming notifications
     */
    addNotificationListeners: (
        onReceived: (notification: any) => void,
        onResponse: (response: any) => void
    ) => {
        /*
        const receivedSubscription = Notifications.addNotificationReceivedListener(onReceived);
        const responseSubscription = Notifications.addNotificationResponseReceivedListener(onResponse);

        return () => {
            receivedSubscription.remove();
            responseSubscription.remove();
        };
        */
        return () => {};
    }
};
