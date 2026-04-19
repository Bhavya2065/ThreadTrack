import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';
import { Tokens } from '../theme/tokens';

import { createStyles } from '../../assets/Styles/ToastStyles';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
    title: string;
    message: string;
    type?: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [visible, setVisible] = useState(false);
    const [options, setOptions] = useState<ToastOptions>({ title: '', message: '', type: 'info' });
    const [fadeAnim] = useState(new Animated.Value(0));
    const [translateY] = useState(new Animated.Value(-100));
    const theme = useTheme();
    const styles = createStyles(theme);

    const hideToast = useCallback(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
        ]).start(() => setVisible(false));
    }, [fadeAnim, translateY]);

    const showToast = useCallback(({ title, message, type = 'info', duration = 4000 }: ToastOptions) => {
        setOptions({ title, message, type });
        setVisible(true);

        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 20, duration: 400, useNativeDriver: true }),
        ]).start();

        setTimeout(() => {
            hideToast();
        }, duration);
    }, [fadeAnim, translateY, hideToast]);

    const getToastStyle = () => {
        switch (options.type) {
            case 'success': return { accent: '#4CAF50', icon: <CheckCircle2 size={24} color="#4CAF50" /> };
            case 'error': return { accent: '#F44336', icon: <AlertCircle size={24} color="#F44336" /> };
            case 'warning': return { accent: '#FF9800', icon: <AlertCircle size={24} color="#FF9800" /> };
            default: return { accent: theme.colors.primary, icon: <Info size={24} color={theme.colors.primary} /> };
        }
    };

    const { accent, icon } = getToastStyle();

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {visible && (
                <Animated.View style={[
                    styles.container,
                    { 
                        opacity: fadeAnim, 
                        transform: [{ translateY }],
                        zIndex: 9999 
                    }
                ]}>
                    <Surface style={[styles.toast, { borderLeftColor: accent, borderLeftWidth: 4 }]}>
                        <View style={styles.iconContainer}>{icon}</View>
                        <View style={styles.content}>
                            <Text style={styles.title}>{options.title}</Text>
                            <Text style={styles.message}>{options.message}</Text>
                        </View>
                        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
                            <X size={18} color={theme.colors.onSurfaceVariant} />
                        </TouchableOpacity>
                    </Surface>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};
