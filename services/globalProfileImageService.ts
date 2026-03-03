/**
 * globalProfileImageService.ts
 *
 * Portable profile-image service — copy into any Expo/Supabase app.
 *
 * Storage strategy (in priority order):
 *  1. Local file  : FileSystem.documentDirectory/profile-images/profile_{userId}.jpg
 *  2. AsyncStorage: URI pointer (fast lookup, survives app restarts)
 *  3. Supabase Storage bucket "profile-images" (cross-device sync when configured)
 *
 * expo-image-picker is required (already in package.json).
 * expo-file-system is required (bundled with Expo).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const IMAGES_DIR = `${FileSystem.documentDirectory}profile-images/`;
const SUPABASE_BUCKET = "profile-images";
const ASYNC_KEY_PREFIX = "global_profile_image_uri_";

export class GlobalProfileImageService {
  // -------------------------------------------------------------------------
  // Permissions
  // -------------------------------------------------------------------------

  /**
   * Request media-library and camera permissions.
   * Returns true when at least one type is granted.
   */
  static async requestPermissions(): Promise<{
    camera: boolean;
    library: boolean;
  }> {
    if (Platform.OS === "web") {
      return { camera: false, library: true };
    }

    const [cameraResult, libraryResult] = await Promise.all([
      ImagePicker.requestCameraPermissionsAsync(),
      ImagePicker.requestMediaLibraryPermissionsAsync(),
    ]);

    return {
      camera: cameraResult.status === "granted",
      library: libraryResult.status === "granted",
    };
  }

  // -------------------------------------------------------------------------
  // Pick / capture
  // -------------------------------------------------------------------------

  /**
   * Open the device photo library and let the user pick a square-cropped image.
   * Returns the local URI, or null if the user cancelled.
   */
  static async pickFromLibrary(): Promise<string | null> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return null;
    return result.assets[0].uri;
  }

  /**
   * Open the device camera and capture a square-cropped photo.
   * Returns the local URI, or null if cancelled / no camera available.
   */
  static async takePhoto(): Promise<string | null> {
    if (Platform.OS === "web") return null;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return null;
    return result.assets[0].uri;
  }

  // -------------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------------

  /**
   * Copy a picked/captured image into the app's local profile-images directory,
   * optionally upload to Supabase Storage, and persist the URI in AsyncStorage.
   *
   * Returns the URI that should be used to display the image.
   */
  static async saveProfileImage(
    pickedUri: string,
    userId: string,
  ): Promise<string> {
    // Ensure local directory exists
    if (Platform.OS !== "web") {
      const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(IMAGES_DIR, {
          intermediates: true,
        });
      }

      const localPath = `${IMAGES_DIR}profile_${userId}.jpg`;

      // Copy (overwrite) the file
      try {
        const existingInfo = await FileSystem.getInfoAsync(localPath);
        if (existingInfo.exists) {
          await FileSystem.deleteAsync(localPath, { idempotent: true });
        }
        await FileSystem.copyAsync({ from: pickedUri, to: localPath });
      } catch (e) {
        console.error("[GlobalProfileImageService] local copy failed:", e);
        // Fall through to use the original URI
      }

      const displayUri = localPath;

      // Upload to Supabase Storage (best-effort)
      let finalUri = displayUri;
      if (isSupabaseConfigured && supabase) {
        try {
          const uploadUri = await this._uploadToSupabase(
            localPath,
            userId,
          );
          if (uploadUri) finalUri = uploadUri;
        } catch (_) {}
      }

      await AsyncStorage.setItem(
        `${ASYNC_KEY_PREFIX}${userId}`,
        finalUri,
      );
      return finalUri;
    }

    // Web: cannot write to file system — use the pickedUri directly
    await AsyncStorage.setItem(`${ASYNC_KEY_PREFIX}${userId}`, pickedUri);
    return pickedUri;
  }

  // -------------------------------------------------------------------------
  // Retrieve
  // -------------------------------------------------------------------------

  /**
   * Get the profile image URI for a user.
   * Checks AsyncStorage first (fast), then falls back to Supabase Storage.
   * Returns null if no image is set.
   */
  static async getProfileImage(userId: string): Promise<string | null> {
    // 1. AsyncStorage (fastest)
    try {
      const stored = await AsyncStorage.getItem(
        `${ASYNC_KEY_PREFIX}${userId}`,
      );
      if (stored) {
        // Verify local file still exists (it may have been cleared)
        if (Platform.OS !== "web" && stored.startsWith("file://")) {
          const info = await FileSystem.getInfoAsync(stored);
          if (!info.exists) {
            await AsyncStorage.removeItem(`${ASYNC_KEY_PREFIX}${userId}`);
            // Fall through to remote lookup
          } else {
            return stored;
          }
        } else {
          return stored;
        }
      }
    } catch (_) {}

    // 2. Supabase Storage public URL
    if (isSupabaseConfigured && supabase) {
      try {
        const path = `${userId}/profile.jpg`;
        const { data } = (supabase as any).storage
          .from(SUPABASE_BUCKET)
          .getPublicUrl(path);
        const publicUrl: string | undefined = data?.publicUrl;
        if (publicUrl) {
          await AsyncStorage.setItem(
            `${ASYNC_KEY_PREFIX}${userId}`,
            publicUrl,
          );
          return publicUrl;
        }
      } catch (_) {}
    }

    return null;
  }

  // -------------------------------------------------------------------------
  // Delete (called during account deletion)
  // -------------------------------------------------------------------------

  /**
   * Remove the local file, clear AsyncStorage key, and delete from Supabase Storage.
   */
  static async deleteProfileImage(userId: string): Promise<void> {
    // Local file
    if (Platform.OS !== "web") {
      try {
        const localPath = `${IMAGES_DIR}profile_${userId}.jpg`;
        const info = await FileSystem.getInfoAsync(localPath);
        if (info.exists) {
          await FileSystem.deleteAsync(localPath, { idempotent: true });
        }
      } catch (_) {}
    }

    // AsyncStorage
    try {
      await AsyncStorage.removeItem(`${ASYNC_KEY_PREFIX}${userId}`);
    } catch (_) {}

    // Supabase Storage
    if (isSupabaseConfigured && supabase) {
      try {
        await (supabase as any).storage
          .from(SUPABASE_BUCKET)
          .remove([`${userId}/profile.jpg`]);
      } catch (_) {}
    }
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  private static async _uploadToSupabase(
    localPath: string,
    userId: string,
  ): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(localPath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert to Uint8Array for upload
      const byteChars = atob(base64);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteArray[i] = byteChars.charCodeAt(i);
      }

      const storagePath = `${userId}/profile.jpg`;

      const { error } = await (supabase as any).storage
        .from(SUPABASE_BUCKET)
        .upload(storagePath, byteArray, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        console.error("[GlobalProfileImageService] upload error:", error);
        return null;
      }

      const { data } = (supabase as any).storage
        .from(SUPABASE_BUCKET)
        .getPublicUrl(storagePath);

      return data?.publicUrl ?? null;
    } catch (e) {
      console.error("[GlobalProfileImageService] _uploadToSupabase:", e);
      return null;
    }
  }
}
