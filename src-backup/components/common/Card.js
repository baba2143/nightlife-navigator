import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../styles';

const Card = ({
  children,
  title,
  subtitle,
  variant = 'default',
  style,
  titleStyle,
  subtitleStyle,
  contentStyle,
  ...props
}) => {
  const getCardStyle = () => {
    const baseStyle = [styles.card];
    
    switch (variant) {
      case 'neon':
        baseStyle.push(styles.cardNeon);
        break;
      case 'glow':
        baseStyle.push(styles.cardGlow);
        break;
      case 'accent':
        baseStyle.push(styles.cardAccent);
        break;
      default:
        baseStyle.push(styles.cardDefault);
    }
    
    return baseStyle;
  };

  const getTitleStyle = () => {
    const baseStyle = [styles.title];
    
    switch (variant) {
      case 'neon':
        baseStyle.push(styles.titleNeon);
        break;
      case 'glow':
        baseStyle.push(styles.titleGlow);
        break;
      case 'accent':
        baseStyle.push(styles.titleAccent);
        break;
      default:
        baseStyle.push(styles.titleDefault);
    }
    
    return baseStyle;
  };

  const getSubtitleStyle = () => {
    const baseStyle = [styles.subtitle];
    
    switch (variant) {
      case 'neon':
        baseStyle.push(styles.subtitleNeon);
        break;
      case 'glow':
        baseStyle.push(styles.subtitleGlow);
        break;
      case 'accent':
        baseStyle.push(styles.subtitleAccent);
        break;
      default:
        baseStyle.push(styles.subtitleDefault);
    }
    
    return baseStyle;
  };

  return (
    <View style={[getCardStyle(), style]} {...props}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text style={[getTitleStyle(), titleStyle]}>{title}</Text>
          )}
          {subtitle && (
            <Text style={[getSubtitleStyle(), subtitleStyle]}>{subtitle}</Text>
          )}
        </View>
      )}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // カードベース
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    backgroundColor: colors.surface
  },
  
  // デフォルトカード
  cardDefault: {
    borderColor: colors.border,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  
  // ネオンカード
  cardNeon: {
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4
  },
  
  // グローカード
  cardGlow: {
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  
  // アクセントカード
  cardAccent: {
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4
  },
  
  // ヘッダー
  header: {
    marginBottom: spacing.sm
  },
  
  // タイトル
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs
  },
  
  titleDefault: {
    color: colors.text
  },
  
  titleNeon: {
    color: colors.secondary
  },
  
  titleGlow: {
    color: colors.secondary
  },
  
  titleAccent: {
    color: colors.accent
  },
  
  // サブタイトル
  subtitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium
  },
  
  subtitleDefault: {
    color: colors.textSecondary
  },
  
  subtitleNeon: {
    color: colors.textSecondary
  },
  
  subtitleGlow: {
    color: colors.textSecondary
  },
  
  subtitleAccent: {
    color: colors.textSecondary
  },
  
  // コンテンツ
  content: {
    flex: 1
  }
});

export default Card; 