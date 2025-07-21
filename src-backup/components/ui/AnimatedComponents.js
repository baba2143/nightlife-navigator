/**
 * アニメーションコンポーネント
 * サイバーパンク風のマイクロインタラクションとアニメーション
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View, StyleSheet } from 'react-native';
import { defaultTheme } from '../../design-system/theme';
import { useAccessibility, getAccessibleAnimation } from './AccessibilityUtils';

// ネオンパルスアニメーション
export const NeonPulse = ({
  children,
  color = 'blue',
  intensity = 'medium',
  duration = 2000,
  autoStart = true,
  style,
  ...props
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const accessibility = useAccessibility();
  const theme = defaultTheme;

  const getColorConfig = () => {
    const colors = {
      blue: theme.colors.primary[400],
      pink: theme.colors.secondary[400],
      green: theme.colors.accent[400],
      white: '#ffffff',
    };
    return colors[color] || colors.blue;
  };

  const getIntensityConfig = () => {
    const intensities = {
      low: { from: 0.3, to: 0.7 },
      medium: { from: 0.4, to: 0.9 },
      high: { from: 0.5, to: 1.0 },
    };
    return intensities[intensity] || intensities.medium;
  };

  useEffect(() => {
    if (!autoStart) return;

    const animation = getAccessibleAnimation(
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: duration / 2,
            easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: duration / 2,
            easing: Easing.bezier(0.4, 0.0, 0.6, 1.0),
            useNativeDriver: false,
          }),
        ])
      ),
      accessibility
    );

    animation.start();

    return () => animation.stop();
  }, [autoStart, duration, accessibility]);

  const intensityConfig = getIntensityConfig();
  const shadowColor = getColorConfig();

  const animatedStyle = {
    shadowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [intensityConfig.from, intensityConfig.to],
    }),
    shadowRadius: pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [5, 20],
    }),
    elevation: pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [2, 8],
    }),
  };

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
};

// グリッチエフェクト
export const GlitchEffect = ({
  children,
  intensity = 'medium',
  frequency = 3000,
  autoStart = true,
  style,
  ...props
}) => {
  const glitchAnim = useRef(new Animated.Value(0)).current;
  const [isGlitching, setIsGlitching] = useState(false);
  const accessibility = useAccessibility();

  const getIntensityConfig = () => {
    const intensities = {
      low: { maxOffset: 2, duration: 100 },
      medium: { maxOffset: 4, duration: 150 },
      high: { maxOffset: 8, duration: 200 },
    };
    return intensities[intensity] || intensities.medium;
  };

  useEffect(() => {
    if (!autoStart) return;

    const triggerGlitch = () => {
      if (accessibility.isReduceMotionEnabled) return;

      setIsGlitching(true);
      const intensityConfig = getIntensityConfig();

      const animation = Animated.sequence([
        Animated.timing(glitchAnim, {
          toValue: 1,
          duration: intensityConfig.duration / 4,
          useNativeDriver: true,
        }),
        Animated.timing(glitchAnim, {
          toValue: -1,
          duration: intensityConfig.duration / 4,
          useNativeDriver: true,
        }),
        Animated.timing(glitchAnim, {
          toValue: 0.5,
          duration: intensityConfig.duration / 4,
          useNativeDriver: true,
        }),
        Animated.timing(glitchAnim, {
          toValue: 0,
          duration: intensityConfig.duration / 4,
          useNativeDriver: true,
        }),
      ]);

      animation.start(() => {
        setIsGlitching(false);
      });
    };

    const interval = setInterval(triggerGlitch, frequency);
    return () => clearInterval(interval);
  }, [autoStart, frequency, accessibility.isReduceMotionEnabled]);

  const intensityConfig = getIntensityConfig();

  const animatedStyle = {
    transform: [
      {
        translateX: glitchAnim.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-intensityConfig.maxOffset, 0, intensityConfig.maxOffset],
        }),
      },
      {
        translateY: glitchAnim.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [intensityConfig.maxOffset, 0, -intensityConfig.maxOffset],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
};

// フェードイン・アウト
export const FadeInOut = ({
  children,
  visible = true,
  duration = 300,
  delay = 0,
  onAnimationComplete,
  style,
  ...props
}) => {
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const accessibility = useAccessibility();

  useEffect(() => {
    const animation = getAccessibleAnimation(
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration,
        delay,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
      }),
      accessibility
    );

    animation.start(onAnimationComplete);
  }, [visible, duration, delay, accessibility]);

  const animatedStyle = {
    opacity: fadeAnim,
  };

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
};

// スケールアニメーション
export const ScaleAnimation = ({
  children,
  scale = 1,
  duration = 300,
  delay = 0,
  easing = 'spring',
  onAnimationComplete,
  style,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const accessibility = useAccessibility();

  useEffect(() => {
    let animation;

    if (easing === 'spring') {
      animation = getAccessibleAnimation(
        Animated.spring(scaleAnim, {
          toValue: scale,
          delay,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        accessibility
      );
    } else {
      animation = getAccessibleAnimation(
        Animated.timing(scaleAnim, {
          toValue: scale,
          duration,
          delay,
          easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
          useNativeDriver: true,
        }),
        accessibility
      );
    }

    animation.start(onAnimationComplete);
  }, [scale, duration, delay, easing, accessibility]);

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
  };

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
};

// スライドアニメーション
export const SlideAnimation = ({
  children,
  direction = 'up',
  distance = 100,
  duration = 300,
  delay = 0,
  visible = true,
  onAnimationComplete,
  style,
  ...props
}) => {
  const slideAnim = useRef(new Animated.Value(visible ? 0 : distance)).current;
  const accessibility = useAccessibility();

  useEffect(() => {
    const animation = getAccessibleAnimation(
      Animated.timing(slideAnim, {
        toValue: visible ? 0 : distance,
        duration,
        delay,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      accessibility
    );

    animation.start(onAnimationComplete);
  }, [visible, distance, duration, delay, accessibility]);

  const getTransform = () => {
    switch (direction) {
      case 'up':
        return [{ translateY: slideAnim }];
      case 'down':
        return [{ translateY: slideAnim.interpolate({
          inputRange: [0, distance],
          outputRange: [0, -distance],
        }) }];
      case 'left':
        return [{ translateX: slideAnim }];
      case 'right':
        return [{ translateX: slideAnim.interpolate({
          inputRange: [0, distance],
          outputRange: [0, -distance],
        }) }];
      default:
        return [{ translateY: slideAnim }];
    }
  };

  const animatedStyle = {
    transform: getTransform(),
  };

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
};

// 回転アニメーション
export const RotateAnimation = ({
  children,
  duration = 1000,
  clockwise = true,
  autoStart = true,
  style,
  ...props
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const accessibility = useAccessibility();

  useEffect(() => {
    if (!autoStart) return;

    const animation = getAccessibleAnimation(
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      accessibility
    );

    animation.start();

    return () => animation.stop();
  }, [autoStart, duration, accessibility]);

  const animatedStyle = {
    transform: [
      {
        rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: clockwise ? ['0deg', '360deg'] : ['360deg', '0deg'],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
};

// ステガードアニメーション（順次実行）
export const StaggeredAnimation = ({
  children,
  staggerDelay = 100,
  animationType = 'fadeIn',
  animationProps = {},
  style,
  ...props
}) => {
  const childrenArray = React.Children.toArray(children);

  const renderAnimatedChild = (child, index) => {
    const delay = index * staggerDelay;

    switch (animationType) {
      case 'fadeIn':
        return (
          <FadeInOut
            key={index}
            delay={delay}
            {...animationProps}
          >
            {child}
          </FadeInOut>
        );
      case 'scale':
        return (
          <ScaleAnimation
            key={index}
            delay={delay}
            {...animationProps}
          >
            {child}
          </ScaleAnimation>
        );
      case 'slide':
        return (
          <SlideAnimation
            key={index}
            delay={delay}
            {...animationProps}
          >
            {child}
          </SlideAnimation>
        );
      default:
        return child;
    }
  };

  return (
    <View style={style} {...props}>
      {childrenArray.map(renderAnimatedChild)}
    </View>
  );
};

// フリッカーエフェクト（点滅）
export const FlickerEffect = ({
  children,
  frequency = 150,
  intensity = 0.3,
  autoStart = true,
  style,
  ...props
}) => {
  const flickerAnim = useRef(new Animated.Value(1)).current;
  const accessibility = useAccessibility();

  useEffect(() => {
    if (!autoStart || accessibility.isReduceMotionEnabled) return;

    const flicker = () => {
      Animated.sequence([
        Animated.timing(flickerAnim, {
          toValue: intensity,
          duration: frequency / 4,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: 1,
          duration: frequency / 4,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: intensity,
          duration: frequency / 8,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: 1,
          duration: frequency / 2,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // ランダムな間隔で次のフリッカーをトリガー
        setTimeout(flicker, Math.random() * 3000 + 1000);
      });
    };

    flicker();
  }, [autoStart, frequency, intensity, accessibility.isReduceMotionEnabled]);

  const animatedStyle = {
    opacity: flickerAnim,
  };

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
};

// パララックスエフェクト
export const ParallaxEffect = ({
  children,
  speed = 0.5,
  scrollY,
  style,
  ...props
}) => {
  const animatedStyle = scrollY ? {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, 1000],
          outputRange: [0, 1000 * speed],
          extrapolate: 'clamp',
        }),
      },
    ],
  } : {};

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
};

// カスタムアニメーションフック
export const useCustomAnimation = (config = {}) => {
  const animValue = useRef(new Animated.Value(config.initialValue || 0)).current;
  const accessibility = useAccessibility();

  const animate = (toValue, options = {}) => {
    const animation = getAccessibleAnimation(
      Animated.timing(animValue, {
        toValue,
        duration: options.duration || 300,
        easing: options.easing || Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: options.useNativeDriver !== false,
        ...options,
      }),
      accessibility
    );

    return new Promise((resolve) => {
      animation.start(resolve);
    });
  };

  const spring = (toValue, options = {}) => {
    const animation = getAccessibleAnimation(
      Animated.spring(animValue, {
        toValue,
        tension: options.tension || 100,
        friction: options.friction || 8,
        useNativeDriver: options.useNativeDriver !== false,
        ...options,
      }),
      accessibility
    );

    return new Promise((resolve) => {
      animation.start(resolve);
    });
  };

  return {
    animValue,
    animate,
    spring,
  };
};

const styles = StyleSheet.create({
  // 必要に応じてスタイルを追加
});

// 名前付きエクスポート
export {
  NeonPulse,
  GlitchEffect,
  FadeInOut,
  ScaleAnimation,
  SlideAnimation,
  RotateAnimation,
  StaggeredAnimation,
  FlickerEffect,
  ParallaxEffect,
  useCustomAnimation,
};

// デフォルトエクスポートはなし（名前付きエクスポートのみ）