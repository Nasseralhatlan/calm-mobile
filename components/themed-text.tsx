import { Text, type TextProps } from "react-native";

import { type TypeName, typeFor } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useLocale } from "@/lib/i18n";

export type ThemedTextProps = TextProps & {
    lightColor?: string;
    darkColor?: string;
    variant?: TypeName;
    tone?: "default" | "muted" | "coral" | "danger" | "success" | "link";
};

const TONE_TO_COLOR = {
    default: "text",
    muted: "textMuted",
    coral: "coral",
    danger: "danger",
    success: "success",
    link: "coral",
} as const;

export function ThemedText({
    style,
    lightColor,
    darkColor,
    variant = "body",
    tone = "default",
    ...rest
}: ThemedTextProps) {
    const color = useThemeColor(
        { light: lightColor, dark: darkColor },
        TONE_TO_COLOR[tone],
    );
    const { locale } = useLocale();

    return (
        <Text style={[{ color }, typeFor(variant, locale), style]} {...rest} />
    );
}
