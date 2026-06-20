import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { PressableScale } from '@/components/pressable-scale';
import { Spinner } from '@/components/spinner';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { INFO_PAGES, infoPageUrl, type InfoPageKey } from '@/lib/info-pages';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const DIVIDER = '#EEEEEE';

export default function InfoPageScreen() {
  const { slug } = useLocalSearchParams<{ slug: InfoPageKey }>();
  const router = useRouter();
  const { locale } = useLocale();
  const t = useT();

  const page = slug && INFO_PAGES[slug] ? INFO_PAGES[slug] : null;
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <PressableScale onPress={() => router.back()} scaleTo={0.88} haptic="back" style={styles.closeBtn}>
            <IconSymbol name="xmark" size={18} color={TEXT_PRIMARY} />
          </PressableScale>
          <View style={styles.titleSlot} pointerEvents="none">
            <ThemedText
              numberOfLines={1}
              style={[styles.title, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {page ? t(page.title) : ''}
            </ThemedText>
          </View>
        </View>
      </SafeAreaView>

      {page ? (
        <WebView
          source={{ uri: infoPageUrl(slug as InfoPageKey) }}
          originWhitelist={['*']}
          onLoadEnd={() => setLoading(false)}
          onLoadProgress={({ nativeEvent }) => {
            if (nativeEvent.progress >= 0.7) setLoading(false);
          }}
          style={styles.webview}
        />
      ) : null}

      {loading ? (
        <View style={styles.overlay} pointerEvents="none">
          <Spinner size={26} color={Colors.light.coral} trackColor="rgba(248,131,121,0.18)" />
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
    borderBottomColor: DIVIDER,
  },
  header: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
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
    alignSelf: 'flex-start',
    zIndex: 2,
  },
  titleSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 64,
  },
  title: { fontSize: 16, lineHeight: 21, color: TEXT_PRIMARY },
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
});
