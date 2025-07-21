/**
 * フォームコンポーネント
 * やさしいピンクデザインシステムベースのフォーム
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../design-system/colors-soft-pink';
import { spacingSystem } from '../../design-system/spacing-comfortable';
import { borderRadiusSystem } from '../../design-system/borders-rounded';
import { shadowSystem } from '../../design-system/shadows-soft-pink';
import Text from './Text';

const Form = ({ 
  children, 
  title, 
  description, 
  style, 
  ...props 
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  return (
    <View style={[styles.form, style]} {...props}>
      {title && (
        <Text variant="h3" style={[styles.title, { color: theme.colors.brand }]}>
          {title}
        </Text>
      )}
      {description && (
        <Text variant="bodySmall" style={[styles.description, { color: theme.colors.text.secondary }]}>
          {description}
        </Text>
      )}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

// フォームセクション
export const FormSection = ({ 
  children, 
  title, 
  description, 
  style, 
  ...props 
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  return (
    <View style={[styles.section, style]} {...props}>
      {title && (
        <Text variant="h4" style={[styles.sectionTitle, { color: theme.colors.brand }]}>
          {title}
        </Text>
      )}
      {description && (
        <Text variant="bodySmall" style={[styles.sectionDescription, { color: theme.colors.text.secondary }]}>
          {description}
        </Text>
      )}
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
};

// フォームフィールド
export const FormField = ({ 
  children, 
  label, 
  required = false, 
  error, 
  success, 
  helpText,
  style, 
  ...props 
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  return (
    <View style={[styles.field, style]} {...props}>
      {label && (
        <View style={styles.labelContainer}>
          <Text variant="bodySmall" style={[styles.label, { color: theme.colors.text.primary }]}>
            {label}
            {required && (
              <Text style={[styles.required, { color: theme.colors.error[500] }]}>
                {' *'}
              </Text>
            )}
          </Text>
        </View>
      )}
      {children}
      {error && (
        <Text variant="caption" style={[styles.errorText, { color: theme.colors.error[500] }]}>
          {error}
        </Text>
      )}
      {success && (
        <Text variant="caption" style={[styles.successText, { color: theme.colors.success[500] }]}>
          {success}
        </Text>
      )}
      {helpText && !error && !success && (
        <Text variant="caption" style={[styles.helpText, { color: theme.colors.text.tertiary }]}>
          {helpText}
        </Text>
      )}
    </View>
  );
};

// フォームグループ
export const FormGroup = ({ 
  children, 
  direction = 'vertical', 
  style, 
  ...props 
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  return (
    <View 
      style={[
        styles.group,
        direction === 'horizontal' && styles.groupHorizontal,
        style,
      ]} 
      {...props}
    >
      {children}
    </View>
  );
};

// フォームアクション
export const FormActions = ({ 
  children, 
  alignment = 'right', 
  style, 
  ...props 
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  const alignmentStyles = {
    left: { justifyContent: 'flex-start' },
    center: { justifyContent: 'center' },
    right: { justifyContent: 'flex-end' },
    stretch: { justifyContent: 'space-between' },
  };

  return (
    <View 
      style={[
        styles.actions,
        alignmentStyles[alignment],
        style,
      ]} 
      {...props}
    >
      {children}
    </View>
  );
};

// 検索フォーム
export const SearchForm = ({ 
  children,
  onSubmit,
  placeholder = "やさしく検索してください...",
  style,
  ...props 
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  return (
    <View style={[styles.searchForm, style]} {...props}>
      <View style={[
        styles.searchContainer,
        {
          backgroundColor: theme.colors.background.surface,
          borderColor: theme.colors.border.default,
          borderRadius: theme.borderRadius.component.input.search,
          ...theme.shadows.elevation[2],
        }
      ]}>
        {children}
      </View>
    </View>
  );
};

// フィルターフォーム
export const FilterForm = ({ 
  children,
  title = "フィルター",
  expanded = false,
  onToggle,
  style,
  ...props 
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  return (
    <View style={[styles.filterForm, style]} {...props}>
      <View style={[
        styles.filterHeader,
        {
          backgroundColor: theme.colors.background.pinkLight,
          borderColor: theme.colors.border.pink,
        }
      ]}>
        <Text variant="h4" style={{ color: theme.colors.brand }}>
          {title}
        </Text>
        {onToggle && (
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.brand }}
            onPress={onToggle}
          >
            {expanded ? '閉じる' : '開く'}
          </Text>
        )}
      </View>
      {expanded && (
        <View style={styles.filterContent}>
          {children}
        </View>
      )}
    </View>
  );
};

// ステップフォーム
export const StepForm = ({ 
  children,
  currentStep = 0,
  totalSteps,
  onStepChange,
  style,
  ...props 
}) => {
  const theme = {
    colors,
    spacing: spacingSystem,
    borderRadius: borderRadiusSystem,
    shadows: shadowSystem,
  };

  return (
    <View style={[styles.stepForm, style]} {...props}>
      <View style={styles.stepIndicator}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={[
              styles.stepDot,
              {
                backgroundColor: index <= currentStep 
                  ? theme.colors.brand 
                  : theme.colors.background.pinkLight,
                borderColor: index <= currentStep 
                  ? theme.colors.brand 
                  : theme.colors.border.pink,
              }
            ]}
          />
        ))}
      </View>
      <View style={styles.stepContent}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  
  title: {
    marginBottom: 8,
    fontWeight: '600',
  },
  
  description: {
    marginBottom: 24,
    lineHeight: 20,
  },
  
  content: {
    gap: 24,
  },
  
  // セクション
  section: {
    marginBottom: 32,
  },
  
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  
  sectionDescription: {
    marginBottom: 16,
    lineHeight: 20,
  },
  
  sectionContent: {
    gap: 24,
  },
  
  // フィールド
  field: {
    marginBottom: 24,
  },
  
  labelContainer: {
    marginBottom: 8,
  },
  
  label: {
    fontWeight: '500',
  },
  
  required: {
    fontWeight: '600',
  },
  
  errorText: {
    marginTop: 8,
    fontWeight: '500',
  },
  
  successText: {
    marginTop: 8,
    fontWeight: '500',
  },
  
  helpText: {
    marginTop: 8,
  },
  
  // グループ
  group: {
    gap: 16,
  },
  
  groupHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // アクション
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  
  // 検索フォーム
  searchForm: {
    padding: 16,
  },
  
  searchContainer: {
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // フィルターフォーム
  filterForm: {
    borderWidth: 1,
    borderColor: '#fdeaeb',
    borderRadius: 16,
    marginBottom: 16,
  },
  
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fdeaeb',
  },
  
  filterContent: {
    padding: 16,
    gap: 16,
  },
  
  // ステップフォーム
  stepForm: {
    padding: 24,
  },
  
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  
  stepContent: {
    flex: 1,
  },
});

// 名前付きエクスポート
export { FormSection, FormField, FormGroup, FormActions, SearchForm, FilterForm, StepForm };

// デフォルトエクスポート
export default Form;