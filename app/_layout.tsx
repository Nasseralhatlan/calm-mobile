import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplash } from '@/components/animated-splash';
import { LikesProvider } from '@/data/likes';
import { useBootstrap } from '@/hooks/use-bootstrap';
import { LocaleProvider } from '@/lib/i18n';
import { SplashStatusProvider } from '@/lib/splash-status';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Satoshi-Light': require('../assets/fonts/Satoshi-Light.ttf'),
    'Satoshi-Regular': require('../assets/fonts/Satoshi-Regular.ttf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.ttf'),
    'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.ttf'),
    'Satoshi-Black': require('../assets/fonts/Satoshi-Black.ttf'),
    'thmanyahsans-Light': require('../assets/fonts/thmanyahsans-Light.otf'),
    'thmanyahsans-Regular': require('../assets/fonts/thmanyahsans-Regular.otf'),
    'thmanyahsans-Medium': require('../assets/fonts/thmanyahsans-Medium.otf'),
    'thmanyahsans-Bold': require('../assets/fonts/thmanyahsans-Bold.otf'),
    'thmanyahsans-Black': require('../assets/fonts/thmanyahsans-Black.otf'),
  });

  const { isReady: bootstrapReady } = useBootstrap();
  const appReady = fontsLoaded && bootstrapReady;
  const [splashGone, setSplashGone] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LocaleProvider>
          <LikesProvider>
            <SplashStatusProvider gone={splashGone}>
              <ThemeProvider value={DefaultTheme}>
                <Stack screenOptions={{ contentStyle: { backgroundColor: '#FFFFFF' } }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="listing/[id]"
                    options={{ headerShown: false, animation: 'slide_from_bottom' }}
                  />
                  <Stack.Screen
                    name="listing/[id]/reserve"
                    options={{ presentation: 'modal', headerShown: false }}
                  />
                  <Stack.Screen
                    name="booking/[id]/confirmation"
                    options={{ headerShown: false, animation: 'fade' }}
                  />
                  <Stack.Screen
                    name="search"
                    options={{
                      presentation: 'transparentModal',
                      animation: 'none',
                      headerShown: false,
                      contentStyle: { backgroundColor: 'transparent' },
                    }}
                  />
                  <Stack.Screen
                    name="results"
                    options={{
                      headerShown: false,
                      animation: 'fade',
                      animationDuration: 220,
                    }}
                  />
                  <Stack.Screen
                    name="filters"
                    options={{
                      presentation: 'modal',
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="quick-filters"
                    options={{
                      presentation: 'modal',
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="listing/[id]/photos"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="listing/[id]/amenities"
                    options={{
                      presentation: 'transparentModal',
                      animation: 'none',
                      headerShown: false,
                      contentStyle: { backgroundColor: 'transparent' },
                    }}
                  />
                  <Stack.Screen
                    name="listing/[id]/reviews"
                    options={{
                      presentation: 'transparentModal',
                      animation: 'none',
                      headerShown: false,
                      contentStyle: { backgroundColor: 'transparent' },
                    }}
                  />
                  <Stack.Screen
                    name="listing/[id]/map"
                    options={{
                      presentation: 'transparentModal',
                      animation: 'none',
                      headerShown: false,
                      contentStyle: { backgroundColor: 'transparent' },
                    }}
                  />
                  <Stack.Screen
                    name="listing/[id]/dates"
                    options={{
                      presentation: 'transparentModal',
                      animation: 'none',
                      headerShown: false,
                      contentStyle: { backgroundColor: 'transparent' },
                    }}
                  />
                </Stack>
                <StatusBar style="dark" />
                {!splashGone ? (
                  <AnimatedSplash
                    appReady={appReady}
                    onAnimationFinished={() => setSplashGone(true)}
                  />
                ) : null}
              </ThemeProvider>
            </SplashStatusProvider>
          </LikesProvider>
        </LocaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
