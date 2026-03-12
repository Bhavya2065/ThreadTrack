import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withDelay,
    withTiming,
    Easing
} from 'react-native-reanimated';

interface TransitionViewProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    type?: 'fade' | 'slide' | 'scale';
    index?: number; // For staggered effects
    style?: ViewStyle;
}

export const TransitionView: React.FC<TransitionViewProps> = ({
    children,
    delay = 0,
    duration = 500,
    type = 'slide',
    index = 0,
    style
}) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(type === 'slide' ? 20 : 0);
    const scale = useSharedValue(type === 'scale' ? 0.9 : 1);

    useEffect(() => {
        const finalDelay = delay + (index * 100);
        opacity.value = withDelay(finalDelay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));
        if (type === 'slide') {
            translateY.value = withDelay(finalDelay, withTiming(0, { duration, easing: Easing.out(Easing.quad) }));
        }
        if (type === 'scale') {
            scale.value = withDelay(finalDelay, withTiming(1, { duration, easing: Easing.bezier(0.33, 1, 0.68, 1) }));
        }
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateY: translateY.value },
            { scale: scale.value }
        ],
    }));

    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};
