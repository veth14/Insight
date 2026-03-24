import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { ms, scale, vs } from '../utils/responsive';
import { Ionicons } from '@expo/vector-icons';

export interface AlertButton {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
}

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    buttons?: AlertButton[];
    onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    title,
    message,
    icon,
    iconColor = '#0E1F43',
    buttons = [{ text: 'OK', onPress: () => {} }],
    onClose,
}) => {
    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.card}>
                            {icon && (
                                <View style={[styles.iconWrap, { backgroundColor: `${iconColor}15` }]}>
                                    <Ionicons name={icon} size={28} color={iconColor} />
                                </View>
                            )}
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.message}>{message}</Text>
                            
                            <View style={styles.buttonRow}>
                                {buttons.map((btn, idx) => {
                                    const isDestructive = btn.style === 'destructive';
                                    const isCancel = btn.style === 'cancel';
                                    
                                    let bg = '#0E1F43';
                                    let textColor = '#fff';

                                    if (isDestructive) {
                                        bg = '#EF4444';
                                        textColor = '#fff';
                                    } else if (isCancel) {
                                        bg = '#F0F2F8';
                                        textColor = '#5A6A8A';
                                    }

                                    return (
                                        <TouchableOpacity
                                            key={idx}
                                            style={[
                                                styles.btn,
                                                { backgroundColor: bg },
                                                buttons.length === 2 && styles.halfBtn
                                            ]}
                                            onPress={() => {
                                                if (btn.onPress) btn.onPress();
                                                onClose();
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[styles.btnText, { color: textColor }]}>
                                                {btn.text}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(14,31,67,0.5)',
        justifyContent: 'center', alignItems: 'center', padding: scale(20),
    },
    card: {
        width: '100%', maxWidth: scale(320),
        backgroundColor: '#fff', borderRadius: ms(20),
        padding: scale(24), alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    },
    iconWrap: {
        width: scale(56), height: scale(56), borderRadius: scale(28),
        justifyContent: 'center', alignItems: 'center', marginBottom: vs(16),
    },
    title: {
        fontSize: ms(18), fontWeight: '800', color: '#0E1F43',
        marginBottom: vs(8), textAlign: 'center',
    },
    message: {
        fontSize: ms(13), color: '#5A6A8A', textAlign: 'center',
        marginBottom: vs(24), lineHeight: ms(20),
    },
    buttonRow: {
        flexDirection: 'row', width: '100%', gap: scale(10), justifyContent: 'center',
    },
    btn: {
        paddingVertical: vs(12), paddingHorizontal: scale(20),
        borderRadius: ms(12), alignItems: 'center', justifyContent: 'center',
        minWidth: scale(100),
    },
    halfBtn: { flex: 1 },
    btnText: { fontSize: ms(14), fontWeight: '700' },
});

export default CustomAlert;