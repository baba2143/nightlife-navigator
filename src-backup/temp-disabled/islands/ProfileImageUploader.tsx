import { useState, useRef } from "preact/hooks";
import { apply } from "twind";

interface ProfileImageUploaderProps {
  currentImageUrl?: string;
  onImageUpdate?: (newImageUrl: string) => void;
  onImageRemove?: () => void;
  userId: number;
  size?: 'small' | 'medium' | 'large';
  editable?: boolean;
}

export default function ProfileImageUploader({
  currentImageUrl,
  onImageUpdate,
  onImageRemove,
  userId,
  size = 'medium',
  editable = true
}: ProfileImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState(currentImageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-16 h-16';
      case 'large':
        return 'w-32 h-32';
      case 'medium':
      default:
        return 'w-24 h-24';
    }
  };

  const getInitials = () => {
    // ユーザー名の頭文字を表示（実際の実装ではpropsから取得）
    return 'U';
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return '対応していないファイル形式です。JPEG、PNG、WebPのみ対応しています。';
    }

    if (file.size > maxSize) {
      return 'ファイルサイズが大きすぎます。5MB以下のファイルを選択してください。';
    }

    return null;
  };

  const uploadImage = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', 'profile');
      formData.append('userId', userId.toString());

      const response = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setImageUrl(data.url);
        onImageUpdate?.(data.url);
      } else {
        setError(data.error || 'アップロードに失敗しました');
      }
    } catch (err) {
      setError('アップロード中にエラーが発生しました');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleRemoveImage = () => {
    if (confirm('プロフィール画像を削除しますか？')) {
      setImageUrl('');
      onImageRemove?.();
    }
  };

  return (
    <div class="flex flex-col items-center gap-4">
      {/* プロフィール画像 */}
      <div class="relative">
        <div
          class={apply`${getSizeClasses()} rounded-full overflow-hidden border-4 border-pink-light bg-pink-light flex items-center justify-center relative ${
            editable && !uploading ? 'cursor-pointer' : ''
          } ${dragActive ? 'border-pink-primary' : ''}`}
          onClick={() => editable && !uploading && fileInputRef.current?.click()}
          onDragEnter={editable ? handleDrag : undefined}
          onDragLeave={editable ? handleDrag : undefined}
          onDragOver={editable ? handleDrag : undefined}
          onDrop={editable ? handleDrop : undefined}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="プロフィール画像"
              class="w-full h-full object-cover"
            />
          ) : (
            <div class={apply`text-pink-primary font-bold ${size === 'large' ? 'text-3xl' : size === 'small' ? 'text-lg' : 'text-2xl'}`}>
              {getInitials()}
            </div>
          )}

          {/* アップロード中のオーバーレイ */}
          {uploading && (
            <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div class="text-white text-sm">📤</div>
            </div>
          )}

          {/* 編集可能なアイコン */}
          {editable && !uploading && (
            <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 flex items-center justify-center transition-all duration-200 rounded-full">
              <div class="opacity-0 hover:opacity-100 text-white text-sm transition-opacity duration-200">
                📷
              </div>
            </div>
          )}
        </div>

        {/* 削除ボタン */}
        {editable && imageUrl && !uploading && (
          <button
            onClick={handleRemoveImage}
            class="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
            title="画像を削除"
          >
            ×
          </button>
        )}
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div class={apply`text-sm text-red-600 text-center max-w-xs`}>
          {error}
        </div>
      )}

      {/* アップロードヒント */}
      {editable && !imageUrl && !uploading && (
        <div class="text-center">
          <p class={apply`text-sm text-text-secondary mb-2`}>
            クリックまたはドラッグ&ドロップで画像をアップロード
          </p>
          <p class={apply`text-xs text-text-tertiary`}>
            JPEG、PNG、WebP • 5MB以下
          </p>
        </div>
      )}

      {/* アップロード状態 */}
      {uploading && (
        <div class="text-center">
          <p class={apply`text-sm text-pink-primary font-medium`}>
            アップロード中...
          </p>
        </div>
      )}

      {/* アップロードボタン（代替） */}
      {editable && !uploading && (
        <button
          onClick={() => fileInputRef.current?.click()}
          class={apply`btn-pink-outline text-sm px-4 py-2`}
        >
          {imageUrl ? '画像を変更' : '画像をアップロード'}
        </button>
      )}

      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInput}
        class="hidden"
      />
    </div>
  );
}