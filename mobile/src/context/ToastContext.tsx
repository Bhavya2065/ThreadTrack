import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react-native';

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

const TOAST_CONFIG = {
    success: {
        accentColor: '#22C55E',
        iconBg: '#22C55E',
        icon: (size: number) => <CheckCircle2 size={size} color="#FFFFFF" />,
    },
    error: {
        accentColor: '#EF4444',
        iconBg: '#EF4444',
        icon: (size: number) => <AlertCircle size={size} color="#FFFFFF" />,
    },
    warning: {
        accentColor: '#F59E0B',
        iconBg: '#F59E0B',
        icon: (size: number) => <AlertTriangle size={size} color="#FFFFFF" />,
    },
    info: {
        accentColor: '#3B82F6',
        iconBg: '#3B82F6',
        icon: (size: number) => <Info size={size} color="#FFFFFF" />,
    },
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [visible, setVisible] = useState(false);
    const [options, setOptions] = useState<ToastOptions>({ title: '', message: '', type: 'info' });
    const [fadeAnim] = useState(new Animated.Value(0));
    const [translateX] = useState(new Animated.Value(120));
    const theme = useTheme();

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const durationRef = useRef<number>(4000);

    const hideToast = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(translateX, { toValue: 120, duration: 250, useNativeDriver: Platform.OS !== 'web' }),
        ]).start(() => setVisible(false));
    }, [fadeAnim, translateX]);

    const showToast = useCallback(({ title, message, type = 'info', duration = 4000 }: ToastOptions) => {
        setOptions({ title, message, type });
        setVisible(true);
        durationRef.current = duration;

        if (timerRef.current) clearTimeout(timerRef.current);

        // Reset animation values before starting
        fadeAnim.setValue(0);
        translateX.setValue(120);

        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: Platform.OS !== 'web' }),
            Animated.spring(translateX, { toValue: 0, useNativeDriver: Platform.OS !== 'web', tension: 80, friction: 10 }),
        ]).start();

        timerRef.current = setTimeout(() => {
            hideToast();
        }, duration);
    }, [fadeAnim, translateX, hideToast]);

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

    if (!visible) return <ToastContext.Provider value={{ showToast }}>{children}</ToastContext.Provider>;

    const config = TOAST_CONFIG[options.type || 'info'];
    const isDark = theme.dark;
    const cardBg = isDark ? '#1E293B' : '#FFFFFF';
    const titleColor = isDark ? '#F1F5F9' : '#0F172A';
    const msgColor = isDark ? '#94A3B8' : '#64748B';
    const closeColor = isDark ? '#64748B' : '#94A3B8';

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Animated.View
                //@ts-ignore
                onMouseEnter={Platform.OS === 'web' ? handleMouseEnter : undefined}
                //@ts-ignore
                onMouseLeave={Platform.OS === 'web' ? handleMouseLeave : undefined}
                style={[
                    styles.container,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateX }],
                        zIndex: 9999,
                    }
                ]}
            >
                {/* Card */}
                <View style={[styles.card, { backgroundColor: cardBg }]}>
                    {/* Colored left accent bar */}
                    <View style={[styles.accentBar, { backgroundColor: config.accentColor }]} />

                    {/* Colored circle icon */}
                    <View style={[styles.iconCircle, { backgroundColor: config.iconBg }]}>
                        {config.icon(18)}
                    </View>

                    {/* Text content */}
                    <View style={styles.textContent}>
                        <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
                            {options.title}
                        </Text>
                        <Text style={[styles.message, { color: msgColor }]} numberOfLines={2}>
                            {options.message}
                        </Text>
                    </View>

                    {/* Close button */}
                    <TouchableOpacity onPress={hideToast} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <X size={16} color={closeColor} />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </ToastContext.Provider>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 20 : 50,
        right: Platform.OS === 'web' ? 20 : 16,
        left: Platform.OS === 'web' ? undefined : 16,
        width: Platform.OS === 'web' ? 360 : undefined,
        zIndex: 9999,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        minHeight: 64,
    },
    accentBar: {
        width: 5,
        alignSelf: 'stretch',
    },
    iconCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 14,
        flexShrink: 0,
    },
    textContent: {
        flex: 1,
        paddingVertical: 14,
        paddingRight: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    message: {
        fontSize: 13,
        fontWeight: '400',
        lineHeight: 18,
    },
    closeBtn: {
        padding: 14,
        alignSelf: 'flex-start',
    },
});
