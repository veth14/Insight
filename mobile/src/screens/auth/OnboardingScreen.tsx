import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, StatusBar, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Where Knowledge Begins',
        description: 'Knowledge gathered, studies preserved.',
        image: require('../../../assets/images/onboarding1.png'),
    },
    {
        id: '2',
        title: 'Where Gaps Are Revealed',
        description: 'Patterns emerge. New ideas take shape.',
        image: require('../../../assets/images/onboarding2.jpg'),
    },
    {
        id: '3',
        title: 'Where Research Continues',
        description: 'Read with purpose. Cite with integrity.',
        image: require('../../../assets/images/onboarding3.png'),
    },
];

const OnboardingScreen: React.FC = () => {
    const navigation = useNavigation<OnboardingScreenNavigationProp>();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    // Initial Welcome Screen State
    const [showWelcome, setShowWelcome] = useState(true);

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            navigation.replace('Login');
        }
    };

    const handleSkip = () => {
        navigation.replace('Login');
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    if (showWelcome) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Image 
                        source={require('../../../assets/images/logo.png')}
                        style={{ width: width * 0.6, height: width * 0.6, resizeMode: 'contain' }}
                    />
                </View>
                <TouchableOpacity 
                    style={styles.welcomeButton}
                    onPress={() => setShowWelcome(false)}
                >
                    <Ionicons name="chevron-forward" size={32} color={COLORS.white} />
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <FlatList
                ref={flatListRef}
                data={SLIDES}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                renderItem={({ item }) => (
                    <View style={styles.slide}>
                        <View style={styles.imageContainer}>
                            <Image 
                                source={item.image} 
                                style={{ width: width * 0.9, height: width * 0.9, resizeMode: 'contain' }} 
                            />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.description}>{item.description}</Text>
                        </View>
                    </View>
                )}
            />

            <View style={styles.footer}>
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                currentIndex === index && styles.activeDot,
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    slide: {
        width,
        alignItems: 'center', // Images centered
        paddingHorizontal: SPACING.xl,
        justifyContent: 'center', 
    },
    imageContainer: {
        height: height * 0.45,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    textContainer: {
        alignItems: 'flex-start', // Text align left container
        width: '100%',
        paddingLeft: SPACING.s, 
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: SPACING.s,
        textAlign: 'left', // Crucial: Left align text
        width: '90%', // Ensure it wraps correctly like mockup
    },
    description: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'left', // Crucial: Left align text
        lineHeight: 22,
        width: '80%', 
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        position: 'absolute',
        bottom: 40, 
        width: '100%',
        paddingBottom: 0,
    },
    pagination: {
        flexDirection: 'row',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
        marginRight: 6,
    },
    activeDot: {
        backgroundColor: COLORS.primary, // Dark Blue
        width: 24,
    },
    nextButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary, // Dark Blue
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    logoContainer: {
        marginBottom: SPACING.l,
        alignItems: 'center',
        justifyContent: 'center'
    },
    brandText: {
        fontSize: 32,
        fontWeight: '900',
        color: COLORS.primary,
        letterSpacing: 2,
    },
    welcomeButton: {
        position: 'absolute',
        bottom: 50,
        right: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default OnboardingScreen;
