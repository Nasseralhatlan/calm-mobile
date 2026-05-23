import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { getListing } from '@/data/listings';
import { SERVICES } from '@/data/services';
import type { AddOnService } from '@/data/types';
import { formatMoney, nightsBetween } from '@/lib/format';
import { fireHaptic } from '@/lib/haptics';
import { useLocale, useT } from '@/lib/i18n';
import { STR } from '@/lib/strings';

const STUB_CHECK_IN = '2026-06-20';
const STUB_CHECK_OUT = '2026-06-22';

interface ServiceTotalResult {
  service: AddOnService;
  qty: number;
  total: number;
}

function totalForService(service: AddOnService, qty: number, guests: number): number {
  if (service.unit === 'flat') return qty > 0 ? service.price : 0;
  if (service.unit === 'per_guest') return service.price * guests * qty;
  return service.price * qty;
}

export default function ReserveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();

  const listing = getListing(id);
  const [guests, setGuests] = useState(8);
  const [serviceQty, setServiceQty] = useState<Record<string, number>>({});

  const nights = nightsBetween(STUB_CHECK_IN, STUB_CHECK_OUT);

  const breakdown = useMemo(() => {
    if (!listing) return null;
    const subtotal = listing.pricing.nightly * nights;
    const cleaningFee = listing.pricing.cleaningFee;
    const serviceFee = listing.pricing.serviceFee;
    const servicesEntries: ServiceTotalResult[] = SERVICES.map((s) => ({
      service: s,
      qty: serviceQty[s.id] ?? 0,
      total: totalForService(s, serviceQty[s.id] ?? 0, guests),
    })).filter((r) => r.qty > 0);
    const servicesTotal = servicesEntries.reduce((sum, r) => sum + r.total, 0);
    const total = subtotal + cleaningFee + serviceFee + servicesTotal;
    return { subtotal, cleaningFee, serviceFee, servicesEntries, servicesTotal, total };
  }, [listing, nights, guests, serviceQty]);

  if (!listing || !breakdown) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText variant="heading">Listing not found</ThemedText>
      </SafeAreaView>
    );
  }

  const bumpService = (id: string, delta: number) => {
    fireHaptic('select');
    setServiceQty((prev) => {
      const cur = prev[id] ?? 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [id]: next };
    });
  };

  const onConfirm = () => {
    router.replace(`/booking/${listing.id}/confirmation`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <IconButton name="xmark" size={20} haptic="back" onPress={() => router.back()} />
        <ThemedText variant="bodyMedium" style={{ flex: 1, textAlign: 'center' }}>
          {t(STR.reserve.title)}
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Trip summary */}
        <View style={styles.section}>
          <ThemedText variant="caption" tone="muted">
            {t({ ar: 'الحجز في', en: 'Your trip to' })}
          </ThemedText>
          <ThemedText variant="heading" style={{ marginTop: 2 }}>
            {t(listing.title)}
          </ThemedText>
        </View>

        {/* Dates */}
        <View style={styles.section}>
          <ThemedText variant="bodyMedium">{t(STR.reserve.dates)}</ThemedText>
          <ThemedText variant="body" tone="muted" style={{ marginTop: 4 }}>
            {STUB_CHECK_IN} → {STUB_CHECK_OUT} · {nights} {t(STR.common.nights)}
          </ThemedText>
          <ThemedText variant="caption" tone="muted" style={{ marginTop: 4 }}>
            {t({ ar: '(منتقي التاريخ قريباً)', en: '(Date picker coming next)'})}
          </ThemedText>
        </View>

        <View style={styles.divider} />

        {/* Guests */}
        <View style={styles.section}>
          <ThemedText variant="bodyMedium">{t(STR.reserve.guests)}</ThemedText>
          <View style={styles.stepperRow}>
            <Stepper value={guests} onChange={setGuests} min={1} max={listing.capacity.guests} />
            <ThemedText variant="caption" tone="muted">
              {t({ ar: 'الحد الأقصى', en: 'Max' })} {listing.capacity.guests}
            </ThemedText>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Services */}
        <View style={styles.section}>
          <ThemedText variant="heading">{t(STR.reserve.services)}</ThemedText>
          <ThemedText variant="caption" tone="muted" style={{ marginBottom: Spacing[3] }}>
            {t({
              ar: 'خدمات إضافية تجعل مناسبتك مميزة',
              en: 'Add-ons to make your event special',
            })}
          </ThemedText>
          {SERVICES.map((s) => {
            const qty = serviceQty[s.id] ?? 0;
            return (
              <View key={s.id} style={styles.serviceRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText variant="bodyMedium">{t(s.title)}</ThemedText>
                  <ThemedText variant="caption" tone="muted">
                    {t(s.description)}
                  </ThemedText>
                  <ThemedText variant="caption" style={{ marginTop: 4, color: Colors.light.coral }}>
                    {formatMoney(s.price, locale)}{' '}
                    {s.unit === 'per_guest'
                      ? t({ ar: '/ ضيف', en: '/ guest' })
                      : s.unit === 'per_hour'
                        ? t({ ar: '/ ساعة', en: '/ hour' })
                        : ''}
                  </ThemedText>
                </View>
                <View style={styles.qtyControls}>
                  <Pressable
                    onPress={() => bumpService(s.id, -1)}
                    style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]}>
                    <ThemedText variant="bodyMedium">−</ThemedText>
                  </Pressable>
                  <ThemedText variant="bodyMedium" style={{ width: 22, textAlign: 'center' }}>
                    {qty}
                  </ThemedText>
                  <Pressable onPress={() => bumpService(s.id, 1)} style={styles.qtyBtn}>
                    <ThemedText variant="bodyMedium">+</ThemedText>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* Summary */}
        <View style={styles.section}>
          <ThemedText variant="heading">{t(STR.reserve.summary)}</ThemedText>
          <SummaryRow
            label={`${formatMoney(listing.pricing.nightly, locale)} × ${nights} ${t(STR.common.nights)}`}
            value={formatMoney(breakdown.subtotal, locale)}
          />
          <SummaryRow
            label={t(STR.reserve.cleaningFee)}
            value={formatMoney(breakdown.cleaningFee, locale)}
          />
          <SummaryRow
            label={t(STR.reserve.serviceFee)}
            value={formatMoney(breakdown.serviceFee, locale)}
          />
          {breakdown.servicesEntries.map((s) => (
            <SummaryRow
              key={s.service.id}
              label={`${t(s.service.title)} × ${s.qty}`}
              value={formatMoney(s.total, locale)}
            />
          ))}
          <View style={styles.totalRow}>
            <ThemedText variant="bodyMedium">{t(STR.reserve.total)}</ThemedText>
            <ThemedText variant="bodyMedium">{formatMoney(breakdown.total, locale)}</ThemedText>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView style={styles.footer} edges={['bottom']}>
        <View style={styles.footerInner}>
          <Button label={t(STR.reserve.confirm)} size="lg" fullWidth haptic="forward" onPress={onConfirm} />
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

function Stepper({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <View style={styles.qtyControls}>
      <Pressable
        onPress={() => {
          fireHaptic('select');
          onChange(Math.max(min, value - 1));
        }}
        style={[styles.qtyBtn, value <= min && styles.qtyBtnDisabled]}>
        <ThemedText variant="bodyMedium">−</ThemedText>
      </Pressable>
      <ThemedText variant="bodyMedium" style={{ width: 28, textAlign: 'center' }}>
        {value}
      </ThemedText>
      <Pressable
        onPress={() => {
          fireHaptic('select');
          onChange(Math.min(max, value + 1));
        }}
        style={[styles.qtyBtn, value >= max && styles.qtyBtnDisabled]}>
        <ThemedText variant="bodyMedium">+</ThemedText>
      </Pressable>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText variant="body" tone="muted" style={{ flex: 1 }}>
        {label}
      </ThemedText>
      <ThemedText variant="body">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.divider,
  },
  section: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.divider,
    marginHorizontal: Spacing[5],
  },
  stepperRow: {
    marginTop: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.divider,
    gap: Spacing[3],
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: { opacity: 0.4 },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: Spacing[2],
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    marginTop: Spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  footerInner: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
  },
});
