/**
 * globalProfileImagePicker.tsx
 *
 * Self-contained circular avatar with tap-to-change functionality.
 * Portable — copy into any Expo app that uses the VelvetLadle theme system.
 */

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors, useRadius } from "../contexts/ThemeContext";
import {
  GlobalProfileImageService,
} from "../services/globalProfileImageService";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GlobalProfileImagePickerProps {
  userId: string;
  displayName: string;
  size?: number;
  /** When false, the avatar is display-only (no camera badge, no tap) */
  editable?: boolean;
  /** Optional callback when the image changes */
  onImageChanged?: (uri: string | null) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GlobalProfileImagePicker({
  userId,
  displayName,
  size = 96,
  editable = true,
  onImageChanged,
}: GlobalProfileImagePickerProps) {
  const colors = useColors();
  const radius = useRadius();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved image on mount
  useEffect(() => {
    let cancelled = false;
    GlobalProfileImageService.getProfileImage(userId).then((uri) => {
      if (!cancelled) setImageUri(uri);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // -------------------------------------------------------------------------
  // Action sheet
  // -------------------------------------------------------------------------

  const handlePress = useCallback(async () => {
    if (!editable || isLoading) return;

    const options: string[] = ["Take Photo", "Choose from Library"];
    if (imageUri) options.push("Remove Photo");
    options.push("Cancel");

    Alert.alert("Profile Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: handleTakePhoto,
      },
      {
        text: "Choose from Library",
        onPress: handlePickLibrary,
      },
      ...(imageUri
        ? [
            {
              text: "Remove Photo",
              style: "destructive" as const,
              onPress: handleRemovePhoto,
            },
          ]
        : []),
      {
        text: "Cancel",
        style: "cancel" as const,
      },
    ]);
  }, [editable, isLoading, imageUri]);

  const handleTakePhoto = useCallback(async () => {
    const perms = await GlobalProfileImageService.requestPermissions();
    if (!perms.camera) {
      Alert.alert(
        "Permission Required",
        "Camera access is needed to take a photo. Please enable it in Settings.",
      );
      return;
    }
    const uri = await GlobalProfileImageService.takePhoto();
    if (uri) await _save(uri);
  }, [userId]);

  const handlePickLibrary = useCallback(async () => {
    const perms = await GlobalProfileImageService.requestPermissions();
    if (!perms.library) {
      Alert.alert(
        "Permission Required",
        "Photo library access is needed. Please enable it in Settings.",
      );
      return;
    }
    const uri = await GlobalProfileImageService.pickFromLibrary();
    if (uri) await _save(uri);
  }, [userId]);

  const handleRemovePhoto = useCallback(async () => {
    setIsLoading(true);
    try {
      await GlobalProfileImageService.deleteProfileImage(userId);
      setImageUri(null);
      onImageChanged?.(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId, onImageChanged]);

  const _save = useCallback(
    async (pickedUri: string) => {
      setIsLoading(true);
      try {
        const saved = await GlobalProfileImageService.saveProfileImage(
          pickedUri,
          userId,
        );
        setImageUri(saved);
        onImageChanged?.(saved);
      } catch (e) {
        Alert.alert("Error", "Could not save profile photo. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [userId, onImageChanged],
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    overflow: "hidden" as const,
    backgroundColor: colors.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  const badgeSize = Math.round(size * 0.28);
  const badgeOffset = Math.round(size * 0.02);

  return (
    <Pressable
      onPress={handlePress}
      style={styles.wrapper}
      disabled={!editable}
      accessibilityLabel={
        editable ? "Change profile photo" : `${displayName} profile photo`
      }
      accessibilityRole="button"
    >
      {/* Avatar circle */}
      <View style={circleStyle}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: size, height: size }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <Text
            style={[
              styles.initials,
              {
                color: colors.secondary,
                fontSize: Math.round(size * 0.33),
                fontWeight: "700",
              },
            ]}
          >
            {getInitials(displayName)}
          </Text>
        )}
      </View>

      {/* Camera badge */}
      {editable && !isLoading && (
        <View
          style={[
            styles.cameraBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: colors.accent,
              bottom: badgeOffset,
              right: badgeOffset,
            },
          ]}
        >
          <Ionicons
            name="camera"
            size={Math.round(badgeSize * 0.55)}
            color="#fff"
          />
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    alignSelf: "center",
  },
  initials: {
    letterSpacing: 1,
  },
  cameraBadge: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
});
