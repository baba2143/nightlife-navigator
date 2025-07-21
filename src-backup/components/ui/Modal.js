/**
 * モーダルコンポーネント
 * デザインシステムベースのネオン効果付きモーダル
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Modal as RNModal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { defaultTheme } from '../../design-system/theme';
import Text from './Text';
import Button from './Button';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Modal = ({
  visible = false,
  onClose,
  title,
  children,
  size = 'md',
  centered = true,
  closable = true,
  maskClosable = true,
  footer,
  confirmText = '確認',
  cancelText = 'キャンセル',
  onConfirm,
  onCancel,
  loading = false,
  neonGlow = false,
  animationType = 'scale',
  style,
  contentStyle,
  headerStyle,
  footerStyle,
  ...props
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  const theme = defaultTheme;

  useEffect(() => {
    if (visible) {
      StatusBar.setBarStyle('light-content');
      showModal();
    } else {
      hideModal();
    }
  }, [visible]);

  const showModal = () => {
    const animations = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ];

    if (animationType === 'scale') {
      animations.push(
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      );
    } else if (animationType === 'slide') {
      animations.push(
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      );
    }

    Animated.parallel(animations).start();
  };

  const hideModal = () => {
    const animations = [
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ];

    if (animationType === 'scale') {
      animations.push(
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        })
      );
    } else if (animationType === 'slide') {
      animations.push(
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        })
      );
    }

    Animated.parallel(animations).start();
  };

  const handleClose = () => {
    if (!closable) return;
    onClose?.();
  };

  const handleMaskPress = () => {
    if (!maskClosable) return;
    handleClose();
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      handleClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      handleClose();
    }
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: {
        width: Math.min(screenWidth * 0.8, 400),
        maxHeight: screenHeight * 0.6,
      },
      md: {
        width: Math.min(screenWidth * 0.9, 500),
        maxHeight: screenHeight * 0.8,
      },
      lg: {
        width: Math.min(screenWidth * 0.95, 700),
        maxHeight: screenHeight * 0.9,
      },
      full: {
        width: screenWidth,
        height: screenHeight,
        borderRadius: 0,
      },
    };

    return sizes[size] || sizes.md;
  };

  const getNeonGlowStyles = () => {
    if (!neonGlow) return {};

    return {
      shadowColor: theme.colors.primary[400],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 20,
      elevation: 10,
    };
  };

  const sizeStyles = getSizeStyles();
  const neonGlowStyles = getNeonGlowStyles();

  const maskStyles = [
    styles.mask,
    {
      backgroundColor: theme.colors.background.modalOverlay,
    },
  ];

  const containerStyles = [
    styles.container,
    centered && styles.centered,
  ];

  const contentStyles = [
    styles.content,
    {
      backgroundColor: theme.colors.background.surface,
      borderColor: theme.colors.border.default,
      ...sizeStyles,
      ...neonGlowStyles,
    },
    contentStyle,
  ];

  const headerStyles = [
    styles.header,
    {
      borderBottomColor: theme.colors.border.light,
    },
    headerStyle,
  ];

  const footerStyles = [
    styles.footer,
    {
      borderTopColor: theme.colors.border.light,
    },
    footerStyle,
  ];

  const getAnimatedStyle = () => {
    if (animationType === 'scale') {
      return {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      };
    } else if (animationType === 'slide') {
      return {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      };
    }
    
    return {
      opacity: fadeAnim,
    };
  };

  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      {...props}
    >
      <SafeAreaView style={styles.safeArea}>
        <TouchableWithoutFeedback onPress={handleMaskPress}>
          <Animated.View style={[maskStyles, { opacity: fadeAnim }]}>
            <TouchableWithoutFeedback>
              <View style={containerStyles}>
                <Animated.View style={[contentStyles, getAnimatedStyle(), style]}>
                  {/* ヘッダー */}
                  {(title || closable) && (
                    <View style={headerStyles}>
                      {title && (
                        <Text variant="h4" numberOfLines={1} style={styles.title}>
                          {title}
                        </Text>
                      )}
                      {closable && (
                        <TouchableOpacity
                          style={styles.closeButton}
                          onPress={handleClose}
                        >
                          <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* コンテンツ */}
                  <View style={styles.body}>
                    {children}
                  </View>

                  {/* フッター */}
                  {(footer || onConfirm || onCancel) && (
                    <View style={footerStyles}>
                      {footer || (
                        <View style={styles.defaultFooter}>
                          {onCancel && (
                            <Button
                              variant="outline"
                              size="md"
                              onPress={handleCancel}
                              style={styles.footerButton}
                            >
                              {cancelText}
                            </Button>
                          )}
                          {onConfirm && (
                            <Button
                              variant="primary"
                              size="md"
                              onPress={handleConfirm}
                              loading={loading}
                              style={styles.footerButton}
                            >
                              {confirmText}
                            </Button>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </Animated.View>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </RNModal>
  );
};

// 特殊なモーダルコンポーネント
export const ConfirmModal = ({
  title = '確認',
  message,
  confirmText = '確認',
  cancelText = 'キャンセル',
  confirmVariant = 'primary',
  ...props
}) => {
  return (
    <Modal
      {...props}
      title={title}
      size="sm"
      onConfirm={props.onConfirm}
      onCancel={props.onCancel}
      confirmText={confirmText}
      cancelText={cancelText}
    >
      <Text variant="body" style={styles.confirmMessage}>
        {message}
      </Text>
    </Modal>
  );
};

export const AlertModal = ({
  title = 'お知らせ',
  message,
  confirmText = 'OK',
  ...props
}) => {
  return (
    <Modal
      {...props}
      title={title}
      size="sm"
      onConfirm={props.onClose}
      confirmText={confirmText}
      maskClosable={false}
    >
      <Text variant="body" style={styles.alertMessage}>
        {message}
      </Text>
    </Modal>
  );
};

export const LoadingModal = ({
  title = '読み込み中...',
  message = 'しばらくお待ちください',
  ...props
}) => {
  return (
    <Modal
      {...props}
      title={title}
      size="sm"
      closable={false}
      maskClosable={false}
      neonGlow={true}
    >
      <View style={styles.loadingContent}>
        <Text variant="body" align="center">
          {message}
        </Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  
  mask: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  content: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  
  title: {
    flex: 1,
    marginRight: 16,
  },
  
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  closeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  
  defaultFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  
  footerButton: {
    minWidth: 80,
  },
  
  confirmMessage: {
    textAlign: 'center',
    lineHeight: 24,
  },
  
  alertMessage: {
    textAlign: 'center',
    lineHeight: 24,
  },
  
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
});

// 名前付きエクスポート
export { ConfirmModal, AlertModal, LoadingModal };

// デフォルトエクスポート
export default Modal;