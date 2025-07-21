/**
 * アニメーションコンポーネント
 * やさしいピンクデザインシステムベースのアニメーション
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';

// フェードイン・アウト
export const FadeIn = ({
  children,
  duration = 500,
  delay = 0,
  style,
  ...props
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, duration, delay]);

  return (
    <Animated.View
      style={[
        { opacity: fadeAnim },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

export const FadeOut = ({
  children,
  duration = 500,
  delay = 0,
  onComplete,
  style,
  ...props
}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration,
      delay,
      useNativeDriver: true,
    }).start(onComplete);
  }, [fadeAnim, duration, delay, onComplete]);

  return (
    <Animated.View
      style={[
        { opacity: fadeAnim },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

// スライドアニメーション
export const SlideIn = ({
  children,
  direction = 'left',
  distance = 100,
  duration = 500,
  delay = 0,
  style,
  ...props
}) => {
  const slideAnim = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [slideAnim, duration, delay]);

  const getTransform = () => {
    switch (direction) {
      case 'left':
        return [{ translateX: slideAnim }];
      case 'right':
        return [{ translateX: Animated.multiply(slideAnim, -1) }];
      case 'up':
        return [{ translateY: slideAnim }];
      case 'down':
        return [{ translateY: Animated.multiply(slideAnim, -1) }];
      default:
        return [{ translateX: slideAnim }];
    }
  };

  return (
    <Animated.View
      style={[
        { transform: getTransform() },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

// スケールアニメーション
export const ScaleIn = ({
  children,
  fromScale = 0.8,
  toScale = 1,
  duration = 500,
  delay = 0,
  style,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(fromScale)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: toScale,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim, fromScale, toScale, duration, delay]);

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

// バウンスアニメーション
export const Bounce = ({
  children,
  intensity = 0.3,
  duration = 500,
  delay = 0,
  style,
  ...props
}) => {
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1 - intensity,
        duration: duration / 2,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 200,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  }, [bounceAnim, intensity, duration, delay]);

  return (
    <Animated.View
      style={[
        { transform: [{ scale: bounceAnim }] },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

// ローテーションアニメーション
export const Rotate = ({
  children,
  duration = 1000,
  repeat = true,
  style,
  ...props
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(rotateAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    });

    if (repeat) {
      Animated.loop(animation).start();
    } else {
      animation.start();
    }
  }, [rotateAnim, duration, repeat]);

  return (
    <Animated.View
      style={[
        {
          transform: [
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

// パルスアニメーション
export const Pulse = ({
  children,
  minScale = 0.95,
  maxScale = 1.05,
  duration = 1000,
  style,
  ...props
}) => {
  const pulseAnim = useRef(new Animated.Value(minScale)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: maxScale,
        duration: duration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: minScale,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(animation).start();
  }, [pulseAnim, minScale, maxScale, duration]);

  return (
    <Animated.View
      style={[
        { transform: [{ scale: pulseAnim }] },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

// シェイクアニメーション
export const Shake = ({
  children,
  intensity = 10,
  duration = 500,
  style,
  ...props
}) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: intensity,
        duration: duration / 8,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -intensity,
        duration: duration / 8,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: intensity,
        duration: duration / 8,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -intensity,
        duration: duration / 8,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    shake();
  }, []);

  return (
    <Animated.View
      style={[
        { transform: [{ translateX: shakeAnim }] },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

// やさしいピンクグロウアニメーション
export const PinkGlow = ({
  children,
  intensity = 0.3,
  duration = 1500,
  style,
  ...props
}) => {
  const glowAnim = useRef(new Animated.Value(0)).current;

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: duration / 2,
        useNativeDriver: false,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: duration / 2,
        useNativeDriver: false,
      }),
    ]);

    Animated.loop(animation).start();
  }, [glowAnim, duration]);

  return (
    <Animated.View
      style={[
        {
          shadowColor: theme.colors.brand,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.1, intensity],
          }),
          shadowRadius: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [3, 10],
          }),
          elevation: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 6],
          }),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

// ローディングスピナー
export const LoadingSpinner = ({
  size = 'md',
  color = 'brand',
  style,
  ...props
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const getSizeValue = () => {
    const sizes = {
      sm: 20,
      md: 30,
      lg: 40,
      xl: 50,
    };
    return sizes[size] || sizes.md;
  };

  const getColor = () => {
    return theme.colors[color] || theme.colors.brand;
  };

  useEffect(() => {
    const animation = Animated.timing(spinAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    });

    Animated.loop(animation).start();
  }, [spinAnim]);

  const sizeValue = getSizeValue();

  return (
    <Animated.View
      style={[
        styles.loadingSpinner,
        {
          width: sizeValue,
          height: sizeValue,
          borderColor: getColor(),
          transform: [
            {
              rotate: spinAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
        style,
      ]}
      {...props}
    />
  );
};

// プログレスバー
export const ProgressBar = ({
  progress = 0,
  duration = 1000,
  backgroundColor = 'border',
  fillColor = 'brand',
  height = 8,
  style,
  ...props
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration,
      useNativeDriver: false,
    }).start();
  }, [progressAnim, progress, duration]);

  const getBackgroundColor = () => {
    return theme.colors.border[backgroundColor] || theme.colors.border.light;
  };

  const getFillColor = () => {
    return theme.colors[fillColor] || theme.colors.brand;
  };

  return (
    <View
      style={[
        styles.progressBar,
        {
          backgroundColor: getBackgroundColor(),
          height,
          borderRadius: height / 2,
        },
        style,
      ]}
      {...props}
    >
      <Animated.View
        style={[
          styles.progressFill,
          {
            backgroundColor: getFillColor(),
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
            height,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

// スケルトンローディング
export const Skeleton = ({
  width = '100%',
  height = 20,
  style,
  ...props
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(shimmerAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]);

    Animated.loop(animation).start();
  }, [shimmerAnim]);

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: theme.borderRadius.borderRadius.sm,
        },
        style,
      ]}
      {...props}
    >
      <Animated.View
        style={[
          styles.skeletonShimmer,
          {
            backgroundColor: shimmerAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [theme.colors.background.pinkLight, theme.colors.background.pinkSoft],
            }),
            borderRadius: theme.borderRadius.borderRadius.sm,
          },
        ]}
      />
    </View>
  );
};

// 共通のタイミング関数
export const timing = (value, config) => {
  return Animated.timing(value, {
    useNativeDriver: true,
    ...config,
  });
};

export const spring = (value, config) => {
  return Animated.spring(value, {
    useNativeDriver: true,
    ...config,
  });
};

export const sequence = (animations) => {
  return Animated.sequence(animations);
};

export const parallel = (animations) => {
  return Animated.parallel(animations);
};

export const loop = (animation, config) => {
  return Animated.loop(animation, config);
};

const styles = StyleSheet.create({
  loadingSpinner: {
    borderWidth: 3,
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderRadius: 50,
  },
  
  progressBar: {
    overflow: 'hidden',
  },
  
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  
  skeleton: {
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

// 名前付きエクスポート
export {
  FadeIn,
  FadeOut,
  SlideIn,
  ScaleIn,
  Bounce,
  Rotate,
  Pulse,
  Shake,
  PinkGlow,
  LoadingSpinner,
  ProgressBar,
  Skeleton,
  timing,
  spring,
  sequence,
  parallel,
  loop,
};

// デフォルトエクスポート
export default {
  FadeIn,
  FadeOut,
  SlideIn,
  ScaleIn,
  Bounce,
  Rotate,
  Pulse,
  Shake,
  PinkGlow,
  LoadingSpinner,
  ProgressBar,
  Skeleton,
  timing,
  spring,
  sequence,
  parallel,
  loop,
};