/**
 * テーマセレクターコンポーネント
 * 複数のテーマバリアント切り替え機能
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { defaultTheme, neonBlueTheme, neonPinkTheme, cyberpunkGreenTheme } from '../../design-system/theme';
import { useTheme } from './index';
import Text from './Text';
import Modal from './Modal';
import Button from './Button';
import Card from './Card';
import Icon from './Icon';

const THEME_OPTIONS = [
  {
    id: 'default',
    name: 'デフォルト',
    description: 'サイバーパンクミックス',
    theme: defaultTheme,
    primaryColor: '#00adff',
    secondaryColor: '#e834ff',
    accentColor: '#34ff74',
  },
  {
    id: 'neonBlue',
    name: 'ネオンブルー',
    description: 'ブルー中心のクール',
    theme: neonBlueTheme,
    primaryColor: '#00adff',
    secondaryColor: '#4dc7ff',
    accentColor: '#34ff74',
  },
  {
    id: 'neonPink',
    name: 'ネオンピンク',
    description: 'ピンク中心のビビッド',
    theme: neonPinkTheme,
    primaryColor: '#e834ff',
    secondaryColor: '#00adff',
    accentColor: '#34ff74',
  },
  {
    id: 'cyberpunkGreen',
    name: 'サイバーグリーン',
    description: 'グリーン中心のマトリックス',
    theme: cyberpunkGreenTheme,
    primaryColor: '#34ff74',
    secondaryColor: '#00adff',
    accentColor: '#e834ff',
  },
];

const ThemeSelector = ({
  visible = false,
  onClose,
  style,
  ...props
}) => {
  const { theme, setTheme } = useTheme();
  const [selectedThemeId, setSelectedThemeId] = useState('default');

  const handleThemeSelect = (themeOption) => {
    setSelectedThemeId(themeOption.id);
    setTheme(themeOption.theme);
  };

  const getCurrentTheme = () => {
    return THEME_OPTIONS.find(option => option.id === selectedThemeId) || THEME_OPTIONS[0];
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="テーマ選択"
      size="md"
      style={style}
      {...props}
    >
      <View style={styles.container}>
        <Text variant="bodySmall" color="secondary" style={styles.description}>
          お好みのテーマを選択してください
        </Text>
        
        <View style={styles.themeGrid}>
          {THEME_OPTIONS.map((themeOption) => (
            <ThemeOption
              key={themeOption.id}
              themeOption={themeOption}
              isSelected={selectedThemeId === themeOption.id}
              onSelect={() => handleThemeSelect(themeOption)}
            />
          ))}
        </View>
        
        <View style={styles.footer}>
          <Button
            variant="primary"
            onPress={onClose}
            style={styles.closeButton}
          >
            完了
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const ThemeOption = ({ themeOption, isSelected, onSelect }) => {
  const currentTheme = useTheme().theme;
  
  return (
    <TouchableOpacity
      style={[
        styles.themeOption,
        isSelected && styles.themeOptionSelected,
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <Card
        elevated={isSelected}
        neonGlow={isSelected}
        style={[
          styles.themeCard,
          isSelected && { borderColor: currentTheme.colors.primary[500] },
        ]}
      >
        {/* カラープレビュー */}
        <View style={styles.colorPreview}>
          <View style={[
            styles.colorSwatch,
            styles.primarySwatch,
            { backgroundColor: themeOption.primaryColor },
          ]} />
          <View style={[
            styles.colorSwatch,
            styles.secondarySwatch,
            { backgroundColor: themeOption.secondaryColor },
          ]} />
          <View style={[
            styles.colorSwatch,
            styles.accentSwatch,
            { backgroundColor: themeOption.accentColor },
          ]} />
        </View>
        
        {/* テーマ情報 */}
        <View style={styles.themeInfo}>
          <Text variant="label" style={styles.themeName}>
            {themeOption.name}
          </Text>
          <Text variant="caption" color="secondary" style={styles.themeDescription}>
            {themeOption.description}
          </Text>
        </View>
        
        {/* 選択インジケーター */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Icon
              name="check"
              size={16}
              variant="primary"
              neonGlow={true}
            />
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

// テーマプレビューコンポーネント
export const ThemePreview = ({ themeOption, compact = false }) => {
  if (compact) {
    return (
      <View style={styles.compactPreview}>
        <View style={[
          styles.compactColorSwatch,
          { backgroundColor: themeOption.primaryColor },
        ]} />
        <Text variant="caption" numberOfLines={1}>
          {themeOption.name}
        </Text>
      </View>
    );
  }

  return (
    <Card style={styles.previewCard}>
      <View style={styles.previewHeader}>
        <Text variant="h6">{themeOption.name}</Text>
        <View style={styles.previewColors}>
          <View style={[
            styles.previewColorDot,
            { backgroundColor: themeOption.primaryColor },
          ]} />
          <View style={[
            styles.previewColorDot,
            { backgroundColor: themeOption.secondaryColor },
          ]} />
          <View style={[
            styles.previewColorDot,
            { backgroundColor: themeOption.accentColor },
          ]} />
        </View>
      </View>
      <Text variant="caption" color="secondary">
        {themeOption.description}
      </Text>
    </Card>
  );
};

// テーマ切り替えボタン
export const ThemeToggleButton = ({ onPress, style, ...props }) => {
  const [showSelector, setShowSelector] = useState(false);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setShowSelector(true);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.toggleButton, style]}
        onPress={handlePress}
        activeOpacity={0.8}
        {...props}
      >
        <Icon
          name="settings"
          size={24}
          variant="primary"
          neonGlow={true}
        />
      </TouchableOpacity>
      
      <ThemeSelector
        visible={showSelector}
        onClose={() => setShowSelector(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  
  description: {
    textAlign: 'center',
    marginBottom: 20,
  },
  
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  
  themeOption: {
    width: '48%',
    aspectRatio: 1.2,
  },
  
  themeOptionSelected: {
    // 選択時のスタイル
  },
  
  themeCard: {
    flex: 1,
    position: 'relative',
    padding: 12,
  },
  
  colorPreview: {
    flexDirection: 'row',
    marginBottom: 12,
    height: 24,
    borderRadius: 4,
    overflow: 'hidden',
  },
  
  colorSwatch: {
    flex: 1,
  },
  
  primarySwatch: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  
  secondarySwatch: {
    // 中央
  },
  
  accentSwatch: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  
  themeInfo: {
    flex: 1,
  },
  
  themeName: {
    marginBottom: 4,
  },
  
  themeDescription: {
    lineHeight: 16,
  },
  
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  footer: {
    alignItems: 'center',
  },
  
  closeButton: {
    minWidth: 120,
  },
  
  compactPreview: {
    alignItems: 'center',
    gap: 4,
  },
  
  compactColorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  
  previewCard: {
    padding: 12,
  },
  
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  previewColors: {
    flexDirection: 'row',
    gap: 4,
  },
  
  previewColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  toggleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});

// 名前付きエクスポート
export { ThemePreview, ThemeToggleButton, THEME_OPTIONS };

// デフォルトエクスポート
export default ThemeSelector;