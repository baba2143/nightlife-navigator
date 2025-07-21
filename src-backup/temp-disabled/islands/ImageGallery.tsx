import { useState, useEffect } from "preact/hooks";
import { apply } from "twind";

interface Image {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
  };
}

interface ImageGalleryProps {
  category?: 'venue' | 'profile' | 'review';
  venueId?: number;
  userId?: number;
  onImageSelect?: (image: Image) => void;
  onImageDelete?: (imageId: string) => void;
  showUploadButton?: boolean;
  maxImages?: number;
  layout?: 'grid' | 'carousel' | 'masonry';
  size?: 'small' | 'medium' | 'large';
}

export default function ImageGallery({
  category,
  venueId,
  userId,
  onImageSelect,
  onImageDelete,
  showUploadButton = false,
  maxImages,
  layout = 'grid',
  size = 'medium'
}: ImageGalleryProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchImages();
  }, [category, venueId, userId]);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (venueId) params.set('venueId', venueId.toString());
      if (userId) params.set('userId', userId.toString());
      if (maxImages) params.set('limit', maxImages.toString());

      const response = await fetch(`/api/upload/images?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setImages(data.images);
      } else {
        setError(data.error || '画像の読み込みに失敗しました');
      }
    } catch (err) {
      setError('画像の読み込み中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (image: Image, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
    setShowLightbox(true);
    onImageSelect?.(image);
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('この画像を削除しますか？')) return;

    try {
      const response = await fetch(`/api/upload/images?id=${imageId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setImages(prev => prev.filter(img => img.id !== imageId));
        onImageDelete?.(imageId);
        
        if (selectedImage?.id === imageId) {
          setShowLightbox(false);
          setSelectedImage(null);
        }
      } else {
        alert(data.error || '画像の削除に失敗しました');
      }
    } catch (err) {
      alert('画像の削除中にエラーが発生しました');
    }
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
      setCurrentIndex(prevIndex);
      setSelectedImage(images[prevIndex]);
    } else {
      const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
      setCurrentIndex(nextIndex);
      setSelectedImage(images[nextIndex]);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-20 h-20';
      case 'large':
        return 'w-48 h-48';
      case 'medium':
      default:
        return 'w-32 h-32';
    }
  };

  const getGridClasses = () => {
    switch (layout) {
      case 'carousel':
        return 'flex overflow-x-auto gap-4 pb-4';
      case 'masonry':
        return 'columns-2 md:columns-3 lg:columns-4 gap-4';
      case 'grid':
      default:
        return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
    }
  };

  if (loading) {
    return (
      <div class="flex items-center justify-center p-8">
        <div class="text-center">
          <div class="text-4xl mb-4">📷</div>
          <p class={apply`text-pink-primary font-medium`}>
            画像を読み込み中...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="text-center p-8">
        <div class="text-4xl mb-4">⚠️</div>
        <h3 class={apply`text-lg font-semibold text-pink-primary mb-2`}>
          エラーが発生しました
        </h3>
        <p class={apply`text-text-secondary mb-4`}>
          {error}
        </p>
        <button
          onClick={fetchImages}
          class={apply`btn-pink`}
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div class="text-center p-8">
        <div class="text-4xl mb-4">📷</div>
        <h3 class={apply`text-lg font-semibold text-pink-primary mb-2`}>
          画像がありません
        </h3>
        <p class={apply`text-text-secondary mb-4`}>
          まだ画像がアップロードされていません
        </p>
        {showUploadButton && (
          <button class={apply`btn-pink`}>
            画像をアップロード
          </button>
        )}
      </div>
    );
  }

  return (
    <div class="w-full">
      {/* ヘッダー */}
      <div class="flex justify-between items-center mb-6">
        <h3 class={apply`text-lg font-semibold text-pink-primary`}>
          画像ギャラリー ({images.length}枚)
        </h3>
        {showUploadButton && (
          <button class={apply`btn-pink-outline`}>
            + 画像を追加
          </button>
        )}
      </div>

      {/* 画像グリッド */}
      <div class={getGridClasses()}>
        {images.map((image, index) => (
          <div
            key={image.id}
            class={`relative group cursor-pointer ${layout === 'masonry' ? 'break-inside-avoid mb-4' : ''}`}
            onClick={() => handleImageClick(image, index)}
          >
            <div class={apply`${layout === 'carousel' ? 'flex-shrink-0' : ''} ${getSizeClasses()} overflow-hidden rounded-lg bg-gray-100`}>
              <img
                src={image.thumbnailUrl || image.url}
                alt={image.originalName}
                class={`w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 ${
                  layout === 'masonry' ? 'h-auto' : ''
                }`}
                loading="lazy"
              />
            </div>

            {/* オーバーレイ */}
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageClick(image, index);
                  }}
                  class="w-8 h-8 bg-white rounded-full flex items-center justify-center text-pink-primary hover:bg-pink-light transition-colors"
                  title="表示"
                >
                  👁️
                </button>
                {onImageDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(image.id);
                    }}
                    class="w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                    title="削除"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>

            {/* 画像情報 */}
            {size === 'large' && (
              <div class="mt-2">
                <p class={apply`text-sm font-medium text-text-primary truncate`}>
                  {image.originalName}
                </p>
                <p class={apply`text-xs text-text-secondary`}>
                  {new Date(image.uploadedAt).toLocaleDateString('ja-JP')}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ライトボックス */}
      {showLightbox && selectedImage && (
        <div 
          class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div class="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {/* 画像 */}
            <img
              src={selectedImage.url}
              alt={selectedImage.originalName}
              class="max-w-full max-h-[80vh] object-contain rounded-lg"
            />

            {/* 閉じるボタン */}
            <button
              onClick={() => setShowLightbox(false)}
              class="absolute -top-12 right-0 text-white text-2xl hover:text-pink-light transition-colors"
            >
              ×
            </button>

            {/* ナビゲーション */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => navigateLightbox('prev')}
                  class="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl hover:bg-opacity-30 transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={() => navigateLightbox('next')}
                  class="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl hover:bg-opacity-30 transition-colors"
                >
                  →
                </button>
              </>
            )}

            {/* 画像情報 */}
            <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
              <h4 class="font-semibold mb-1">{selectedImage.originalName}</h4>
              <div class="flex justify-between text-sm text-gray-300">
                <span>
                  {selectedImage.metadata && 
                    `${selectedImage.metadata.width} × ${selectedImage.metadata.height}`
                  }
                </span>
                <span>
                  {new Date(selectedImage.uploadedAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <div class="text-xs text-gray-400 mt-1">
                {currentIndex + 1} / {images.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}