import { useState, useRef } from "preact/hooks";
import { apply } from "twind";

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
  uploadedUrl?: string;
}

interface ImageUploaderProps {
  maxFiles?: number;
  maxFileSize?: number; // bytes
  acceptedTypes?: string[];
  onUploadComplete?: (urls: string[]) => void;
  onUploadError?: (error: string) => void;
  existingImages?: string[];
  uploadEndpoint?: string;
  category?: 'venue' | 'profile' | 'review';
  venueId?: number;
  userId?: number;
}

export default function ImageUploader({
  maxFiles = 5,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  onUploadComplete,
  onUploadError,
  existingImages = [],
  uploadEndpoint = '/api/upload/images',
  category = 'venue',
  venueId,
  userId
}: ImageUploaderProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `対応していないファイル形式です。${acceptedTypes.join(', ')} のみアップロード可能です。`;
    }

    if (file.size > maxFileSize) {
      const sizeMB = (maxFileSize / (1024 * 1024)).toFixed(1);
      return `ファイルサイズが大きすぎます。${sizeMB}MB以下のファイルを選択してください。`;
    }

    return null;
  };

  const createImageFile = (file: File): ImageFile => {
    const preview = URL.createObjectURL(file);
    return {
      id: generateId(),
      file,
      preview,
      status: 'pending',
      progress: 0,
    };
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const totalFiles = images.length + existingImages.length + fileArray.length;

    if (totalFiles > maxFiles) {
      onUploadError?.(`最大${maxFiles}枚まで画像をアップロードできます。`);
      return;
    }

    const newImages: ImageFile[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        newImages.push(createImageFile(file));
      }
    }

    if (errors.length > 0) {
      onUploadError?.(errors.join('\n'));
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const uploadImage = async (imageFile: ImageFile): Promise<void> => {
    const formData = new FormData();
    formData.append('image', imageFile.file);
    formData.append('category', category);
    if (venueId) formData.append('venueId', venueId.toString());
    if (userId) formData.append('userId', userId.toString());

    try {
      setImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { ...img, status: 'uploading', progress: 0 }
          : img
      ));

      const xhr = new XMLHttpRequest();

      // アップロード進捗の監視
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setImages(prev => prev.map(img => 
            img.id === imageFile.id 
              ? { ...img, progress }
              : img
          ));
        }
      });

      // アップロード完了の処理
      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status === 200 && response.success) {
            setImages(prev => prev.map(img => 
              img.id === imageFile.id 
                ? { 
                    ...img, 
                    status: 'success', 
                    progress: 100,
                    uploadedUrl: response.url 
                  }
                : img
            ));
          } else {
            throw new Error(response.error || 'アップロードに失敗しました');
          }
        } catch (error) {
          setImages(prev => prev.map(img => 
            img.id === imageFile.id 
              ? { 
                  ...img, 
                  status: 'error', 
                  errorMessage: error instanceof Error ? error.message : 'アップロードエラー'
                }
              : img
          ));
        }
      });

      // エラーハンドリング
      xhr.addEventListener('error', () => {
        setImages(prev => prev.map(img => 
          img.id === imageFile.id 
            ? { 
                ...img, 
                status: 'error', 
                errorMessage: 'ネットワークエラーが発生しました'
              }
            : img
        ));
      });

      xhr.open('POST', uploadEndpoint);
      xhr.send(formData);

    } catch (error) {
      setImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { 
              ...img, 
              status: 'error', 
              errorMessage: error instanceof Error ? error.message : 'アップロードエラー'
            }
          : img
      ));
    }
  };

  const uploadAllImages = async () => {
    const pendingImages = images.filter(img => img.status === 'pending');
    
    for (const imageFile of pendingImages) {
      await uploadImage(imageFile);
    }

    // 全てのアップロードが完了したらコールバックを呼ぶ
    const allUrls = images
      .filter(img => img.status === 'success' && img.uploadedUrl)
      .map(img => img.uploadedUrl!);
    
    if (allUrls.length > 0) {
      onUploadComplete?.(allUrls);
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const retryUpload = (id: string) => {
    const imageFile = images.find(img => img.id === id);
    if (imageFile) {
      uploadImage(imageFile);
    }
  };

  // ドラッグ&ドロップハンドラー
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
    
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    handleFiles(target.files);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'uploading': return '📤';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '📷';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'uploading': return 'text-blue-500';
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div class="w-full">
      {/* アップロードエリア */}
      <div
        class={apply`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
          dragActive 
            ? 'border-pink-primary bg-pink-light' 
            : 'border-border-medium hover:border-pink-primary hover:bg-pink-light'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div class="text-4xl mb-4">📷</div>
        <h3 class={apply`text-lg font-semibold text-pink-primary mb-2`}>
          画像をアップロード
        </h3>
        <p class={apply`text-text-secondary mb-4`}>
          ここにファイルをドラッグ&ドロップするか、クリックして選択
        </p>
        <div class={apply`text-sm text-text-tertiary`}>
          <p>最大{maxFiles}枚まで • {(maxFileSize / (1024 * 1024)).toFixed(1)}MB以下</p>
          <p>対応形式: {acceptedTypes.map(type => type.split('/')[1]).join(', ')}</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        class="hidden"
      />

      {/* 既存画像の表示 */}
      {existingImages.length > 0 && (
        <div class="mt-6">
          <h4 class={apply`text-lg font-semibold text-pink-primary mb-4`}>
            現在の画像
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingImages.map((url, index) => (
              <div key={index} class={apply`card-soft p-2`}>
                <img
                  src={url}
                  alt={`既存画像 ${index + 1}`}
                  class="w-full h-32 object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* アップロード予定・進行中の画像 */}
      {images.length > 0 && (
        <div class="mt-6">
          <div class="flex justify-between items-center mb-4">
            <h4 class={apply`text-lg font-semibold text-pink-primary`}>
              アップロード画像 ({images.length})
            </h4>
            {images.some(img => img.status === 'pending') && (
              <button
                onClick={uploadAllImages}
                class={apply`btn-pink`}
              >
                すべてアップロード
              </button>
            )}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((imageFile) => (
              <div key={imageFile.id} class={apply`card-soft`}>
                <div class="flex gap-4">
                  {/* 画像プレビュー */}
                  <div class="flex-shrink-0">
                    <img
                      src={imageFile.preview}
                      alt="プレビュー"
                      class="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>

                  {/* 画像情報 */}
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                      <span class={`text-lg ${getStatusColor(imageFile.status)}`}>
                        {getStatusIcon(imageFile.status)}
                      </span>
                      <span class={apply`text-sm font-medium text-text-primary truncate`}>
                        {imageFile.file.name}
                      </span>
                    </div>

                    <div class={apply`text-xs text-text-secondary mb-2`}>
                      {(imageFile.file.size / 1024).toFixed(1)} KB
                    </div>

                    {/* 進捗バー */}
                    {imageFile.status === 'uploading' && (
                      <div class="mb-2">
                        <div class="flex justify-between text-xs text-text-secondary mb-1">
                          <span>アップロード中...</span>
                          <span>{imageFile.progress}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            class="bg-pink-primary h-2 rounded-full transition-all duration-300"
                            style={`width: ${imageFile.progress}%`}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* エラーメッセージ */}
                    {imageFile.status === 'error' && imageFile.errorMessage && (
                      <div class={apply`text-xs text-red-600 mb-2`}>
                        {imageFile.errorMessage}
                      </div>
                    )}

                    {/* アクションボタン */}
                    <div class="flex gap-2">
                      {imageFile.status === 'pending' && (
                        <button
                          onClick={() => uploadImage(imageFile)}
                          class={apply`text-xs btn-pink-outline px-2 py-1`}
                        >
                          アップロード
                        </button>
                      )}
                      
                      {imageFile.status === 'error' && (
                        <button
                          onClick={() => retryUpload(imageFile.id)}
                          class={apply`text-xs btn-pink-outline px-2 py-1`}
                        >
                          再試行
                        </button>
                      )}

                      {imageFile.status === 'success' && imageFile.uploadedUrl && (
                        <a
                          href={imageFile.uploadedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          class={apply`text-xs btn-pink-outline px-2 py-1`}
                        >
                          表示
                        </a>
                      )}

                      <button
                        onClick={() => removeImage(imageFile.id)}
                        class={apply`text-xs text-red-600 hover:text-red-800 px-2 py-1`}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}