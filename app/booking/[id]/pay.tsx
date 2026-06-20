import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import { PressableScale } from '@/components/pressable-scale';
import { Spinner } from '@/components/spinner';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { setConfirm } from '@/data/confirm-dialog';
import { cancelBooking } from '@/lib/api';
import { useLocale, useT } from '@/lib/i18n';

// Exact substrings Moyasar redirects the WebView to (per backend):
//  - calm-after-payment → attempt finished → verify via payment-status.
//  - calm-back-payment  → guest backed out → cancel the hold.
const RETURN_MARKER = 'calm-after-payment';
const CANCEL_MARKER = 'calm-back-payment';

export default function PaymentScreen() {
  const { id, bookingId, paymentUrl, startDate, endDate, guests, total } =
    useLocalSearchParams<{
      id: string;
      bookingId: string;
      paymentUrl: string;
      startDate?: string;
      endDate?: string;
      guests?: string;
      total?: string;
    }>();
  const router = useRouter();
  const { locale } = useLocale();
  const t = useT();

  // Only true until Moyasar's page first finishes loading. We never flip it
  // back on so it can't get stuck on sub-navigations / redirects.
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const settled = useRef(false);

  const requestExit = () => {
    setConfirm({
      title: t({ ar: 'هل تريد إلغاء الدفع؟', en: 'Cancel payment?' }),
      message: t({
        ar: 'سيتم إلغاء الحجز المؤقت إذا خرجت الآن.',
        en: 'Your held booking will be released if you leave now.',
      }),
      confirmLabel: t({ ar: 'خروج', en: 'Leave' }),
      cancelLabel: t({ ar: 'البقاء', en: 'Stay' }),
      destructive: true,
      onConfirm: cancelAndClose,
    });
    router.push('/confirm');
  };

  // ⑤ Attempt finished — hand off to the verification screen, which polls the
  // payment-status API (the source of truth; never trust the redirect alone).
  const goVerify = () => {
    if (settled.current) return;
    settled.current = true;
    router.replace({
      pathname: '/booking/[id]/after-payment',
      params: { id, bookingId, startDate, endDate, guests, total },
    });
  };

  // ⑥ Guest backed out / closed — release the hold. Safe: a paid booking comes
  // back confirmed, so we still route to verification; otherwise we just close.
  const cancelAndClose = async () => {
    if (settled.current) return;
    settled.current = true;
    setClosing(true);
    let status: string | null = null;
    try {
      const b = await cancelBooking(bookingId);
      status = b.status;
    } catch {
      // ignore — fall through to closing
    }
    if (status === 'confirmed') {
      router.replace({
        pathname: '/booking/[id]/after-payment',
        params: { id, bookingId },
      });
    } else {
      router.back();
    }
  };

  const handleNav = (navState: WebViewNavigation) => {
    // Hide the loader as soon as any document settles — onLoadEnd alone can be
    // skipped across Moyasar's redirect chain, leaving the spinner stuck.
    if (navState.loading === false) setLoading(false);
    const url = navState.url ?? '';
    if (settled.current) return;
    if (url.includes(RETURN_MARKER)) {
      goVerify();
    } else if (url.includes(CANCEL_MARKER)) {
      cancelAndClose();
    }
  };

  // Safety net: never let the loader hang past a few seconds, regardless of
  // which WebView load callbacks the hosted page does or doesn't fire.
  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 6000);
    return () => clearTimeout(id);
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <PressableScale
            onPress={requestExit}
            scaleTo={0.88}
            haptic="back"
            style={styles.closeBtn}>
            <IconSymbol name="xmark" size={18} color={Colors.light.text} />
          </PressableScale>
          <View style={styles.titleSlot} pointerEvents="none">
            <ThemedText
              style={[styles.title, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t({ ar: 'إتمام الدفع', en: 'Payment' })}
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>

      {paymentUrl ? (
        <WebView
          source={{ uri: paymentUrl }}
          originWhitelist={['*']}
          onLoadEnd={() => setLoading(false)}
          onLoadProgress={({ nativeEvent }) => {
            if (nativeEvent.progress >= 0.7) setLoading(false);
          }}
          onNavigationStateChange={handleNav}
          style={styles.webview}
        />
      ) : null}

      {loading || closing ? (
        <View style={styles.overlay} pointerEvents={closing ? 'auto' : 'none'}>
          <View style={styles.overlayCard}>
            <Spinner size={24} color={Colors.light.text} trackColor="rgba(0,0,0,0.12)" />
            {closing ? (
              <ThemedText
                style={[styles.overlayText, { fontFamily: fontFamilyFor('medium', locale) }]}>
                {t({ ar: 'جاري الإلغاء…', en: 'Cancelling…' })}
              </ThemedText>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerSafe: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EBEBEB',
  },
  header: {
    height: 52,
    paddingHorizontal: Spacing[5],
    justifyContent: 'center',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  titleSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, lineHeight: 21, color: Colors.light.text },
  webview: { flex: 1, backgroundColor: '#FFFFFF' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  overlayCard: {
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[5],
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  overlayText: { fontSize: 14, lineHeight: 20, color: Colors.light.text },
});
