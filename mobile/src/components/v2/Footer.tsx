import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions, TouchableOpacity, Linking } from 'react-native';
import { Text, useTheme, Divider } from 'react-native-paper';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react-native';

export const Footer = () => {
    const theme = useTheme();
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const isDesktop = width >= 768;

    if (!isWeb) return null; // Hide on mobile app (use Bottom Tabs instead)

    return (
        <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline }]}>
            <View style={styles.container}>
                <View style={[styles.section, isDesktop ? styles.row : styles.column]}>
                    <View style={styles.brandSection}>
                        <Text variant="titleMedium" style={[styles.brandText, { color: theme.colors.primary }]}>
                            ThreadTrack
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                            Precision Manufacturing Tracking for the Modern Era.
                        </Text>
                    </View>

                    <View style={[styles.linksSection, isDesktop && { marginLeft: 'auto' }]}>
                        <View style={styles.linkGroup}>
                            <Text variant="labelLarge" style={styles.linkHeader}>Product</Text>
                            <TouchableOpacity><Text variant="bodySmall" style={styles.link}>Features</Text></TouchableOpacity>
                            <TouchableOpacity><Text variant="bodySmall" style={styles.link}>Pricing</Text></TouchableOpacity>
                            <TouchableOpacity><Text variant="bodySmall" style={styles.link}>API Docs</Text></TouchableOpacity>
                        </View>
                        <View style={styles.linkGroup}>
                            <Text variant="labelLarge" style={styles.linkHeader}>Company</Text>
                            <TouchableOpacity><Text variant="bodySmall" style={styles.link}>About Us</Text></TouchableOpacity>
                            <TouchableOpacity><Text variant="bodySmall" style={styles.link}>Contact</Text></TouchableOpacity>
                            <TouchableOpacity><Text variant="bodySmall" style={styles.link}>Privacy</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.bottomSection}>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        © {new Date().getFullYear()} ThreadTrack Systems. All rights reserved.
                    </Text>
                    <View style={styles.socialIcons}>
                        <TouchableOpacity style={styles.socialIcon}><Github size={18} color={theme.colors.onSurfaceVariant} /></TouchableOpacity>
                        <TouchableOpacity style={styles.socialIcon}><Twitter size={18} color={theme.colors.onSurfaceVariant} /></TouchableOpacity>
                        <TouchableOpacity style={styles.socialIcon}><Linkedin size={18} color={theme.colors.onSurfaceVariant} /></TouchableOpacity>
                        <TouchableOpacity style={styles.socialIcon}><Mail size={18} color={theme.colors.onSurfaceVariant} /></TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    footer: {
        width: '100%',
        paddingVertical: 48,
        borderTopWidth: 1,
        marginTop: 'auto',
    },
    container: {
        maxWidth: 1200,
        width: '100%',
        marginHorizontal: 'auto',
        paddingHorizontal: 24,
    },
    section: {
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    row: {
        flexDirection: 'row',
    },
    column: {
        flexDirection: 'column',
        gap: 32,
    },
    brandSection: {
        maxWidth: 300,
    },
    brandText: {
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    linksSection: {
        flexDirection: 'row',
        gap: 64,
    },
    linkGroup: {
        gap: 12,
    },
    linkHeader: {
        marginBottom: 4,
        fontWeight: '700',
    },
    link: {
        color: 'rgba(0,0,0,0.6)',
        opacity: 0.8,
    },
    divider: {
        marginVertical: 24,
        opacity: 0.5,
    },
    bottomSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
    },
    socialIcons: {
        flexDirection: 'row',
        gap: 20,
    },
    socialIcon: {
        opacity: 0.7,
    }
});
