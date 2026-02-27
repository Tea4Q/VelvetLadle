import { FontAwesome6 } from "@expo/vector-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { StyleProp, TextStyle } from "react-native";

type Props = {
  icon?: IconDefinition;
  name?: string;
  size?: number | string;
  color?: string;
  style?: StyleProp<TextStyle>;
  solid?: boolean;
};

function normalizeSize(size: number | string | undefined): number {
  if (typeof size === "number") {
    return size;
  }

  if (typeof size === "string") {
    const multiplierMatch = size.match(/^(\d+(?:\.\d+)?)x$/i);
    if (multiplierMatch) {
      return Math.round(parseFloat(multiplierMatch[1]) * 16);
    }

    const parsed = Number(size);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return 16;
}

function normalizeName(name: string | undefined): string {
  if (!name) {
    return "circle-question";
  }

  const withoutPrefix = name.startsWith("fa") ? name.slice(2) : name;
  return withoutPrefix
    .replace(/^[A-Z]/, (char) => char.toLowerCase())
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
}

export default function FontAwesomeIcon({ icon, name, size, color, style }: Props) {
  const resolvedName = icon?.iconName ?? normalizeName(name);

  return (
    <FontAwesome6
      name={resolvedName as any}
      size={normalizeSize(size)}
      color={color}
      style={style}
    />
  );
}
