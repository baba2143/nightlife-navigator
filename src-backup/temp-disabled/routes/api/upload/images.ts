import { Handlers } from "$fresh/server.ts";

interface UploadedImage {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  category: 'venue' | 'profile' | 'review';
  venueId?: number;
  userId?: number;
  uploadedAt: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
  };
}

// 画像メタデータストレージ（実際の実装ではデータベースを使用）
const uploadedImages: UploadedImage[] = [];

export const handler: Handlers = {
  async POST(req) {
    try {
      const formData = await req.formData();
      const imageFile = formData.get('image') as File;
      const category = formData.get('category') as string || 'venue';
      const venueId = formData.get('venueId') ? parseInt(formData.get('venueId') as string) : undefined;
      const userId = formData.get('userId') ? parseInt(formData.get('userId') as string) : undefined;

      if (!imageFile) {
        return new Response(JSON.stringify({
          success: false,
          error: '画像ファイルが選択されていません'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // ファイル検証
      const validationError = validateImage(imageFile);
      if (validationError) {
        return new Response(JSON.stringify({
          success: false,
          error: validationError
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // ファイル名を生成
      const fileExtension = getFileExtension(imageFile.name);
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 8);
      const filename = `${category}_${timestamp}_${randomSuffix}.${fileExtension}`;

      // 画像を保存（実際の実装では適切なストレージサービスを使用）
      const savedImage = await saveImage(imageFile, filename, category);

      // メタデータを取得
      const metadata = await getImageMetadata(imageFile);

      // サムネイル生成
      const thumbnailUrl = await generateThumbnail(savedImage.url, filename);

      // データベースに保存（実際の実装では適切なデータベースを使用）
      const uploadedImage: UploadedImage = {
        id: generateId(),
        filename,
        originalName: imageFile.name,
        mimeType: imageFile.type,
        size: imageFile.size,
        url: savedImage.url,
        thumbnailUrl,
        category: category as any,
        venueId,
        userId,
        uploadedAt: new Date().toISOString(),
        metadata,
      };

      uploadedImages.push(uploadedImage);

      return new Response(JSON.stringify({
        success: true,
        url: uploadedImage.url,
        thumbnailUrl: uploadedImage.thumbnailUrl,
        id: uploadedImage.id,
        metadata: uploadedImage.metadata,
        message: '画像のアップロードが完了しました'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Image upload error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'アップロード中にエラーが発生しました'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  async GET(req) {
    try {
      const url = new URL(req.url);
      const category = url.searchParams.get('category');
      const venueId = url.searchParams.get('venueId') ? parseInt(url.searchParams.get('venueId')!) : undefined;
      const userId = url.searchParams.get('userId') ? parseInt(url.searchParams.get('userId')!) : undefined;
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let filteredImages = [...uploadedImages];

      // フィルタリング
      if (category) {
        filteredImages = filteredImages.filter(img => img.category === category);
      }
      if (venueId) {
        filteredImages = filteredImages.filter(img => img.venueId === venueId);
      }
      if (userId) {
        filteredImages = filteredImages.filter(img => img.userId === userId);
      }

      // ソート（新しい順）
      filteredImages.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      // ページネーション
      const total = filteredImages.length;
      const paginatedImages = filteredImages.slice(offset, offset + limit);

      return new Response(JSON.stringify({
        success: true,
        images: paginatedImages,
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: '画像一覧の取得中にエラーが発生しました'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  async DELETE(req) {
    try {
      const url = new URL(req.url);
      const imageId = url.searchParams.get('id');

      if (!imageId) {
        return new Response(JSON.stringify({
          success: false,
          error: '画像IDが指定されていません'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const imageIndex = uploadedImages.findIndex(img => img.id === imageId);
      
      if (imageIndex === -1) {
        return new Response(JSON.stringify({
          success: false,
          error: '画像が見つかりません'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const deletedImage = uploadedImages.splice(imageIndex, 1)[0];

      // 実際のファイルを削除（実装では適切なストレージサービスを使用）
      await deleteImageFile(deletedImage.filename);
      if (deletedImage.thumbnailUrl) {
        await deleteImageFile(getThumbnailFilename(deletedImage.filename));
      }

      return new Response(JSON.stringify({
        success: true,
        message: '画像が削除されました'
      }), {
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: '画像削除中にエラーが発生しました'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

// ユーティリティ関数

function validateImage(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return '対応していないファイル形式です。JPEG、PNG、WebPのみ対応しています。';
  }

  if (file.size > maxSize) {
    return 'ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。';
  }

  return null;
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || 'jpg';
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function saveImage(file: File, filename: string, category: string): Promise<{ url: string }> {
  // 実際の実装では、AWS S3、Google Cloud Storage、Cloudinary等を使用
  // ここではローカルの static ディレクトリに保存するデモ実装
  
  const uploadDir = `./static/uploads/${category}`;
  
  try {
    await Deno.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    // ディレクトリが既に存在する場合は無視
  }

  const filepath = `${uploadDir}/${filename}`;
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  await Deno.writeFile(filepath, uint8Array);

  return {
    url: `/uploads/${category}/${filename}`
  };
}

async function getImageMetadata(file: File): Promise<{ width: number; height: number; format: string }> {
  // 実際の実装では、適切な画像処理ライブラリを使用
  // ここではファイル情報から推測するデモ実装
  
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      resolve({
        width: img.width || 800,
        height: img.height || 600,
        format: file.type.split('/')[1] || 'jpeg'
      });
    };
    
    img.onerror = () => {
      // デフォルト値を返す
      resolve({
        width: 800,
        height: 600,
        format: file.type.split('/')[1] || 'jpeg'
      });
    };
    
    img.src = URL.createObjectURL(file);
  });
}

async function generateThumbnail(imageUrl: string, filename: string): Promise<string> {
  // 実際の実装では、適切な画像処理ライブラリでサムネイル生成
  // ここではオリジナル画像をサムネイルとして使用するデモ実装
  
  const thumbnailFilename = getThumbnailFilename(filename);
  const category = filename.split('_')[0];
  
  // 簡易的にオリジナルと同じURLを返す（実際は縮小画像を生成）
  return `/uploads/${category}/thumbnails/${thumbnailFilename}`;
}

function getThumbnailFilename(originalFilename: string): string {
  const parts = originalFilename.split('.');
  const extension = parts.pop();
  const name = parts.join('.');
  return `${name}_thumb.${extension}`;
}

async function deleteImageFile(filename: string): Promise<void> {
  try {
    const category = filename.split('_')[0];
    const filepath = `./static/uploads/${category}/${filename}`;
    await Deno.remove(filepath);
  } catch (error) {
    console.warn('Failed to delete image file:', error);
  }
}

// 画像最適化機能（実際の実装では適切なライブラリを使用）
export async function optimizeImage(file: File, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // 最大サイズを設定
      const maxWidth = 1920;
      const maxHeight = 1080;
      
      let { width, height } = img;
      
      // アスペクト比を保持しながらリサイズ
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 画像を描画
      ctx.drawImage(img, 0, 0, width, height);
      
      // Blobとして出力
      canvas.toBlob(resolve, file.type, quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
}