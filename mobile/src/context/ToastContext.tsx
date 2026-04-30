import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react-native';
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

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const durationRef = useRef<number>(4000);

    const hideToast = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
        ]).start(() => setVisible(false));
    }, [fadeAnim, translateY]);

    const showToast = useCallback(({ title, message, type = 'info', duration = 4000 }: ToastOptions) => {
        setOptions({ title, message, type });
        setVisible(true);
        durationRef.current = duration;

        if (timerRef.current) clearTimeout(timerRef.current);

        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 20, duration: 400, useNativeDriver: true }),
        ]).start();

        timerRef.current = setTimeout(() => {
            hideToast();
        }, duration);
    }, [fadeAnim, translateY, hideToast]);

    const handleMouseEnter = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleMouseLeave = () => {
        if (visible && !timerRef.current) {
            timerRef.current = setTimeout(() => {
                hideToast();
            }, durationRef.current);
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const getToastStyle = () => {
        switch (options.type) {
            case 'success': return { 
                bg: '#E1F5E8', 
                text: '#1B5E20', 
                icon: <CheckCircle2 size={22} color="#1B5E20" /> 
            };
            case 'error': return { 
                bg: '#FFE4E4', 
                text: '#C62828', 
                icon: <AlertCircle size={22} color="#C62828" /> 
            };
            case 'warning': return { 
                bg: '#FFF3E0', 
                text: '#E65100', 
                icon: <AlertCircle size={22} color="#E65100" /> 
            };
            default: return { 
                bg: '#E3F2FD', 
                text: '#0D47A1', 
                icon: <Info size={22} color="#0D47A1" /> 
            };
        }
    };

    const { bg, text, icon } = getToastStyle();

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {visible && (
                <Animated.View
                    //@ts-ignore - onMouseEnter and onMouseLeave are supported on Web but not in standard RN types
                    onMouseEnter={Platform.OS === 'web' ? handleMouseEnter : undefined}
                    //@ts-ignore
                    onMouseLeave={Platform.OS === 'web' ? handleMouseLeave : undefined}
                    style={[
                        styles.container,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY }],
                            zIndex: 9999
                        }
                    ]}
                >
                    <View style={[styles.toast, { backgroundColor: bg }]}>
                        <View style={styles.iconCircle}>
                            {icon}
                        </View>
                        <View style={styles.content}>
                            <Text style={[styles.title, { color: text }]}>{options.title}</Text>
                            <Text style={[styles.message, { color: text }]}>{options.message}</Text>
                        </View>
                        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
                            <X size={18} color={text} />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};
