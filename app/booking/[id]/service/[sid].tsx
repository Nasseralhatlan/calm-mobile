import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { PlainModalShell } from '@/components/plain-modal-shell';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { getService } from '@/data/services';
import { formatMoneyEn } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';

export default function ServiceDetailsModal() {
  const { sid } = useLocalSearchParams<{ id: string; sid: string }>();
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const service = getService(sid);

  if (!service) return null;

  const unitSuffix =
    service.unit === 'per_guest'
      ? t({ ar: '/ ضيف', en: '/ guest' })
      : service.unit === 'per_hour'
        ? t({ ar: '/ ساعة', en: '/ hour' })
        : '';

  const highlights: { ar: string; en: string }[] = [
    {
      ar: 'فريق متخصص يصل قبل بداية المناسبة بساعتين',
      en: 'Specialist team arrives 2 hours before your event',
    },
    {
      ar: 'إعداد كامل وتنظيف بعد انتهاء المناسبة',
      en: 'Full setup and cleanup included after the event',
    },
    {
      ar: 'إمكانية تخصيص التفاصيل قبل الموعد بثلاثة أيام',
      en: 'Customise the details up to 3 days before the event',
    },
  ];

  return (
    <PlainModalShell title={t(service.title)}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        <View
          style={[
            styles.priceRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}>
          <ThemedText
            style={[styles.price, { fontFamily: fontFamilyFor('bold', locale) }]}>
            {formatMoneyEn(service.price, 0)}
          </ThemedText>
          {unitSuffix ? (
            <ThemedText
              style={[styles.priceUnit, { fontFamily: fontFamilyFor('regular', locale) }]}>
              {' '}
              {unitSuffix}
            </ThemedText>
          ) : null}
        </View>

        <ThemedText
          style={[
            styles.body,
            {
              fontFamily: fontFamilyFor('regular', locale),
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
          ]}>
          {t(service.description)}
        </ThemedText>

        <ThemedText
          style={[
            styles.sectionTitle,
            {
              fontFamily: fontFamilyFor('bold', locale),
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
          ]}>
          {t({ ar: 'ما يشمل الخدمة', en: 'What\'s included' })}
        </ThemedText>

        <View style={styles.highlights}>
          {highlights.map((h, i) => (
            <View
              key={i}
              style={[
                styles.highlightRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}>
              <View style={styles.checkBullet}>
                <IconSymbol name="checkmark" size={11} color="#FFFFFF" />
              </View>
              <ThemedText
                style={[
                  styles.highlightText,
                  {
                    fontFamily: fontFamilyFor('regular', locale),
                    textAlign: isRTL ? 'right' : 'left',
                    writingDirection: isRTL ? 'rtl' : 'ltr',
                  },
                ]}>
                {t(h)}
              </ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </PlainModalShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: Spacing[3],
    paddingBottom: Spacing[10],
    gap: Spacing[4],
  },
  priceRow: {
    alignItems: 'baseline',
  },
  price: {
    fontSize: 22,
    lineHeight: 28,
    color: TEXT_PRIMARY,
  },
  priceUnit: {
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_SECONDARY,
  },
  body: {
    fontSize: 14,
    lineHeight: 23,
    color: TEXT_PRIMARY,
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: TEXT_PRIMARY,
    marginTop: Spacing[2],
  },
  highlights: {
    gap: Spacing[3],
  },
  highlightRow: {
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  checkBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  highlightText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_PRIMARY,
  },
});
