import { TextStyle, ViewStyle } from 'react-native';

export const COLORS = {
    primary: '#1E3A8A', // Deep Academic Blue
    secondary: '#3B82F6', // Lighter Blue for focus/hover/chips
    accent: '#3B82F6', // Replacing Teal with Lighter Blue as requested
    background: '#F5F5F5', // Light neutral
    card: '#FFFFFF',
    white: '#FFFFFF',
    text: {
        primary: '#1F2937', // Dark gray
        secondary: '#6B7280', // Medium gray
        light: '#FFFFFF',
    },
    border: '#E5E7EB',
    success: '#10B981',
    error: '#EF4444', // Red for errors only
    warning: '#F59E0B',
    info: '#3B82F6',
};

export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const BORDER_RADIUS = {
    s: 8,
    m: 12,
    l: 16,
    full: 9999,
};

interface Typography {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    body: TextStyle;
    caption: TextStyle;
}

export const TYPOGRAPHY: Typography = {
    h1: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        lineHeight: 40,
    },
    h2: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        lineHeight: 32,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text.primary,
        lineHeight: 28,
    },
    body: {
        fontSize: 16,
        color: COLORS.text.primary,
        lineHeight: 24,
    },
    caption: {
        fontSize: 14,
        color: COLORS.text.secondary,
        lineHeight: 20,
    },
};

export const SHADOWS = {
    subtle: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 5.46,
        elevation: 4,
    },
};
