import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HostHeader, HOST_HEADER_HEIGHT } from '@/components/host/host-header';
import { SkeletonBlock } from '@/components/skeleton-block';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useAuthState } from '@/data/auth-state';
import { getHostEarnings, type ApiHostEarnings } from '@/lib/api';
import { formatSar } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';

export default function HostFinance() {
  const t = useT();
  const { locale } = useLocale();
  const { token } = useAuthState();
  const isRTL = locale === 'ar';
  const align = 'left' as const;
  const wd = isRTL ? ('rtl' as const) : ('ltr' as const);
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + HOST_HEADER_HEIGHT;

  const [data, setData] = useState<ApiHostEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const loadedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let active = true;
      if (!loadedOnce.current) setLoading(true);
      getHostEarnings()
        .then((res) => {
          if (!active) return;
          setData(res);
          loadedOnce.current = true;
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [token]),
  );

  const Stat = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
    <View style={styles.statCard}>
      <ThemedText
        style={[styles.statLabel, { fontFamily: fontFamilyFor('regular', locale), textAlign: align, writingDirection: wd }]}>
        {label}
      </ThemedText>
      <ThemedText
        style={[styles.statValue, { color: accent ?? TEXT_PRIMARY, fontFamily: fontFamilyFor('bold', locale), textAlign: align }]}>
        {value}
      </ThemedText>
    </View>
  );

  return (
    <View style={styles.container}>
      <HostHeader title={t({ ar: 'الماليات', en: 'Finance' })} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: headerHeight + Spacing[4], paddingBottom: insets.bottom + Spacing[16] },
        ]}>
        {loading ? (
          <>
            <SkeletonBlock style={styles.heroSkel} />
            <View style={styles.row}>
              <SkeletonBlock style={styles.tileSkel} />
              <SkeletonBlock style={styles.tileSkel} />
            </View>
          </>
        ) : (
          <>
            {/* Total earnings hero */}
            <View style={styles.hero}>
              <ThemedText
                style={[styles.heroLabel, { fontFamily: fontFamilyFor('medium', locale), textAlign: align, writingDirection: wd }]}>
                {t({ ar: 'إجمالي الأرباح', en: 'Total earnings' })}
              </ThemedText>
              <ThemedText
                style={[styles.heroValue, { fontFamily: fontFamilyFor('bold', locale), textAlign: align }]}>
                {formatSar(data?.total ?? 0)}
              </ThemedText>
              <ThemedText
                style={[styles.heroSub, { fontFamily: fontFamilyFor('regular', locale), textAlign: align, writingDirection: wd }]}>
                {t({
                  ar: `من ${data?.bookings_count ?? 0} حجز مؤكد`,
                  en: `from ${data?.bookings_count ?? 0} confirmed bookings`,
                })}
              </ThemedText>
            </View>

            <View style={styles.row}>
              <Stat
                label={t({ ar: 'مدفوعة', en: 'Paid out' })}
                value={formatSar(data?.paid ?? 0)}
                accent="#15803D"
              />
              <Stat
                label={t({ ar: 'قيد الدفع', en: 'Pending payout' })}
                value={formatSar(data?.not_paid ?? 0)}
                accent="#B45309"
              />
            </View>

            <ThemedText
              style={[styles.note, { fontFamily: fontFamilyFor('regular', locale), textAlign: 'center' }]}>
              {t({
                ar: 'الأرباح بعد عمولة كالم. ضريبة القيمة المضافة تخص الضيف.',
                en: 'Earnings shown are after Calm’s commission. VAT belongs to the guest.',
              })}
            </ThemedText>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { paddingHorizontal: Spacing[5], gap: Spacing[4] },

  hero: {
    backgroundColor: '#000000',
    borderRadius: 24,
    borderCurve: 'continuous',
    padding: Spacing[5],
    gap: Spacing[1],
  },
  heroLabel: { fontSize: 14, lineHeight: 19, color: 'rgba(255,255,255,0.7)' },
  heroValue: { fontSize: 34, lineHeight: 42, color: '#FFFFFF' },
  heroSub: { fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  row: { flexDirection: 'row', gap: Spacing[3] },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 0.5,
    borderColor: '#F0F0F0',
    padding: Spacing[4],
    gap: Spacing[1],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  statLabel: { fontSize: 13, lineHeight: 18, color: TEXT_SECONDARY },
  statValue: { fontSize: 20, lineHeight: 26, color: TEXT_PRIMARY },

  note: { fontSize: 12, lineHeight: 17, color: Colors.light.textMuted, marginTop: Spacing[1] },

  heroSkel: { height: 132, borderRadius: 24 },
  tileSkel: { flex: 1, height: 92, borderRadius: 20 },
});
