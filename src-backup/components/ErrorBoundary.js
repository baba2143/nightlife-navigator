/**
 * Error Boundary Component
 * React error boundary with comprehensive error handling and user-friendly fallback UI
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import LoggingService from '../services/LoggingService';
import ErrorHandlerService from '../services/ErrorHandlerService';
import UserFriendlyErrorService from '../services/UserFriendlyErrorService';
import ErrorReportService from '../services/ErrorReportService';
import FailsafeService from '../services/FailsafeService';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      friendlyError: null,
      isReporting: false,
      reportSent: false,
      retryCount: 0,
      showDetails: false,
    };
    
    this.maxRetries = props.maxRetries || 3;
    this.enableErrorReporting = props.enableErrorReporting !== false;
    this.showFallbackUI = props.showFallbackUI !== false;
    this.logErrors = props.logErrors !== false;
    this.onError = props.onError;
    this.fallbackComponent = props.fallbackComponent;
    this.level = props.level || 'component'; // component, screen, app
  }

  /**
   * React error boundary lifecycle method
   */
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * React error boundary lifecycle method
   */
  componentDidCatch(error, errorInfo) {
    this.handleError(error, errorInfo);
  }

  /**
   * Handle error with comprehensive error processing
   */
  async handleError(error, errorInfo) {
    try {
      // Log error
      if (this.logErrors) {
        LoggingService.error('[ErrorBoundary] Component error caught', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          level: this.level,
          retryCount: this.state.retryCount,
        });
      }
      
      // Process error through error handler service
      const errorResult = await ErrorHandlerService.handleError(error, {
        source: 'error_boundary',
        level: this.level,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
        ...this.props.errorContext,
      });
      
      // Generate user-friendly error
      const friendlyError = UserFriendlyErrorService.generateFriendlyError(error, {
        source: 'ui',
        level: this.level,
        userInitiated: false,
      });
      
      // Report error if enabled
      if (this.enableErrorReporting) {
        this.reportError(error, errorInfo, friendlyError);
      }
      
      // Report to failsafe service
      FailsafeService.reportServiceHealth('UIComponent', false, {
        error: error.message,
        level: this.level,
      });
      
      // Update state
      this.setState({
        error,
        errorInfo,
        friendlyError,
        hasError: true,
      });
      
      // Call custom error handler if provided
      if (this.onError) {
        this.onError(error, errorInfo, errorResult);
      }

    } catch (handlingError) {
      LoggingService.error('[ErrorBoundary] Error handling failed', {
        handlingError: handlingError.message,
        originalError: error.message,
      });
      
      // Fallback state update
      this.setState({
        error,
        errorInfo,
        hasError: true,
        friendlyError: this.createFallbackFriendlyError(error),
      });
    }
  }

  /**
   * Report error to error reporting service
   */
  async reportError(error, errorInfo, friendlyError) {
    try {
      this.setState({ isReporting: true });
      
      const reportId = await ErrorReportService.generateErrorReport(error, {
        source: 'error_boundary',
        level: this.level,
        componentStack: errorInfo.componentStack,
        friendlyError,
        props: this.sanitizeProps(this.props),
        state: this.sanitizeState(this.state),
      });
      
      LoggingService.info('[ErrorBoundary] Error reported', {
        reportId,
        errorMessage: error.message,
      });
      
      this.setState({
        isReporting: false,
        reportSent: true,
      });

    } catch (reportingError) {
      LoggingService.error('[ErrorBoundary] Error reporting failed', {
        error: reportingError.message,
      });
      
      this.setState({ isReporting: false });
    }
  }

  /**
   * Create fallback friendly error
   */
  createFallbackFriendlyError(error) {
    return {
      id: `fallback_${Date.now()}`,
      title: 'アプリエラー',
      message: '予期しない問題が発生しました',
      severity: 'error',
      icon: 'alert-circle',
      canRetry: true,
      actions: [
        { key: 'retry', text: '再試行', primary: true },
        { key: 'reload', text: '再読み込み', primary: false },
      ],
    };
  }

  /**
   * Sanitize props for error reporting
   */
  sanitizeProps(props) {
    const sanitized = { ...props };
    
    // Remove sensitive data and functions
    delete sanitized.children;
    delete sanitized.onError;
    delete sanitized.fallbackComponent;
    
    // Remove function props
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'function') {
        sanitized[key] = '[Function]';
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitize state for error reporting
   */
  sanitizeState(state) {
    return {
      hasError: state.hasError,
      retryCount: state.retryCount,
      showDetails: state.showDetails,
      isReporting: state.isReporting,
      reportSent: state.reportSent,
    };
  }

  /**
   * Retry rendering
   */
  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    LoggingService.info('[ErrorBoundary] Retrying render', {
      retryCount: newRetryCount,
      maxRetries: this.maxRetries,
    });
    
    if (newRetryCount <= this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        friendlyError: null,
        retryCount: newRetryCount,
        showDetails: false,
      });
    } else {
      Alert.alert(
        '再試行制限',
        '最大再試行回数に達しました。アプリを再起動してください。',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Reload component
   */
  handleReload = () => {
    LoggingService.info('[ErrorBoundary] Reloading component');
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      friendlyError: null,
      retryCount: 0,
      showDetails: false,
      isReporting: false,
      reportSent: false,
    });
  };

  /**
   * Toggle error details visibility
   */
  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  /**
   * Handle user action from friendly error
   */
  handleUserAction = async (actionKey) => {
    try {
      LoggingService.info('[ErrorBoundary] Handling user action', {
        actionKey,
        errorId: this.state.friendlyError?.id,
      });
      
      switch (actionKey) {
        case 'retry':
          this.handleRetry();
          break;
          
        case 'reload':
          this.handleReload();
          break;
          
        case 'contactSupport':
          this.handleContactSupport();
          break;
          
        case 'showGuide':
          this.handleShowGuide();
          break;
          
        default:
          // Handle through UserFriendlyErrorService
          await UserFriendlyErrorService.handleUserAction(
            actionKey,
            this.state.friendlyError,
            { source: 'error_boundary' }
          );
      }

    } catch (error) {
      LoggingService.error('[ErrorBoundary] Action handling failed', {
        error: error.message,
        actionKey,
      });
    }
  };

  /**
   * Handle contact support
   */
  handleContactSupport = () => {
    Alert.alert(
      'サポートに連絡',
      'サポートチームに問題を報告しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '報告する',
          onPress: async () => {
            if (!this.state.reportSent) {
              await this.reportError(
                this.state.error,
                this.state.errorInfo,
                this.state.friendlyError
              );
            }
            Alert.alert('報告完了', 'エラーレポートが送信されました。');
          },
        },
      ]
    );
  };

  /**
   * Handle show guide
   */
  handleShowGuide = () => {
    Alert.alert(
      'ヘルプガイド',
      'この問題の解決方法:\n\n1. アプリを再起動してください\n2. デバイスを再起動してください\n3. 問題が続く場合はサポートに連絡してください',
      [{ text: 'OK' }]
    );
  };

  /**
   * Render error UI
   */
  renderErrorUI() {
    const { friendlyError } = this.state;
    
    if (this.fallbackComponent) {
      return React.createElement(this.fallbackComponent, {
        error: this.state.error,
        errorInfo: this.state.errorInfo,
        friendlyError,
        onRetry: this.handleRetry,
        onReload: this.handleReload,
      });
    }
    
    return (
      <View style={styles.errorContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Error Icon and Title */}
          <View style={styles.errorHeader}>
            <Ionicons
              name={friendlyError?.icon || 'alert-circle'}
              size={64}
              color={this.getSeverityColor(friendlyError?.severity)}
            />
            <Text style={styles.errorTitle}>
              {friendlyError?.title || 'エラーが発生しました'}
            </Text>
            <Text style={styles.errorMessage}>
              {friendlyError?.message || 'アプリの表示に問題が発生しました'}
            </Text>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {friendlyError?.actions?.map((action, index) => (
              <TouchableOpacity
                key={action.key}
                style={[
                  styles.actionButton,
                  action.primary && styles.primaryButton,
                  action.destructive && styles.destructiveButton,
                ]}
                onPress={() => this.handleUserAction(action.key)}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    action.primary && styles.primaryButtonText,
                    action.destructive && styles.destructiveButtonText,
                  ]}
                >
                  {action.text}
                </Text>
              </TouchableOpacity>
            )) || (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={this.handleRetry}
                  disabled={this.state.retryCount >= this.maxRetries}
                >
                  <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
                    再試行 ({this.state.retryCount}/{this.maxRetries})
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={this.handleReload}
                >
                  <Text style={styles.actionButtonText}>
                    再読み込み
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          
          {/* Guidance */}
          {friendlyError?.guidance && (
            <View style={styles.guidanceContainer}>
              <Text style={styles.guidanceTitle}>解決方法</Text>
              <Text style={styles.guidanceText}>
                {friendlyError.guidance.text}
              </Text>
            </View>
          )}
          
          {/* Error Details Toggle */}
          <TouchableOpacity
            style={styles.detailsToggle}
            onPress={this.toggleDetails}
          >
            <Text style={styles.detailsToggleText}>
              {this.state.showDetails ? '詳細を隠す' : '詳細を表示'}
            </Text>
            <Ionicons
              name={this.state.showDetails ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
          
          {/* Error Details */}
          {this.state.showDetails && (
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>技術的詳細</Text>
              <Text style={styles.detailsText}>
                エラー: {this.state.error?.message}
              </Text>
              {this.state.error?.stack && (
                <Text style={styles.detailsText}>
                  スタックトレース: {this.state.error.stack.substring(0, 500)}...
                </Text>
              )}
              <Text style={styles.detailsText}>
                レベル: {this.level}
              </Text>
              <Text style={styles.detailsText}>
                タイムスタンプ: {new Date().toLocaleString()}
              </Text>
              {this.state.reportSent && (
                <Text style={styles.reportStatus}>
                  ✓ エラーレポートが送信されました
                </Text>
              )}
            </View>
          )}
          
          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={this.handleContactSupport}
            >
              <Ionicons name="help-circle" size={20} color="#007AFF" />
              <Text style={styles.supportButtonText}>サポートに連絡</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  /**
   * Get color based on severity
   */
  getSeverityColor(severity) {
    switch (severity) {
      case 'error':
      case 'critical':
        return '#FF3B30';
      case 'warning':
        return '#FF9500';
      case 'info':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  }

  /**
   * Render component
   */
  render() {
    if (this.state.hasError) {
      if (!this.showFallbackUI) {
        // Just log the error but don't show fallback UI
        return null;
      }
      
      return this.renderErrorUI();
    }
    
    // Normal rendering
    return this.props.children;
  }
}

// Styles
const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  errorHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  actionContainer: {
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  destructiveButton: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
  guidanceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  guidanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  guidanceText: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  detailsToggleText: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    lineHeight: 18,
    marginBottom: 8,
  },
  reportStatus: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  supportButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default ErrorBoundary;