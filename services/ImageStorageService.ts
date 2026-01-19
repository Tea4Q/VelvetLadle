import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { Image } from 'expo-image';

/**
 * Local Image Storage Service for VelvetLadle
 * 
 * Handles downloading, caching, and managing recipe images locally
 * to reduce dependency on external URLs and improve app reliability.
 */
export class ImageStorageService {
  private static readonly IMAGES_DIR = `${FileSystem.documentDirectory}recipe-images/`;
  private static readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB max per image
  private static readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB total cache
  
  /**
   * Initialize the image storage directory
   */
  static async initializeStorage(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.IMAGES_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.IMAGES_DIR, { intermediates: true });
        // Production build: console.log removed
      }
    } catch (error) {
      console.error('❌ Failed to initialize image storage:', error);
    }
  }

  /**
   * Download and store an image locally
   * @param imageUrl - The remote URL of the image
   * @param recipeId - The recipe ID to associate with the image
   * @returns The local file path or null if failed
   */
  static async downloadAndStoreImage(imageUrl: string, recipeId: number): Promise<string | null> {
    if (!imageUrl || !recipeId) {
      console.warn('⚠️ Invalid parameters for image download');
      return null;
    }
    if (Platform.OS === 'web') {
      // On web, do not store locally, just return the remote URL
      return imageUrl;
    }
    try {
      // Ensure storage is initialized
      await this.initializeStorage();

      // Generate local filename
      const fileExtension = this.getFileExtensionFromUrl(imageUrl);
      const localFilename = `recipe_${recipeId}${fileExtension}`;
      const localPath = `${this.IMAGES_DIR}${localFilename}`;

      // Check if image already exists locally
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        // Production build: console.log removed
        return localPath;
      }

      // Check cache size before downloading
      await this.cleanupCacheIfNeeded();

      // Production build: console.log removed
      
      // Download the image with timeout and size limits
      const downloadResult = await FileSystem.downloadAsync(imageUrl, localPath, {
        headers: {
          'User-Agent': 'VelvetLadle/1.0.0 (Recipe App)',
        },
      });

      if (downloadResult.status === 200) {
        // Verify file size
        const downloadedFileInfo = await FileSystem.getInfoAsync(localPath);
        if (downloadedFileInfo.exists && downloadedFileInfo.size) {
          if (downloadedFileInfo.size > this.MAX_IMAGE_SIZE) {
            console.warn('⚠️ Image too large, removing:', downloadedFileInfo.size);
            await FileSystem.deleteAsync(localPath);
            return null;
          }

          // Production build: console.log removed})`);
          return localPath;
        }
      }

      console.error('❌ Failed to download image:', downloadResult.status);
      return null;

    } catch (error) {
      console.error('❌ Error downloading image:', error);
      return null;
    }
  }

  /**
   * Get the local path for a recipe image, or download it if not cached
   * @param imageUrl - The remote URL of the image
   * @param recipeId - The recipe ID
   * @returns The local file path, remote URL, or null
   */
  static async getImageSource(imageUrl: string | undefined, recipeId: number): Promise<string | null> {
    if (!imageUrl) return null;
    if (Platform.OS === 'web') {
      // On web, always use the remote URL
      return imageUrl;
    }
    try {
      // Check if we already have this image locally
      const fileExtension = this.getFileExtensionFromUrl(imageUrl);
      const localFilename = `recipe_${recipeId}${fileExtension}`;
      const localPath = `${this.IMAGES_DIR}${localFilename}`;

      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        return localPath;
      }

      // Try to download the image in the background
      const downloadedPath = await this.downloadAndStoreImage(imageUrl, recipeId);
      if (downloadedPath) {
        return downloadedPath;
      }

      // Fallback to remote URL if local storage fails
      // Production build: console.log removed
      return imageUrl;

    } catch (error) {
      console.error('❌ Error getting image source:', error);
      return imageUrl; // Fallback to remote URL
    }
  }

  /**
   * Delete a locally stored image
   * @param recipeId - The recipe ID
   */
  static async deleteLocalImage(recipeId: number): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      
      for (const ext of possibleExtensions) {
        const localPath = `${this.IMAGES_DIR}recipe_${recipeId}${ext}`;
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(localPath);
          // Production build: console.log removed
          break;
        }
      }
    } catch (error) {
      console.error('❌ Error deleting local image:', error);
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalImages: number;
    totalSize: number;
    formattedSize: string;
  }> {
    if (Platform.OS === 'web') {
      return { totalImages: 0, totalSize: 0, formattedSize: '0 B' };
    }
    try {
      await this.initializeStorage();
      
      const dirInfo = await FileSystem.readDirectoryAsync(this.IMAGES_DIR);
      let totalSize = 0;
      
      for (const filename of dirInfo) {
        const filePath = `${this.IMAGES_DIR}${filename}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists && fileInfo.size) {
          totalSize += fileInfo.size;
        }
      }

      return {
        totalImages: dirInfo.length,
        totalSize,
        formattedSize: this.formatFileSize(totalSize),
      };
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      return { totalImages: 0, totalSize: 0, formattedSize: '0 B' };
    }
  }

  /**
   * Clean up cache if it exceeds the maximum size
   */
  private static async cleanupCacheIfNeeded(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      const stats = await this.getStorageStats();
      
      if (stats.totalSize > this.MAX_CACHE_SIZE) {
        // Production build: console.log removed
        
        // Get all files with their modification times
        const dirInfo = await FileSystem.readDirectoryAsync(this.IMAGES_DIR);
        const filesWithStats = [];
        
        for (const filename of dirInfo) {
          const filePath = `${this.IMAGES_DIR}${filename}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          if (fileInfo.exists) {
            filesWithStats.push({
              path: filePath,
              filename,
              modificationTime: fileInfo.modificationTime || 0,
              size: fileInfo.size || 0,
            });
          }
        }

        // Sort by oldest first
        filesWithStats.sort((a, b) => a.modificationTime - b.modificationTime);

        // Delete oldest files until we're under the limit
        let currentSize = stats.totalSize;
        const targetSize = this.MAX_CACHE_SIZE * 0.8; // Clean to 80% of max

        for (const file of filesWithStats) {
          if (currentSize <= targetSize) break;
          
          await FileSystem.deleteAsync(file.path);
          currentSize -= file.size;
          // Production build: console.log removed
        }

        // Production build: console.log removed
      }
    } catch (error) {
      console.error('❌ Error during cache cleanup:', error);
    }
  }

  /**
   * Clear all cached images
   */
  static async clearAllImages(): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.IMAGES_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.IMAGES_DIR);
        await this.initializeStorage();
        // Production build: console.log removed
      }
    } catch (error) {
      console.error('❌ Error clearing images:', error);
    }
  }

  /**
   * Extract file extension from URL
   */
  private static getFileExtensionFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const lastDot = pathname.lastIndexOf('.');
      
      if (lastDot > 0) {
        const ext = pathname.substring(lastDot).toLowerCase();
        // Only allow common image extensions
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
          return ext;
        }
      }
      
      // Default to .jpg if no valid extension found
      return '.jpg';
    } catch {
      return '.jpg';
    }
  }

  /**
   * Format file size for human reading
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Preload images for a list of recipes
   * @param recipes - Array of recipes to preload images for
   */
  static async preloadImages(recipes: Array<{ id?: number; image_url?: string }>): Promise<void> {
    // Production build: console.log removed
    
    const downloadPromises = recipes
      .filter(recipe => recipe.id && recipe.image_url)
      .map(recipe => this.downloadAndStoreImage(recipe.image_url!, recipe.id!));

    try {
      await Promise.allSettled(downloadPromises);
      // Production build: console.log removed
    } catch (error) {
      console.error('❌ Error during image preloading:', error);
    }
  }
}
