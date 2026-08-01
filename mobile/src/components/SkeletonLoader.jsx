import React, { useEffect } from 'react';
import { StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
export const SkeletonLoader = ({ width = '100%', height = 20, borderRadius = 4, style }) => {
    const theme = useTheme();
    const animatedValue = new Animated.Value(0);
    useEffect(() => {
        Animated.loop(Animated.sequence([
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(animatedValue, {
                toValue: 0,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: Platform.OS !== 'web',
            }),
        ])).start();
    }, []);
    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });
    return (<Animated.View style={[
            styles.skeleton,
            {
                width,
                height,
                borderRadius,
                backgroundColor: theme.colors.surfaceVariant,
                opacity,
            },
            style,
        ]}/>);
};
const styles = StyleSheet.create({
    skeleton: {
        overflow: 'hidden',
    },
});
