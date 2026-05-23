import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Spacing, fontFamilyFor } from '@/constants/theme';
import { getListing } from '@/data/listings';
import { SERVICES } from '@/data/services';
import type { ServiceKind } from '@/data/types';
import { formatMoneyEn } from '@/lib/format';
import { fireHaptic } from '@/lib/haptics';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';
const TEXT_MUTED = '#CECECE';
const DIVIDER = '#EBEBEB';
const SURFACE = '#F4F4F4';

type Chip = { key: 'all' | ServiceKind; label: { ar: string; en: string } };

const CHIPS: Chip[] = [
  { key: 'all', label: { ar: 'الكل', en: 'All' } },
  { key: 'catering', label: { ar: 'الضيافة', en: 'Catering' } },
  { key: 'decoration', label: { ar: 'التنسيق', en: 'Decoration' } },
  { key: 'staff', label: { ar: 'الطاقم', en: 'Staff' } },
  { key: 'photography', label: { ar: 'التصوير', en: 'Photography' } },
  { key: 'entertainment', label: { ar: 'الترفيه', en: 'Entertainment' } },
];

export default function BookingServicesScreen() {
  const { id, startDate, endDate } = useLocalSearchParams<{
    id: string;
    startDate?: string;
    endDate?: string;
  }>();
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const insets = useSafeAreaInsets();
  const listing = getListing(id);

  const [activeChip, setActiveChip] = useState<Chip['key']>('all');
  const [qty, setQty] = useState<Record<string, number>>({});

  const visibleServices = useMemo(
    () => (activeChip === 'all' ? SERVICES : SERVICES.filter((s) => s.kind === activeChip)),
    [activeChip],
  );

  const selectedCount = useMemo(
    () => Object.values(qty).reduce((sum, n) => sum + (n > 0 ? 1 : 0), 0),
    [qty],
  );

  if (!listing) {
    return (
      <SafeAreaView style={styles.notFound}>
        <ThemedText variant="heading">Listing not found</ThemedText>
      </SafeAreaView>
    );
  }

  const onNext = () => {
    const serialized = Object.entries(qty)
      .filter(([, n]) => n > 0)
      .map(([sid, n]) => `${sid}:${n}`)
      .join(',');
    router.push({
      pathname: '/booking/[id]/summary',
      params: {
        id,
        startDate: startDate ?? '',
        endDate: endDate ?? '',
        services: serialized,
      },
    });
  };

  const bump = (sid: string, delta: number) => {
    fireHaptic('select');
    setQty((prev) => {
      const cur = prev[sid] ?? 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [sid]: next };
    });
  };

  const openDetails = (sid: string) => {
    router.push({
      pathname: '/booking/[id]/service/[sid]',
      params: { id, sid, startDate: startDate ?? '', endDate: endDate ?? '' },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <PressableScale
            onPress={() => router.back()}
            scaleTo={0.88}
            haptic="back"
            style={styles.closeBtn}>
            <IconSymbol name="xmark" size={18} color={Colors.light.text} />
          </PressableScale>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
          {/* Fancy hero title — one line */}
          <View style={styles.hero}>
            <ThemedText
              style={[
                styles.heroEmoji,
                { textAlign: isRTL ? 'right' : 'left' },
              ]}>
              ✨
            </ThemedText>
            <ThemedText
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={[
                styles.heroTitle,
                {
                  fontFamily: fontFamilyFor('black', locale),
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}>
              {t({ ar: 'خلنا نشيل الليلة عنك', en: 'Let us take care of your night' })}
            </ThemedText>
            <ThemedText
              style={[
                styles.heroSubtitle,
                {
                  fontFamily: fontFamilyFor('regular', locale),
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}>
              {t({
                ar: 'اختر الخدمات اللي تكمل أجواء مناسبتك',
                en: 'Pick the add-ons that complete your event',
              })}
            </ThemedText>
          </View>

          {/* Category chips — RTL via mirrorX trick */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={isRTL ? styles.mirrorX : undefined}
            contentContainerStyle={styles.chipsRow}>
            {CHIPS.map((chip) => {
              const active = chip.key === activeChip;
              return (
                <View key={chip.key} style={isRTL ? styles.mirrorX : undefined}>
                  <PressableScale
                    scaleTo={0.94}
                    haptic="select"
                    onPress={() => setActiveChip(chip.key)}
                    style={active ? [styles.chip, styles.chipActive] : styles.chip}>
                    <ThemedText
                      style={[
                        styles.chipLabel,
                        active && styles.chipLabelActive,
                        { fontFamily: fontFamilyFor(active ? 'bold' : 'medium', locale) },
                      ]}>
                      {t(chip.label)}
                    </ThemedText>
                  </PressableScale>
                </View>
              );
            })}
          </ScrollView>

          {/* Service cards: image + content + add control */}
          <View style={styles.list}>
            {visibleServices.map((s) => {
              const n = qty[s.id] ?? 0;
              const unitSuffix =
                s.unit === 'per_guest'
                  ? t({ ar: '/ ضيف', en: '/ guest' })
                  : s.unit === 'per_hour'
                    ? t({ ar: '/ ساعة', en: '/ hour' })
                    : '';
              return (
                <PressableScale
                  key={s.id}
                  scaleTo={0.99}
                  haptic="select"
                  onPress={() => openDetails(s.id)}
                  style={styles.card}>
                  <View style={styles.cardImageWrap}>
                    {s.imageUrl ? (
                      <Image
                        source={{ uri: s.imageUrl }}
                        style={styles.cardImage}
                        contentFit="cover"
                        transition={250}
                      />
                    ) : (
                      <View style={[styles.cardImage, styles.cardImageFallback]} />
                    )}

                    {/* Add pill on top-left of image */}
                    <View style={styles.addOverlay}>
                      {n === 0 ? (
                        <PressableScale
                          haptic="select"
                          onPress={() => bump(s.id, 1)}
                          scaleTo={0.94}
                          style={styles.addPill}>
                          <ThemedText
                            style={[
                              styles.addPillText,
                              { fontFamily: fontFamilyFor('bold', locale) },
                            ]}>
                            {t({ ar: 'أضف', en: 'Add' })}
                          </ThemedText>
                        </PressableScale>
                      ) : (
                        <View
                          style={[
                            styles.stepper,
                            { flexDirection: isRTL ? 'row-reverse' : 'row' },
                          ]}>
                          <PressableScale
                            onPress={() => bump(s.id, -1)}
                            haptic="select"
                            scaleTo={0.88}
                            style={styles.stepperBtn}>
                            <ThemedText style={styles.stepperBtnText}>−</ThemedText>
                          </PressableScale>
                          <ThemedText
                            style={[
                              styles.stepperValue,
                              { fontFamily: fontFamilyFor('bold', locale) },
                            ]}>
                            {n}
                          </ThemedText>
                          <PressableScale
                            onPress={() => bump(s.id, 1)}
                            haptic="select"
                            scaleTo={0.88}
                            style={styles.stepperBtn}>
                            <ThemedText style={styles.stepperBtnText}>+</ThemedText>
                          </PressableScale>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <ThemedText
                      numberOfLines={1}
                      style={[
                        styles.cardTitle,
                        {
                          fontFamily: fontFamilyFor('bold', locale),
                          textAlign: isRTL ? 'right' : 'left',
                          writingDirection: isRTL ? 'rtl' : 'ltr',
                        },
                      ]}>
                      {t(s.title)}
                    </ThemedText>
                    <ThemedText
                      numberOfLines={2}
                      style={[
                        styles.cardDesc,
                        {
                          fontFamily: fontFamilyFor('regular', locale),
                          textAlign: isRTL ? 'right' : 'left',
                          writingDirection: isRTL ? 'rtl' : 'ltr',
                        },
                      ]}>
                      {t(s.description)}
                    </ThemedText>

                    <View
                      style={[
                        styles.cardFooter,
                        { flexDirection: isRTL ? 'row-reverse' : 'row' },
                      ]}>
                      <ThemedText
                        style={[
                          styles.cardPrice,
                          { fontFamily: fontFamilyFor('bold', locale) },
                        ]}>
                        {formatMoneyEn(s.price, 0)} {unitSuffix}
                      </ThemedText>
                      <View style={{ flex: 1 }} />
                      <ThemedText
                        style={[
                          styles.cardDetailsLink,
                          { fontFamily: fontFamilyFor('medium', locale) },
                        ]}>
                        {t({ ar: 'تفاصيل ›', en: 'Details ›' })}
                      </ThemedText>
                    </View>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing[3] }]}>
          <PressableScale
            haptic="forward"
            scaleTo={0.98}
            onPress={onNext}
            style={styles.nextCta}>
            <ThemedText
              style={[styles.nextCtaText, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {selectedCount > 0
                ? `${t({ ar: 'التالي', en: 'Next' })} · ${selectedCount} ${t({
                    ar: 'خدمة',
                    en: selectedCount === 1 ? 'service' : 'services',
                  })}`
                : t({ ar: 'تخطّي وانتقل للحجز', en: 'Skip and continue' })}
            </ThemedText>
          </PressableScale>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mirrorX: { transform: [{ scaleX: -1 }] },

  header: {
    height: 56,
    paddingHorizontal: Spacing[5],
    justifyContent: 'center',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    position: 'absolute',
    left: Spacing[5],
    top: Spacing[2],
    zIndex: 2,
  },
  hero: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[6],
    gap: Spacing[3],
  },
  heroEmoji: {
    fontSize: 36,
    lineHeight: 42,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 34,
    color: TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: TEXT_SECONDARY,
  },

  chipsRow: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[2],
    paddingBottom: Spacing[4],
  },
  chip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2] + 2,
    borderRadius: 11,
    borderCurve: 'continuous',
    backgroundColor: SURFACE,
  },
  chipActive: {
    backgroundColor: '#000000',
  },
  chipLabel: {
    fontSize: 13,
    lineHeight: 17,
    color: TEXT_PRIMARY,
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },

  list: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[5],
  },
  card: {
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: DIVIDER,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  cardImageWrap: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
  },
  cardImageFallback: {
    backgroundColor: '#F3F4F6',
  },
  addOverlay: {
    position: 'absolute',
    top: Spacing[3],
    left: Spacing[3],
  },
  addPill: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2] + 2,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  addPillText: {
    fontSize: 13,
    lineHeight: 17,
    color: TEXT_PRIMARY,
  },

  cardBody: {
    padding: Spacing[4],
    gap: Spacing[2],
  },
  cardTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },

  stepper: {
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: 19,
    borderCurve: 'continuous',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 18,
    lineHeight: 22,
    color: TEXT_PRIMARY,
  },
  stepperValue: {
    fontSize: 14,
    lineHeight: 18,
    color: TEXT_PRIMARY,
    minWidth: 16,
    textAlign: 'center',
  },

  cardFooter: {
    alignItems: 'center',
    gap: Spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DIVIDER,
    paddingTop: Spacing[3],
  },
  cardPrice: {
    fontSize: 15,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
  cardDetailsLink: {
    fontSize: 13,
    lineHeight: 17,
    color: TEXT_MUTED,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DIVIDER,
  },
  nextCta: {
    backgroundColor: Colors.light.coral,
    paddingVertical: Spacing[4],
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.coral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  nextCtaText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 21,
  },
});
