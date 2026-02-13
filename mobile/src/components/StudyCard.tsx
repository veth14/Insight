import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { AcademicStudy } from '../types';

interface StudyCardProps {
    study: Partial<AcademicStudy>; // Partial for now as we might mock data
    onPress?: () => void;
    variant?: 'horizontal' | 'vertical';
}

const StudyCard: React.FC<StudyCardProps> = ({ study, onPress, variant = 'vertical' }) => {
    const isHorizontal = variant === 'horizontal';

    return (
        <TouchableOpacity 
            style={[
                styles.card, 
                isHorizontal ? styles.horizontalCard : styles.verticalCard,
                SHADOWS.subtle
            ]} 
            onPress={onPress}
        >
            <View style={styles.content}>
                <Text style={styles.category} numberOfLines={1}>{study.category || 'Research'}</Text>
                <Text style={isHorizontal ? styles.titleHorizontal : styles.titleVertical} numberOfLines={2}>
                    {study.title || 'Untitled Study'}
                </Text>
                <Text style={styles.author} numberOfLines={1}>
                    {(study.authors || []).join(', ') || 'Unknown Author'}
                </Text>
                <View style={styles.footer}>
                    <Text style={styles.year}>{study.yearPublished || '2024'}</Text>
                    {/* Add more metadata if needed */}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.card,
        borderRadius: BORDER_RADIUS.m,
        padding: SPACING.m,
        marginRight: SPACING.m,
        marginBottom: SPACING.m,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    horizontalCard: {
        width: 200,
        height: 140,
    },
    verticalCard: {
        width: '100%',
        minHeight: 120,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    category: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.accent,
        textTransform: 'uppercase',
        marginBottom: SPACING.xs,
        letterSpacing: 0.5,
    },
    titleHorizontal: {
        ...TYPOGRAPHY.h3,
        fontSize: 16,
        lineHeight: 22,
        marginBottom: SPACING.s,
    },
    titleVertical: {
        ...TYPOGRAPHY.h3,
        marginBottom: SPACING.s,
    },
    author: {
        ...TYPOGRAPHY.caption,
        marginBottom: SPACING.xs,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.xs,
    },
    year: {
        ...TYPOGRAPHY.caption,
        fontSize: 12,
    },
});

export default StudyCard;
