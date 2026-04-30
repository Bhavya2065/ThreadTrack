import React, { useState, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated, Platform } from 'react-native';
import { Text, useTheme, Menu, Divider, Checkbox } from 'react-native-paper';
import { ChevronDown } from 'lucide-react-native';
import { Tokens } from '../../theme/tokens';

interface CustomDropdownProps {
  label: string;
  value: string | string[];
  options: { label: string; value: string; icon?: React.ReactNode }[];
  onSelect: (value: string) => void;
  multiSelect?: boolean;
  placeholder?: string;
}

/**
 * CustomDropdown - A unified dropdown component for both single and multi-selection.
 * Matches the requested clean UI style with external labels and non-overlapping menus.
 */
export const CustomDropdown: React.FC<CustomDropdownProps> = ({ 
  label, 
  value, 
  options, 
  onSelect, 
  multiSelect = false,
  placeholder = "Select"
}) => {
  const [visible, setVisible] = useState(false);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const rotation = useRef(new Animated.Value(0)).current;
  const theme = useTheme();

  const openMenu = () => {
    setVisible(true);
    Animated.spring(rotation, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40
    }).start();
  };

  const closeMenu = () => {
    setVisible(false);
    Animated.spring(rotation, {
      toValue: 0,
      useNativeDriver: true,
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
    return options.find(o => o.value === value)?.label || (value as string) || placeholder;
  };

  const isSelected = (val: string) => {
    if (multiSelect && Array.isArray(value)) {
      return value.includes(val);
    }
    return value === val;
  };

  return (
    <View style={styles.container} onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}>
      <Text style={styles.externalLabel}>{label}</Text>
      
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
            {options.map((option, index) => {
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
                                active && !multiSelect && styles.selectedItem,
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
                                <Text style={[
                                    styles.itemText, 
                                    { color: active ? theme.colors.onSurface : theme.colors.onSurfaceVariant },
                                    active && styles.selectedText
                                ]}>
                                    {option.label}
                                </Text>
                            </View>
                        </Pressable>
                        {index < options.length - 1 && <Divider style={styles.itemDivider} />}
                    </React.Fragment>
                );
            })}
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
