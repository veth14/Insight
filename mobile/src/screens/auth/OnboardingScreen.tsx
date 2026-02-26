import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, StatusBar, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Where Knowledge Begins',
        description: 'Knowledge gathered, studies preserved.',
        image: require('../../../assets/images/onboarding1.png'),
        imageHeight: height * 0.70,
        textMarginTop: -SPACING.xl * 6,
    },
    {
        id: '2',
        title: 'Where Gaps Are Revealed',
        description: 'Patterns emerge. New ideas take shape.',
        image: require('../../../assets/images/onboarding2.jpg'),
        imageHeight: height * 0.515,
        textMarginTop: SPACING.l,
    },
    {
        id: '3',
        title: 'Where Research Continues',
        description: 'Read with purpose. Cite with integrity.',
        image: require('../../../assets/images/onboarding3.png'),
        imageHeight: height * 0.70,
        textMarginTop: -SPACING.xl * 6,
    },
];

const OnboardingScreen: React.FC = () => {
    const navigation = useNavigation<OnboardingScreenNavigationProp>();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    // Initial Welcome Screen State
    const [showWelcome, setShowWelcome] = useState(true);
    const CIRCLE_SIZE = width * 0.72;
    const fillHeight = useRef(new Animated.Value(0)).current;
    const circleOpacity = useRef(new Animated.Value(1)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Spinning shimmer arc around the ring
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1800,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        Animated.sequence([
            Animated.delay(300),
            // Water fills up — 3 seconds
            Animated.timing(fillHeight, {
                toValue: CIRCLE_SIZE,
                duration: 3000,
                easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                useNativeDriver: false,
            }),
            Animated.delay(150),
            // 1 second fade: circle out, logo in
            Animated.parallel([
                Animated.timing(circleOpacity, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: false,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: false,
                }),
            ]),
        ]).start();
    }, []);

    const handleNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            navigation.replace('Login');
        }
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        navigation.replace('Login');
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    if (showWelcome) {
        const waveHeight = fillHeight.interpolate({
            inputRange: [0, CIRCLE_SIZE],
            outputRange: [0, CIRCLE_SIZE * 0.08],
        });
        const spin = spinAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
        });
        const ARC_SIZE = CIRCLE_SIZE + 6;

        return (
            <TouchableOpacity
                activeOpacity={1}
                style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FF' }]}
                onPress={() => setShowWelcome(false)}
            >
                <StatusBar barStyle="dark-content" backgroundColor="#F8F9FF" />

                <Animated.View style={{ opacity: circleOpacity, alignItems: 'center', justifyContent: 'center' }}>

                    {/* Spinning arc — premium loading ring */}
                    <Animated.View style={{
                        position: 'absolute',
                        width: ARC_SIZE,
                        height: ARC_SIZE,
                        borderRadius: ARC_SIZE / 2,
                        borderWidth: 3,
                        borderColor: 'transparent',
                        borderTopColor: '#CDDDFF',
                        borderRightColor: 'rgba(205,221,255,0.4)',
                        transform: [{ rotate: spin }],
                        shadowColor: '#CDDDFF',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 1,
                        shadowRadius: 8,
                        elevation: 8,
                    }} />

                    {/* Single water-fill circle */}
                    <View style={{
                        width: CIRCLE_SIZE,
                        height: CIRCLE_SIZE,
                        borderRadius: CIRCLE_SIZE / 2,
                        overflow: 'hidden',
                        borderWidth: 2,
                        borderColor: '#0E1F43',
                        backgroundColor: 'rgba(14,31,67,0.05)',
                    }}>
                        {/* Gradient fill rising from bottom */}
                        <Animated.View style={{
                            position: 'absolute',
                            bottom: 0,
                            width: CIRCLE_SIZE,
                            height: fillHeight,
                        }}>
                            <LinearGradient
                                colors={['#2a508e', '#0E1F43', '#071529']}
                                start={{ x: 0.5, y: 0 }}
                                end={{ x: 0.5, y: 1 }}
                                style={{ flex: 1 }}
                            />
                            {/* Diagonal shimmer */}
                            <LinearGradient
                                colors={['transparent', 'rgba(205,221,255,0.15)', 'transparent']}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                            />
                            {/* Wave surface */}
                            <Animated.View style={{
                                position: 'absolute',
                                top: 0,
                                alignSelf: 'center',
                                width: CIRCLE_SIZE * 0.65,
                                height: waveHeight,
                                borderRadius: CIRCLE_SIZE,
                                backgroundColor: 'rgba(205,221,255,0.22)',
                            }} />
                        </Animated.View>
                    </View>
                </Animated.View>

                {/* Logo fades in after circle disappears */}
                <Animated.Image
                    source={require('../../../assets/images/logobgr.png')}
                    style={{
                        position: 'absolute',
                        width: width * 0.78,
                        height: width * 0.78,
                        resizeMode: 'contain',
                        opacity: logoOpacity,
                    }}
                />
            </TouchableOpacity>
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
                style={{ flex: 1 }}
                renderItem={({ item }) => (
                    <View style={styles.slide}>
                        <View style={[styles.imageContainer, { height: item.imageHeight }]}>
                            <Image 
                                source={item.image} 
                                style={{ width: width, height: item.imageHeight, resizeMode: 'contain' }} 
                            />
                        </View>
                        <View style={[styles.textContainer, { marginTop: item.textMarginTop }]}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.description}>{item.description}</Text>
                        </View>
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
                                <Ionicons name="chevron-forward" size={24} color="#CDDDFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
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
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    imageContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 0,
    },
    textContainer: {
        alignItems: 'flex-start',
        width: '100%',
        paddingHorizontal: SPACING.xl,
    },
    title: {
        fontSize: 50,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: SPACING.s,
        textAlign: 'left',
        lineHeight: 55,
    },
    description: {
        fontSize: 22,
        color: COLORS.text.secondary,
        textAlign: 'left',
        lineHeight: 30,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: width,
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING.xl,
        paddingTop: SPACING.l,
    },
    pagination: {
        flexDirection: 'row',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 6,
        backgroundColor: '#E0E0E0',
        marginRight: 6,
    },
    activeDot: {
        backgroundColor: '#0E1F43',
        width: 32,
    },
    nextButton: {
        width: 66,
        height: 66,
        borderRadius: 36,
        backgroundColor: '#0E1F43',
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
        backgroundColor: '#0E1F43',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default OnboardingScreen;
