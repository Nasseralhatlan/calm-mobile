import { FlashList } from "@shopify/flash-list";
import { BlurView } from "expo-blur";
import { Stack, useRouter } from "expo-router";
import { useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ListingCard } from "@/components/listing-card";
import { PressableScale } from "@/components/pressable-scale";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, fontFamilyFor } from "@/constants/theme";
import { adaptApiPlaceToListing } from "@/data/place-adapter";
import { getPlaceList } from "@/data/place-list";
import type { Listing } from "@/data/types";
import { useLocale } from "@/lib/i18n";

const HEADER_ROW_HEIGHT = 52;

export default function PlaceListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const isRTL = locale === "ar";

  // Captured once on mount — the home carousel stashed the list here.
  const cfg = useRef(getPlaceList()).current;
  const listings = useMemo<Listing[]>(
    () => (cfg?.places ?? []).map((p) => adaptApiPlaceToListing(p)),
    [cfg],
  );

  const headerHeight = insets.top + HEADER_ROW_HEIGHT;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlashList
        data={listings}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => <ListingCard listing={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing[4],
          paddingBottom: insets.bottom + Spacing[10],
          paddingHorizontal: Spacing[5],
        }}
      />

      <View style={[styles.headerWrap, { height: headerHeight }]} pointerEvents="box-none">
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={styles.headerTint} pointerEvents="none" />
        <View style={[styles.headerRow, { marginTop: insets.top }]}>
          <PressableScale
            onPress={() => router.back()}
            scaleTo={0.88}
            haptic="back"
            style={styles.iconBtn}
          >
            <IconSymbol name={locale === "ar" ? "chevron.right" : "chevron.left"} size={20} color={Colors.light.text} />
          </PressableScale>
          <View style={styles.titleCenter} pointerEvents="none">
            <ThemedText
              numberOfLines={1}
              style={[
                styles.title,
                {
                  fontFamily: fontFamilyFor("bold", locale),
                  textAlign: "left",
                },
              ]}
            >
              {cfg?.title ?? ""}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: "hidden",
  },
  headerTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  headerRow: {
    height: HEADER_ROW_HEIGHT,
    paddingHorizontal: Spacing[4],
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  titleCenter: {
    position: "absolute",
    left: 56,
    right: 56,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    color: Colors.light.text,
  },
});
