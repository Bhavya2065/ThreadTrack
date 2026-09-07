import React, { useState, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated, Platform, ScrollView, TextInput } from 'react-native';
import { Text, useTheme, Menu, Divider, Checkbox } from 'react-native-paper';
import { ChevronDown, Search, X } from 'lucide-react-native';
import { Tokens } from '../../theme/tokens';

/**
 * CustomDropdown - A unified dropdown component for both single and multi-selection.
 * Supports search filtering and smooth scrolling for large lists.
 */
export const CustomDropdown = ({
    label,
    value,
    options = [],
    onSelect,
    multiSelect = false,
    placeholder = "Select",
    searchable = true
}) => {
    const [visible, setVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [layoutWidth, setLayoutWidth] = useState(0);
    const rotation = useRef(new Animated.Value(0)).current;
    const theme = useTheme();

    const isSearchEnabled = searchable && options.length > 4;

    const filteredOptions = options.filter(option =>
        (option.label || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    const openMenu = () => {
        setVisible(true);
        setSearchQuery('');
        setHighlightedIndex(-1);
        Animated.spring(rotation, {
            toValue: 1,
            useNativeDriver: Platform.OS !== 'web',
            friction: 8,
            tension: 40
        }).start();
    };

    const closeMenu = () => {
        setVisible(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        Animated.spring(rotation, {
            toValue: 0,
            useNativeDriver: Platform.OS !== 'web',
            friction: 8,
            tension: 40
        }).start();
    };

    const rotateChevron = rotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    const getDisplayValue = () => {
        if (multiSelect && Array.isArray(value)) {
            if (value.length === 0) return placeholder;
            const firstLabel = options.find(o => o.value === value[0])?.label || value[0];
            if (value.length === 1) return firstLabel;
            return `${firstLabel} + ${value.length - 1} more`;
        }
        return options.find(o => o.value === value)?.label || value || placeholder;
    };

    const isSelected = (val) => {
        if (multiSelect && Array.isArray(value)) {
            return value.includes(val);
        }
        return value === val;
    };

    return (
        <View style={styles.container} onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}>
            {!!label && <Text style={styles.externalLabel}>{label}</Text>}

            <Menu
                visible={visible}
                onDismiss={closeMenu}
                contentStyle={[
                    styles.menuContent,
                    {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.outline,
                        width: layoutWidth,
                    }
                ]}
                anchor={
                    <Pressable
                        onPress={openMenu}
                        onKeyDown={(e) => {
                            if (!visible) {
                                if (e.key === 'ArrowDown' || e.key === 'Enter') {
                                    openMenu();
                                    e.preventDefault();
                                }
                                return;
                            }
                            if (e.key === 'ArrowDown') {
                                setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
                                e.preventDefault();
                            } else if (e.key === 'ArrowUp') {
                                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
                                e.preventDefault();
                            } else if (e.key === 'Enter' && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                                onSelect(filteredOptions[highlightedIndex].value);
                                if (!multiSelect) closeMenu();
                                e.preventDefault();
                            } else if (e.key === 'Escape') {
                                closeMenu();
                                e.preventDefault();
                            }
                        }}
                        style={({ pressed }) => [
                            styles.anchor,
                            {
                                borderColor: visible ? theme.colors.primary : theme.colors.outline,
                                backgroundColor: theme.colors.surface,
                                opacity: pressed ? 0.9 : 1,
                            }
                        ]}
                    >
                        <View style={styles.anchorContent}>
                            <View style={styles.valueWrapper}>
                                <Text style={[styles.valueText, { color: theme.colors.onSurface }]} numberOfLines={1}>
                                    {getDisplayValue()}
                                </Text>
                            </View>

                            <Animated.View style={{ transform: [{ rotate: rotateChevron }] }}>
                                <ChevronDown size={20} color={theme.colors.onSurfaceVariant} />
                            </Animated.View>
                        </View>
                    </Pressable>
                }
            >
                <View style={styles.menuItemsWrapper}>
                    {isSearchEnabled && (
                        <View style={[styles.searchContainer, { borderBottomColor: theme.colors.outline }]}>
                            <Search size={16} color={theme.colors.onSurfaceVariant} style={{ marginRight: 8 }} />
                            <TextInput
                                placeholder="Search..."
                                placeholderTextColor={theme.colors.onSurfaceVariant}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                style={[styles.searchInput, { color: theme.colors.onSurface }]}
                            />
                            {searchQuery.length > 0 && (
                                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                                    <X size={16} color={theme.colors.onSurfaceVariant} />
                                </Pressable>
                            )}
                        </View>
                    )}

                    <ScrollView
                        style={styles.scrollList}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                    >
                        {filteredOptions.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                                    No options found
                                </Text>
                            </View>
                        ) : (
                            filteredOptions.map((option, index) => {
                                const active = isSelected(option.value);
                                return (
                                    <React.Fragment key={option.value}>
                                        <Pressable
                                            onPress={() => {
                                                onSelect(option.value);
                                                if (!multiSelect) closeMenu();
                                            }}
                                            style={({ pressed }) => [
                                                styles.itemPressable,
                                                (active && !multiSelect) || index === highlightedIndex ? styles.selectedItem : null,
                                                pressed && { backgroundColor: theme.colors.surfaceVariant }
                                            ]}
                                        >
                                            <View style={styles.itemContent}>
                                                {multiSelect && (
                                                    <Checkbox
                                                        status={active ? 'checked' : 'unchecked'}
                                                        onPress={() => onSelect(option.value)}
                                                    />
                                                )}
                                                {option.icon}
                                                <Text
                                                    style={[
                                                        styles.itemText,
                                                        { color: active ? theme.colors.onSurface : theme.colors.onSurfaceVariant },
                                                        active && styles.selectedText
                                                    ]}
                                                >
                                                    {option.label}
                                                </Text>
                                            </View>
                                        </Pressable>
                                        {index < filteredOptions.length - 1 && <Divider style={styles.itemDivider} />}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            </Menu>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Tokens.spacing.md,
        width: '100%',
        zIndex: 10,
    },
    externalLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginLeft: 2,
    },
    anchor: {
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1.5,
        height: 52,
        justifyContent: 'center',
        ...Platform.select({
            web: {
                transition: 'all 0.2s ease',
            }
        })
    },
    anchorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    valueWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    valueText: {
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    menuContent: {
        borderRadius: 8,
        marginTop: 56,
        borderWidth: 1.5,
        elevation: 5,
        paddingVertical: 0,
        overflow: 'hidden',
        ...Platform.select({
            web: {
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            }
        })
    },
    menuItemsWrapper: {
        width: '100%',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        paddingVertical: 4,
        paddingHorizontal: 4,
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            }
        })
    },
    scrollList: {
        maxHeight: 250,
    },
    emptyContainer: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    itemPressable: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        width: '100%',
    },
    selectedItem: {
        backgroundColor: '#f1f5f9',
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    itemText: {
        fontSize: 15,
        fontWeight: '500',
    },
    selectedText: {
        fontWeight: '700',
        color: '#334155',
    },
    itemDivider: {
        height: 1,
        opacity: 0.5,
    }
});
