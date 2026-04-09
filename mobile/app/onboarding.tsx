import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🚀',
    title: 'Generate DMs that actually get replies',
    subtitle: 'AI-powered messages crafted to convert strangers into real opportunities.',
    gradient: ['#7B61FF', '#5B9CFF'] as const,
  },
  {
    emoji: '⚡',
    title: 'Close deals faster',
    subtitle: 'Stop staring at a blank screen. Get 3 high-converting variations in seconds.',
    gradient: ['#5B9CFF', '#06B6D4'] as const,
  },
  {
    emoji: '🎯',
    title: 'Built for creators & closers',
    subtitle: 'Used by entrepreneurs, freelancers, and sales pros who want more replies daily.',
    gradient: ['#8B5CF6', '#7B61FF'] as const,
  },
];

export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const dotAnims = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  const goToPage = (n: number) => {
    scrollRef.current?.scrollTo({ x: n * width, animated: true });
  };

  const handleScroll = (e: any) => {
    const newPage = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newPage !== page) {
      setPage(newPage);
      dotAnims.forEach((anim, i) => {
        Animated.timing(anim, {
          toValue: i === newPage ? 1 : 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }
  };

  const handleStart = async () => {
    await SecureStore.setItemAsync('onboarding_seen', '1');
    router.replace('/auth');
  };

  const handleSkip = async () => {
    await SecureStore.setItemAsync('onboarding_seen', '1');
    router.replace('/auth');
  };

  return (
    <View style={styles.container}>
      {/* Skip */}
      <TouchableOpacity style={styles.skip} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scroll}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={styles.slide}>
            {/* Glow blob */}
            <View style={[styles.glow, { backgroundColor: slide.gradient[0] }]} />

            {/* Emoji illustration */}
            <View style={styles.emojiWrap}>
              <LinearGradient
                colors={slide.gradient}
                style={styles.emojiCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.emoji}>{slide.emoji}</Text>
              </LinearGradient>
            </View>

            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goToPage(i)}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    width: dotAnims[i].interpolate({ inputRange: [0, 1], outputRange: [8, 24] }),
                    backgroundColor: dotAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: ['#334155', '#7B61FF'],
                    }),
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA */}
        {page === SLIDES.length - 1 ? (
          <TouchableOpacity onPress={handleStart} activeOpacity={0.85} style={styles.btnOuter}>
            <LinearGradient
              colors={['#7B61FF', '#5B9CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>Get Started →</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => goToPage(page + 1)}
            activeOpacity={0.85}
            style={styles.btnOuter}
          >
            <LinearGradient
              colors={['#7B61FF', '#5B9CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>Next →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  skip: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: { color: '#475569', fontSize: 15, fontWeight: '500' },
  scroll: { flex: 1 },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingTop: 100,
    paddingBottom: 180,
  },
  glow: {
    position: 'absolute',
    top: '15%',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.07,
    alignSelf: 'center',
  },
  emojiWrap: { marginBottom: 40 },
  emojiCircle: {
    width: 100,
    height: 100,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  emoji: { fontSize: 46 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 26,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 24,
  },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  btnOuter: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  btn: { paddingVertical: 18, alignItems: 'center', borderRadius: 16 },
  btnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
});
