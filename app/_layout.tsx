import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AnimatedSplash } from "@/components/animated-splash";
import { ModeBootstrap } from "@/components/mode-bootstrap";
import { AppModeProvider } from "@/data/app-mode";
import { AuthStateProvider } from "@/data/auth-state";
import { HomeDataProvider } from "@/data/home";
import { LikesProvider } from "@/data/likes";
import { LoginCountryProvider } from "@/data/login-country";
import { SelectedCityProvider } from "@/data/selected-city";
import { useBootstrap } from "@/hooks/use-bootstrap";
import { LocaleProvider } from "@/lib/i18n";
import { SplashStatusProvider } from "@/lib/splash-status";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
    anchor: "(tabs)",
};

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        "Satoshi-Light": require("../assets/fonts/Satoshi-Light.ttf"),
        "Satoshi-Regular": require("../assets/fonts/Satoshi-Regular.ttf"),
        "Satoshi-Medium": require("../assets/fonts/Satoshi-Medium.ttf"),
        "Satoshi-Bold": require("../assets/fonts/Satoshi-Bold.ttf"),
        "Satoshi-Black": require("../assets/fonts/Satoshi-Black.ttf"),
        "thmanyahsans-Light": require("../assets/fonts/thmanyahsans-Light.otf"),
        "thmanyahsans-Regular": require("../assets/fonts/thmanyahsans-Regular.otf"),
        "thmanyahsans-Medium": require("../assets/fonts/thmanyahsans-Medium.otf"),
        "thmanyahsans-Bold": require("../assets/fonts/thmanyahsans-Bold.otf"),
        "thmanyahsans-Black": require("../assets/fonts/thmanyahsans-Black.otf"),
    });

    const { isReady: bootstrapReady, data: homeData, refresh: refreshHome } = useBootstrap();
    const appReady = fontsLoaded && bootstrapReady;
    const [splashGone, setSplashGone] = useState(false);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <LocaleProvider>
                    <HomeDataProvider value={homeData} refresh={refreshHome}>
                        <SelectedCityProvider>
                            <AuthStateProvider>
                                <AppModeProvider>
                                    <LoginCountryProvider>
                                        <LikesProvider>
                                            <SplashStatusProvider
                                                gone={splashGone}
                                            >
                                                <ThemeProvider
                                                    value={DefaultTheme}
                                                >
                                                    <Stack
                                                        screenOptions={{
                                                            contentStyle: {
                                                                backgroundColor:
                                                                    "#FEFEFE",
                                                            },
                                                        }}
                                                    >
                                                        <Stack.Screen
                                                            name="(tabs)"
                                                            options={{
                                                                headerShown: false,
                                                                animation:
                                                                    "fade",
                                                                animationDuration: 240,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="(host)"
                                                            options={{
                                                                headerShown: false,
                                                                animation:
                                                                    "fade",
                                                                animationDuration: 240,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="mode-transition"
                                                            options={{
                                                                headerShown: false,
                                                                animation:
                                                                    "fade",
                                                                animationDuration: 240,
                                                                gestureEnabled: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="listing/[id]/index"
                                                            options={{
                                                                headerShown: false,
                                                                animation:
                                                                    "slide_from_right",
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="booking/[id]/confirmation"
                                                            options={{
                                                                headerShown: false,
                                                                animation:
                                                                    "fade",
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="booking/[id]/dates"
                                                            options={{
                                                                presentation:
                                                                    "modal",
                                                                headerShown: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="booking/[id]/after-payment"
                                                            options={{
                                                                headerShown: false,
                                                                animation:
                                                                    "fade",
                                                                gestureEnabled: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="booking/[id]/pay"
                                                            options={{
                                                                headerShown: false,
                                                                presentation:
                                                                    "card",
                                                                animation:
                                                                    "slide_from_bottom",
                                                                gestureEnabled: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="booking/[id]/summary"
                                                            options={{
                                                                headerShown: false,
                                                                presentation:
                                                                    "card",
                                                                animation:
                                                                    "slide_from_right",
                                                                gestureEnabled: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="search"
                                                            options={{
                                                                presentation:
                                                                    "transparentModal",
                                                                animation:
                                                                    "none",
                                                                headerShown: false,
                                                                contentStyle: {
                                                                    backgroundColor:
                                                                        "transparent",
                                                                },
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="results"
                                                            options={{
                                                                headerShown: false,
                                                                animation:
                                                                    "fade",
                                                                animationDuration: 220,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="filters"
                                                            options={{
                                                                presentation:
                                                                    "modal",
                                                                headerShown: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="quick-filters"
                                                            options={{
                                                                presentation:
                                                                    "modal",
                                                                headerShown: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="cities"
                                                            options={{
                                                                presentation:
                                                                    "modal",
                                                                headerShown: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="login"
                                                            options={{
                                                                presentation:
                                                                    "modal",
                                                                headerShown: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="support"
                                                            options={{
                                                                presentation:
                                                                    "formSheet",
                                                                sheetAllowedDetents:
                                                                    [0.4],
                                                                sheetGrabberVisible: true,
                                                                headerShown: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="edit-profile"
                                                            options={{
                                                                presentation:
                                                                    "modal",
                                                                headerShown: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="confirm"
                                                            options={{
                                                                presentation:
                                                                    "formSheet",
                                                                sheetAllowedDetents:
                                                                    "fitToContents",
                                                                sheetGrabberVisible: true,
                                                                headerShown: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="date-picker"
                                                            options={{
                                                                presentation:
                                                                    "formSheet",
                                                                sheetAllowedDetents:
                                                                    "fitToContents",
                                                                sheetGrabberVisible: true,
                                                                headerShown: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="page/[slug]"
                                                            options={{
                                                                presentation:
                                                                    "modal",
                                                                headerShown: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="booking-info"
                                                            options={{
                                                                presentation:
                                                                    "modal",
                                                                headerShown: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="leave-review"
                                                            options={{
                                                                presentation:
                                                                    "modal",
                                                                headerShown: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="country-picker"
                                                            options={{
                                                                presentation:
                                                                    "modal",
                                                                headerShown: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="listing/[id]/photos"
                                                            options={{
                                                                headerShown: false,
                                                                animation:
                                                                    "slide_from_right",
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="photo-viewer"
                                                            options={{
                                                                headerShown: false,
                                                                animation:
                                                                    "slide_from_right",
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="place-list"
                                                            options={{
                                                                headerShown: false,
                                                                animation:
                                                                    "slide_from_right",
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="listing/[id]/amenities"
                                                            options={{
                                                                presentation:
                                                                    "modal",
                                                                headerShown: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="listing/[id]/description"
                                                            options={{
                                                                presentation:
                                                                    "modal",
                                                                headerShown: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="listing/[id]/reviews"
                                                            options={{
                                                                presentation:
                                                                    "modal",
                                                                headerShown: false,
                                                            }}
                                                        />
                                                        <Stack.Screen
                                                            name="listing/[id]/dates"
                                                            options={{
                                                                presentation:
                                                                    "transparentModal",
                                                                animation:
                                                                    "none",
                                                                headerShown: false,
                                                                contentStyle: {
                                                                    backgroundColor:
                                                                        "transparent",
                                                                },
                                                            }}
                                                        />
                                                    </Stack>
                                                    <ModeBootstrap />
                                                    <StatusBar style="dark" />
                                                    {!splashGone ? (
                                                        <AnimatedSplash
                                                            appReady={appReady}
                                                            onAnimationFinished={() =>
                                                                setSplashGone(
                                                                    true,
                                                                )
                                                            }
                                                        />
                                                    ) : null}
                                                </ThemeProvider>
                                            </SplashStatusProvider>
                                        </LikesProvider>
                                    </LoginCountryProvider>
                                </AppModeProvider>
                            </AuthStateProvider>
                        </SelectedCityProvider>
                    </HomeDataProvider>
                </LocaleProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
