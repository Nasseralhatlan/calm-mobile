import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeartIcon } from '@/components/icons/heart-icon';
import { ShareIcon } from '@/components/icons/share-icon';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLikes } from '@/data/likes';
import { getListing } from '@/data/listings';
import type { Listing } from '@/data/types';
import { useLocale, useT } from '@/lib/i18n';

const { width: SCREEN_W } = Dimensions.get('window');
const CHIP_W = 96;
const CHIP_H = 96;
const SECTION_PAD = Spacing[5];
const HEADER_ROW_HEIGHT = 52;

interface RoomGroup {
  key: string;
  title: { ar: string; en: string };
  detail: { ar: string; en: string };
  photos: string[];
}

function buildGroups(listing: Listing): RoomGroup[] {
  const p = listing.photos;
  const groups: RoomGroup[] = [];
  let i = 0;
  const take = (n: number) => {
    const slice = p.slice(i, i + n);
    i += n;
    return slice.length ? slice : [p[0]];
  };

  groups.push({
    key: 'living',
    title: { ar: 'الصالة', en: 'Living room' },
    detail: {
      ar: 'مكيف · تلفزيون · جلسة عربية · إضاءة هادئة',
      en: 'Air conditioning · TV · Majlis seating · Soft lighting',
    },
    photos: take(2),
  });
  groups.push({
    key: 'kitchen',
    title: { ar: 'المطبخ', en: 'Full kitchen' },
    detail: {
      ar: 'مطبخ كامل · ثلاجة · فرن · أدوات طبخ',
      en: 'Full kitchen · Fridge · Oven · Cookware',
    },
    photos: take(1),
  });
  groups.push({
    key: 'bedroom',
    title: { ar: 'غرفة النوم', en: 'Bedroom' },
    detail: {
      ar: 'سرير كنق · مكيف · خزانة · إضاءة جانبية',
      en: 'King bed · Air conditioning · Wardrobe · Bedside lighting',
    },
    photos: take(2),
  });
  groups.push({
    key: 'bath',
    title: { ar: 'الحمام', en: 'Full bath' },
    detail: {
      ar: 'دش · مناشف · شامبو وصابون',
      en: 'Shower · Towels · Shampoo & soap',
    },
    photos: take(1),
  });
  if (i < p.length) {
    groups.push({
      key: 'outdoor',
      title: { ar: 'الخارج', en: 'Outdoor' },
      detail: {
        ar: 'جلسة خارجية · مسبح · شواية',
        en: 'Outdoor seating · Pool · BBQ',
      },
      photos: p.slice(i),
    });
  }
  return groups;
}

function AspectImage({ uri }: { uri: string }) {
  const [aspect, setAspect] = useState(4 / 3);

  useEffect(() => {
    let mounted = true;
    RNImage.getSize(
      uri,
      (w, h) => {
        if (mounted && w > 0 && h > 0) setAspect(w / h);
      },
      () => {},
    );
    return () => {
      mounted = false;
    };
  }, [uri]);

  return (
    <ExpoImage
      source={{ uri }}
      style={[styles.photo, { aspectRatio: aspect }]}
      contentFit="cover"
      transition={180}
    />
  );
}

export default function ListingPhotosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useT();
  const { locale } = useLocale();
  const { has, toggle } = useLikes();

  const listing = getListing(id);
  const liked = listing ? has(listing.id) : false;

  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});
  const headerHeight = insets.top + HEADER_ROW_HEIGHT;

  const groups = useMemo(() => (listing ? buildGroups(listing) : []), [listing]);

  if (!listing) {
    return (
      <View style={styles.notFound}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText variant="heading">
          {t({ ar: 'لم يتم العثور على الصور', en: 'Photos not found' })}
        </ThemedText>
      </View>
    );
  }

  const close = () => {
    Haptics.selectionAsync().catch(() => {});
    router.back();
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggle(listing.id);
  };

  const onSectionLayout = (key: string) => (e: LayoutChangeEvent) => {
    sectionOffsets.current[key] = e.nativeEvent.layout.y;
  };

  const scrollToSection = (key: string) => {
    Haptics.selectionAsync().catch(() => {});
    const y = sectionOffsets.current[key];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: y - headerHeight - Spacing[2], animated: true });
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" animated />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: insets.bottom + Spacing[6],
        }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          {groups.map((g) => (
            <PressableScale
              key={g.key}
              onPress={() => scrollToSection(g.key)}
              scaleTo={0.95}
              style={styles.chip}>
              <ExpoImage
                source={{ uri: g.photos[0] }}
                style={styles.chipImage}
                contentFit="cover"
                transition={180}
              />
              <ThemedText
                numberOfLines={1}
                style={[styles.chipLabel, { fontFamily: fontFamilyFor('medium', locale) }]}>
                {t(g.title)}
              </ThemedText>
            </PressableScale>
          ))}
        </ScrollView>

        {groups.map((g) => (
          <View key={g.key} style={styles.section} onLayout={onSectionLayout(g.key)}>
            <ThemedText
              style={[styles.sectionTitle, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t(g.title)}
            </ThemedText>
            <ThemedText
              style={[styles.sectionDetail, { fontFamily: fontFamilyFor('regular', locale) }]}>
              {t(g.detail)}
            </ThemedText>
            <View style={styles.gallery}>
              {g.photos.map((url) => (
                <AspectImage key={url} uri={url} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.headerWrap, { height: headerHeight }]} pointerEvents="box-none">
        <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFillObject} />
        <View style={styles.headerTint} pointerEvents="none" />
        <View style={[styles.headerRow, { marginTop: insets.top }]}>
          <PressableScale onPress={close} scaleTo={0.88} style={styles.iconBtn}>
            <IconSymbol name="chevron.left" size={20} color={Colors.light.text} />
          </PressableScale>
          <View style={styles.titleCenter} pointerEvents="none">
            <ThemedText
              style={[styles.title, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t({ ar: 'جولة بالصور', en: 'Photo tour' })}
            </ThemedText>
          </View>
          <View style={styles.topActions}>
            <PressableScale onPress={() => {}} scaleTo={0.88} style={styles.iconBtn}>
              <ShareIcon size={18} stroke={Colors.light.text} strokeWidth={1.6} />
            </PressableScale>
            <PressableScale onPress={handleLike} scaleTo={0.88} style={styles.iconBtn}>
              <HeartIcon
                size={20}
                stroke={liked ? Colors.light.coral : Colors.light.text}
                fill={liked ? Colors.light.coral : 'none'}
                strokeWidth={1.8}
              />
            </PressableScale>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  headerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  headerRow: {
    height: HEADER_ROW_HEIGHT,
    paddingHorizontal: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    color: Colors.light.text,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  chipsRow: {
    paddingHorizontal: SECTION_PAD,
    paddingVertical: Spacing[4],
    gap: Spacing[3],
  },
  chip: {
    width: CHIP_W,
    gap: Spacing[2],
  },
  chipImage: {
    width: CHIP_W,
    height: CHIP_H,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    backgroundColor: '#F3F4F6',
  },
  chipLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.text,
    textAlign: 'center',
  },

  section: {
    paddingHorizontal: SECTION_PAD,
    paddingTop: Spacing[5],
    paddingBottom: Spacing[3],
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
    color: Colors.light.text,
    marginBottom: Spacing[2],
  },
  sectionDetail: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.textMuted,
    marginBottom: Spacing[4],
  },
  gallery: {
    gap: Spacing[3],
  },
  photo: {
    width: '100%',
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    backgroundColor: '#F3F4F6',
  },
});
