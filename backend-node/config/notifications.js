const axios = require('axios');

/**
 * Sends a push notification via Expo's Push API
 * @param {string} expoPushToken - The target device's Expo push token
 * @param {string} title - Title of the notification
 * @param {string} body - Body message
 * @param {object} data - Optional data payload (e.g., { url: '/admin/orders' })
 */
async function sendPushNotification(expoPushToken, title, body, data = {}) {
    if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) {
        console.warn('[Push] Invalid or missing Expo Push Token');
        return;
    }

    const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
    };

    try {
        const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
        });
        console.log('[Push] Notification sent successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('[Push] Error sending notification:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = { sendPushNotification };
