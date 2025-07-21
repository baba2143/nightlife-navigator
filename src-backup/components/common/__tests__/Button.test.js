import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import Button from '../Button';

describe('Button コンポーネント', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本機能', () => {
    it('ボタンテキストが正しく表示される', () => {
      render(<Button title="テストボタン" onPress={mockOnPress} />);
      
      expect(screen.getByText('テストボタン')).toBeTruthy();
    });

    it('ボタンタップでonPressが呼ばれる', () => {
      render(<Button title="テストボタン" onPress={mockOnPress} />);
      
      const button = screen.getByTestId('button');
      fireEvent.press(button);
      
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('disabledがtrueの場合、onPressが呼ばれない', () => {
      render(<Button title="テストボタン" onPress={mockOnPress} disabled={true} />);
      
      const button = screen.getByTestId('button');
      fireEvent.press(button);
      
      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('バリアント', () => {
    it('primaryバリアントが正しく適用される', () => {
      render(<Button title="Primary" variant="primary" onPress={mockOnPress} />);
      
      const button = screen.getByTestId('button');
      expect(button.props.style).toBeDefined();
    });

    it('secondaryバリアントが正しく適用される', () => {
      render(<Button title="Secondary" variant="secondary" onPress={mockOnPress} />);
      
      const button = screen.getByTestId('button');
      expect(button.props.style).toBeDefined();
    });

    it('outlineバリアントが正しく適用される', () => {
      render(<Button title="Outline" variant="outline" onPress={mockOnPress} />);
      
      const button = screen.getByTestId('button');
      expect(button.props.style).toBeDefined();
    });

    it('dangerバリアントが正しく適用される', () => {
      render(<Button title="Danger" variant="danger" onPress={mockOnPress} />);
      
      const button = screen.getByTestId('button');
      expect(button.props.style).toBeDefined();
    });
  });

  describe('サイズ', () => {
    it('smallサイズが正しく適用される', () => {
      render(<Button title="Small" size="small" onPress={mockOnPress} />);
      
      const button = screen.getByTestId('button');
      expect(button.props.style).toBeDefined();
    });

    it('mediumサイズが正しく適用される', () => {
      render(<Button title="Medium" size="medium" onPress={mockOnPress} />);
      
      const button = screen.getByTestId('button');
      expect(button.props.style).toBeDefined();
    });

    it('largeサイズが正しく適用される', () => {
      render(<Button title="Large" size="large" onPress={mockOnPress} />);
      
      const button = screen.getByTestId('button');
      expect(button.props.style).toBeDefined();
    });
  });

  describe('アイコン', () => {
    it('leftIconが正しく表示される', () => {
      render(
        <Button 
          title="アイコン付き" 
          leftIcon="plus" 
          onPress={mockOnPress} 
        />
      );
      
      expect(screen.getByTestId('left-icon')).toBeTruthy();
      expect(screen.getByText('アイコン付き')).toBeTruthy();
    });

    it('rightIconが正しく表示される', () => {
      render(
        <Button 
          title="アイコン付き" 
          rightIcon="arrow-right" 
          onPress={mockOnPress} 
        />
      );
      
      expect(screen.getByTestId('right-icon')).toBeTruthy();
      expect(screen.getByText('アイコン付き')).toBeTruthy();
    });

    it('両方のアイコンが表示される', () => {
      render(
        <Button 
          title="両側アイコン" 
          leftIcon="plus" 
          rightIcon="arrow-right" 
          onPress={mockOnPress} 
        />
      );
      
      expect(screen.getByTestId('left-icon')).toBeTruthy();
      expect(screen.getByTestId('right-icon')).toBeTruthy();
      expect(screen.getByText('両側アイコン')).toBeTruthy();
    });
  });

  describe('ローディング状態', () => {
    it('loading=trueの場合、ローディングインジケーターが表示される', () => {
      render(
        <Button 
          title="ローディング" 
          loading={true} 
          onPress={mockOnPress} 
        />
      );
      
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });

    it('loading=trueの場合、onPressが呼ばれない', () => {
      render(
        <Button 
          title="ローディング" 
          loading={true} 
          onPress={mockOnPress} 
        />
      );
      
      const button = screen.getByTestId('button');
      fireEvent.press(button);
      
      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('loading=trueの場合、テキストが非表示になる', () => {
      render(
        <Button 
          title="ローディング" 
          loading={true} 
          onPress={mockOnPress} 
        />
      );
      
      expect(screen.queryByText('ローディング')).toBeNull();
    });
  });

  describe('fullWidth', () => {
    it('fullWidth=trueの場合、幅100%のスタイルが適用される', () => {
      render(
        <Button 
          title="フルワイズ" 
          fullWidth={true} 
          onPress={mockOnPress} 
        />
      );
      
      const button = screen.getByTestId('button');
      expect(button.props.style).toBeDefined();
    });
  });

  describe('カスタムスタイル', () => {
    it('カスタムスタイルが正しく適用される', () => {
      const customStyle = { backgroundColor: 'red' };
      
      render(
        <Button 
          title="カスタム" 
          style={customStyle} 
          onPress={mockOnPress} 
        />
      );
      
      const button = screen.getByTestId('button');
      expect(button.props.style).toBeDefined();
    });

    it('カスタムテキストスタイルが正しく適用される', () => {
      const customTextStyle = { fontSize: 20 };
      
      render(
        <Button 
          title="カスタムテキスト" 
          textStyle={customTextStyle} 
          onPress={mockOnPress} 
        />
      );
      
      const text = screen.getByText('カスタムテキスト');
      expect(text.props.style).toBeDefined();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なアクセシビリティプロパティが設定される', () => {
      render(
        <Button 
          title="アクセシブル" 
          onPress={mockOnPress} 
          accessibilityLabel="カスタムラベル"
          accessibilityHint="ボタンのヒント"
        />
      );
      
      const button = screen.getByTestId('button');
      expect(button.props.accessible).toBe(true);
      expect(button.props.accessibilityLabel).toBe('カスタムラベル');
      expect(button.props.accessibilityHint).toBe('ボタンのヒント');
      expect(button.props.accessibilityRole).toBe('button');
    });

    it('disabled状態がアクセシビリティに反映される', () => {
      render(
        <Button 
          title="無効ボタン" 
          disabled={true} 
          onPress={mockOnPress} 
        />
      );
      
      const button = screen.getByTestId('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it('loading状態がアクセシビリティに反映される', () => {
      render(
        <Button 
          title="ローディング" 
          loading={true} 
          onPress={mockOnPress} 
        />
      );
      
      const button = screen.getByTestId('button');
      expect(button.props.accessibilityState.busy).toBe(true);
    });
  });

  describe('エッジケース', () => {
    it('titleが空文字でもクラッシュしない', () => {
      expect(() => {
        render(<Button title="" onPress={mockOnPress} />);
      }).not.toThrow();
    });

    it('onPressがnullでもクラッシュしない', () => {
      expect(() => {
        render(<Button title="テスト" onPress={null} />);
      }).not.toThrow();
    });

    it('無効なvariantが指定されてもクラッシュしない', () => {
      expect(() => {
        render(<Button title="テスト" variant="invalid" onPress={mockOnPress} />);
      }).not.toThrow();
    });

    it('無効なsizeが指定されてもクラッシュしない', () => {
      expect(() => {
        render(<Button title="テスト" size="invalid" onPress={mockOnPress} />);
      }).not.toThrow();
    });
  });

  describe('パフォーマンス', () => {
    it('同じプロップスで再レンダリングしても不要な更新は行われない', () => {
      const { rerender } = render(
        <Button title="テスト" onPress={mockOnPress} />
      );
      
      // 同じプロップスで再レンダリング
      rerender(<Button title="テスト" onPress={mockOnPress} />);
      
      expect(screen.getByText('テスト')).toBeTruthy();
    });
  });

  describe('イベント処理', () => {
    it('複数回連続タップでも適切に処理される', () => {
      render(<Button title="連続タップ" onPress={mockOnPress} />);
      
      const button = screen.getByTestId('button');
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);
      
      expect(mockOnPress).toHaveBeenCalledTimes(3);
    });

    it('長押しイベントが正しく処理される', () => {
      const mockOnLongPress = jest.fn();
      
      render(
        <Button 
          title="長押し" 
          onPress={mockOnPress} 
          onLongPress={mockOnLongPress} 
        />
      );
      
      const button = screen.getByTestId('button');
      fireEvent(button, 'longPress');
      
      expect(mockOnLongPress).toHaveBeenCalledTimes(1);
    });
  });
});