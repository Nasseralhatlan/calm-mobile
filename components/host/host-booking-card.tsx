import { Image } from 'expo-image';
import { Linking, StyleSheet, View } from 'react-native';

import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { bookingStatusView } from '@/data/booking-status';
import { formatSar } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';
import type { ApiHostBookingItem } from '@/lib/api';
import { Spacing, fontFamilyFor } from '@/constants/theme';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';
const DIVIDER = '#F0F0F0';
const WHATSAPP_GREEN = '#25D366';

function formatRange(startISO: string, endISO: string, locale: 'ar' | 'en'): string {
  const a = new Date(`${startISO}T00:00:00`);
  const b = new Date(`${endISO}T00:00:00`);
  const fmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US', {
    day: 'numeric',
    month: 'short',
  });
  if (startISO === endISO) return fmt.format(a);
  return `${fmt.format(a)} – ${fmt.format(b)}`;
}

// Normalise a Saudi local number to wa.me form (966XXXXXXXXX).
function waNumber(phone: string): string {
  let d = phone.replace(/\D/g, '').replace(/^0+/, '');
  if (!d.startsWith('966')) d = `966${d}`;
  return d;
}

export function HostBookingCard({ booking }: { booking: ApiHostBookingItem }) {
  const { locale } = useLocale();
  const t = useT();
  const isRTL = locale === 'ar';
  const rowDir = 'row' as const;
  const align = 'left' as const;
  const wd = isRTL ? ('rtl' as const) : ('ltr' as const);

  const place = booking.place;
  const guest = booking.guest;
  const status = bookingStatusView(booking.status);
  const placeTitle = place?.title ?? t({ ar: 'حجز', en: 'Booking' });
  const guestName = guest?.name ?? t({ ar: 'ضيف', en: 'Guest' });

  const onContact = () => {
    if (!guest?.phone) return;
    Linking.openURL(`https://wa.me/${waNumber(guest.phone)}`).catch(() => {});
  };

  return (
    <View style={[styles.card, { flexDirection: rowDir }]}>
      <Image
        source={{ uri: place?.cover_photo_url ?? undefined }}
        style={styles.thumb}
        contentFit="cover"
        transition={250}
      />
      <View style={styles.body}>
        <View style={[styles.topRow, { flexDirection: rowDir }]}>
          <ThemedText
            numberOfLines={1}
            style={[styles.title, { fontFamily: fontFamilyFor('bold', locale), textAlign: align, writingDirection: wd }]}>
            {placeTitle}
          </ThemedText>
          <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
            <ThemedText style={[styles.statusChipText, { color: status.fg, fontFamily: fontFamilyFor('bold', locale) }]}>
              {t(status.label)}
            </ThemedText>
          </View>
        </View>

        <ThemedText
          numberOfLines={1}
          style={[styles.meta, { fontFamily: fontFamilyFor('regular', locale), textAlign: align, writingDirection: wd }]}>
          {guestName}
          {guest?.phone ? ` · ${guest.phone}` : ''}
        </ThemedText>

        <View style={[styles.bottomRow, { flexDirection: rowDir }]}>
          <ThemedText
            numberOfLines={1}
            style={[styles.meta, { fontFamily: fontFamilyFor('medium', locale), textAlign: align }]}>
            {formatRange(booking.start_date, booking.end_date, locale)} · {booking.guests}{' '}
            {t({ ar: 'ضيف', en: 'guests' })}
          </ThemedText>
          <ThemedText style={[styles.price, { fontFamily: fontFamilyFor('bold', locale) }]}>
            {formatSar(booking.pricing.total)}
          </ThemedText>
        </View>
      </View>

      {guest?.phone ? (
        <PressableScale onPress={onContact} scaleTo={0.9} haptic="select" style={styles.waBtn}>
          <WhatsAppIcon size={20} color="#FFFFFF" strokeWidth={1.7} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 0.5,
    borderColor: DIVIDER,
    padding: Spacing[2] + 2,
    alignItems: 'center',
    gap: Spacing[3],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: '#F3F4F6',
  },
  body: { flex: 1, gap: Spacing[1] + 2, paddingVertical: 2 },
  topRow: { alignItems: 'center', gap: Spacing[2] },
  title: { flex: 1, fontSize: 15, lineHeight: 20, color: TEXT_PRIMARY },
  meta: { fontSize: 12, lineHeight: 16, color: TEXT_SECONDARY },
  bottomRow: { marginTop: Spacing[1], alignItems: 'center', justifyContent: 'space-between', gap: Spacing[2] },
  price: { fontSize: 15, lineHeight: 20, color: TEXT_PRIMARY },
  statusChip: { paddingHorizontal: Spacing[2] + 2, paddingVertical: 3, borderRadius: 999 },
  statusChipText: { fontSize: 10, lineHeight: 13 },
  waBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHATSAPP_GREEN,
  },
});
