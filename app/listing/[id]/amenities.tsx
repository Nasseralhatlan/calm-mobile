import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AmenityIcon } from '@/components/amenity-icon';
import { PlainModalShell } from '@/components/plain-modal-shell';
import { ThemedText } from '@/components/themed-text';
import { Spacing, fontFamilyFor } from '@/constants/theme';
import { AMENITIES } from '@/data/amenities';
import type { AmenityId } from '@/data/types';
import { useListingForId } from '@/hooks/use-listing-for-id';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_MUTED = '#9CA3AF';
const DIVIDER_COLOR = '#F0F0F0';

interface AmenityGroup {
  key: string;
  title: { ar: string; en: string };
  items: {
    key: string;
    iconEmoji: string | null;
    amenityId: AmenityId | null;
    label: { ar: string; en: string };
    count: number | null;
    description: string | null;
  }[];
}

export default function AmenitiesModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useLocale();
  const t = useT();
  const isRTL = locale === 'ar';
  const rowDir = isRTL ? 'row-reverse' : 'row';

  const { listing, apiDetail } = useListingForId(id);

  // Build grouped amenities. API attributes carry their own group (already
  // server-ordered); fixture amenities fall into a single anonymous group.
  const groups = useMemo<AmenityGroup[]>(() => {
    if (apiDetail?.attributes?.length) {
      const byGroup = new Map<string, AmenityGroup>();
      for (const a of apiDetail.attributes) {
        const g = a.attribute.group;
        const existing = byGroup.get(g.id);
        const count =
          typeof a.value === 'number'
            ? a.value
            : typeof a.value === 'string' && /^\d+$/.test(a.value)
              ? Number(a.value)
              : null;
        const item = {
          key: a.id,
          iconEmoji: a.attribute.icon ?? null,
          amenityId: null as AmenityId | null,
          label: { ar: a.attribute.name_ar, en: a.attribute.name_en },
          count,
          description: a.description ?? null,
        };
        if (existing) {
          existing.items.push(item);
        } else {
          byGroup.set(g.id, {
            key: g.id,
            title: { ar: g.name_ar, en: g.name_en },
            items: [item],
          });
        }
      }
      return Array.from(byGroup.values());
    }
    if (!listing?.amenities.length) return [];
    return [
      {
        key: 'all',
        title: { ar: 'كل المميزات', en: 'All features' },
        items: listing.amenities.map((aid) => ({
          key: aid,
          iconEmoji: null,
          amenityId: aid,
          label: AMENITIES[aid].label,
          count: null,
          description: null,
        })),
      },
    ];
  }, [apiDetail, listing]);

  return (
    <PlainModalShell title={t({ ar: 'كل المميزات', en: 'All features' })}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}>
        {groups.length === 0 ? (
          <ThemedText
            style={[
              styles.empty,
              { fontFamily: fontFamilyFor('regular', locale), textAlign: isRTL ? 'right' : 'left' },
            ]}>
            {t({ ar: 'لا توجد مميزات بعد', en: 'No features yet' })}
          </ThemedText>
        ) : null}

        {/* Group title sits outside; a white profile-style card holds the list. */}
        {groups.map((group) => (
          <View key={group.key} style={styles.groupBlock}>
            <ThemedText
              style={[
                styles.groupTitle,
                {
                  fontFamily: fontFamilyFor('bold', locale),
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
              ]}>
              {t(group.title)}
            </ThemedText>
            <View style={styles.groupCard}>
            {group.items.map((a, i) => {
              const hasCount = a.count !== null && a.count > 0;
              return (
                <View
                  key={a.key}
                  style={[styles.itemRow, i > 0 && styles.itemRowDivider]}>
                  <View style={[styles.itemHead, { flexDirection: rowDir }]}>
                    {a.amenityId ? (
                      <AmenityIcon id={a.amenityId} size={18} />
                    ) : (
                      <ThemedText style={styles.emoji}>{a.iconEmoji ?? '•'}</ThemedText>
                    )}
                    <ThemedText
                      style={[
                        styles.label,
                        {
                          fontFamily: fontFamilyFor('medium', locale),
                          textAlign: isRTL ? 'right' : 'left',
                        },
                      ]}>
                      {t(a.label)}
                    </ThemedText>
                    {hasCount ? (
                      <View style={styles.countBadge}>
                        <ThemedText
                          style={[
                            styles.countBadgeText,
                            { fontFamily: fontFamilyFor('bold', 'en') },
                          ]}>
                          {a.count}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                  {a.description ? (
                    <ThemedText
                      style={[
                        styles.itemDesc,
                        {
                          fontFamily: fontFamilyFor('regular', locale),
                          textAlign: isRTL ? 'right' : 'left',
                          writingDirection: isRTL ? 'rtl' : 'ltr',
                        },
                      ]}>
                      {a.description}
                    </ThemedText>
                  ) : null}
                </View>
              );
            })}
            </View>
          </View>
        ))}
      </ScrollView>
    </PlainModalShell>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  list: { paddingBottom: Spacing[10], flexGrow: 1 },
  groupBlock: {
    marginBottom: Spacing[6],
    gap: Spacing[3],
  },
  groupTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: TEXT_PRIMARY,
    paddingHorizontal: Spacing[1],
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[1],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 50,
    elevation: 4,
  },
  itemRow: {
    paddingVertical: Spacing[3],
    gap: 4,
  },
  itemRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: DIVIDER_COLOR,
  },
  itemHead: {
    alignItems: 'center',
    gap: Spacing[3],
  },
  emoji: {
    fontSize: 18,
    lineHeight: 24,
    width: 28,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    color: TEXT_PRIMARY,
    flex: 1,
  },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#111111',
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    color: '#FFFFFF',
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: TEXT_MUTED,
    paddingHorizontal: Spacing[6],
  },
  empty: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_MUTED,
    paddingVertical: Spacing[6],
  },
});
