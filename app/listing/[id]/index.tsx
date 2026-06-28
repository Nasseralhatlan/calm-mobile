import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AmenityIcon } from "@/components/amenity-icon";
import { FloatingCircleButton } from "@/components/floating-circle-button";
import { HeroCarousel } from "@/components/hero-carousel";
import { HeartIcon } from "@/components/icons/heart-icon";
import { ShareIcon } from "@/components/icons/share-icon";
import { StarIcon } from "@/components/icons/star-icon";
import { SwitchIcon } from "@/components/icons/switch-icon";
import { RatingSummary } from "@/components/listing/rating-summary";
import { PressableScale } from "@/components/pressable-scale";
import { ReserveBar } from "@/components/reserve-bar";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Spacing, fontFamilyFor } from "@/constants/theme";
import { AMENITIES } from "@/data/amenities";
import { useLikes } from "@/data/likes";
import { addPlaceInterest, seedPlace } from "@/data/place-interest";
import {
    fetchUnavailableDates,
    getCachedUnavailableDates,
} from "@/data/unavailable-dates-cache";
import { useListingForId } from "@/hooks/use-listing-for-id";
import { rangeHasBlockedDay } from "@/lib/date-key";
import { formatTime12 } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { sharePlace } from "@/lib/share";

const { width: SCREEN_W } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_W * 0.95;
const CARD_OVERLAP = 28;
const CARD_RADIUS = 32;
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#CECECE";
const DIVIDER_COLOR = "#F4F4F4";
const SPACE_CARD_W = 152;
const SPACE_CARD_H = 99;
const DESC_SHOW_MORE_THRESHOLD = 220;
// One review comment takes ~60% of the screen so the next one (~40%) clearly
// peeks in; snaps one comment at a time.
const REVIEW_ITEM_W = Math.round(SCREEN_W * 0.7);

// Month + year for a review's date — always English.
function formatReviewDate(iso: string): string {
    try {
        return new Intl.DateTimeFormat("en-US", {
            month: "long",
            year: "numeric",
        }).format(new Date(iso));
    } catch {
        return "";
    }
}

type SectionKey =
    | "description"
    | "facilities"
    | "features"
    | "location"
    | "reviews"
    | "rules";

export default function ListingDetailScreen() {
    const { id, startDate, endDate } = useLocalSearchParams<{
        id: string;
        startDate?: string;
        endDate?: string;
    }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { locale } = useLocale();
    const isRTL = locale === "ar";
    const t = useT();
    const { isLiked, toggle } = useLikes();

    // Hybrid data source: fixture → cached API → background detail fetch.
    const { listing, apiDetail } = useListingForId(id);

    // Warm only the first few photos so the hero is instant; the rest load
    // lazily as the user swipes (avoids decoding a whole 100-photo place upfront).
    useEffect(() => {
        if (!listing?.photos.length) return;
        for (const url of listing.photos.slice(0, 3)) {
            Image.prefetch(url).catch(() => {});
        }
    }, [listing?.photos]);

    // Published reviews from the API (up to 10). Empty → the section hides.
    const reviews = apiDetail?.reviews_recent ?? [];
    const reviewerName = (n: string | null) =>
        n?.trim() || t({ ar: "ضيف", en: "Guest" });

    // Normalized amenity list — when the place came from the API, we render
    // its `attributes[]` directly (UUIDs don't exist in the local AMENITIES
    // enum, so the AmenityId/AMENITIES path can't be used).
    type AmenityDisplay = {
        key: string;
        iconEmoji: string | null;
        amenityId: import("@/data/types").AmenityId | null;
        label: { ar: string; en: string };
    };

    const amenityDisplay = useMemo<AmenityDisplay[]>(() => {
        if (apiDetail?.attributes?.length) {
            return apiDetail.attributes.map((a) => ({
                key: a.id,
                iconEmoji: a.attribute.icon ?? null,
                amenityId: null,
                label: {
                    ar: a.attribute.name_ar,
                    en: a.attribute.name_en,
                },
            }));
        }
        if (!listing) return [];
        return listing.amenities.map((a) => ({
            key: a,
            iconEmoji: null,
            amenityId: a,
            label: AMENITIES[a].label,
        }));
    }, [apiDetail, listing]);

    // Prominent "Highlights" — admin-flagged amenities, kept in server order.
    // Show the top 3; these also stay in the normal features list below.
    const highlights = useMemo(
        () =>
            (apiDetail?.attributes ?? [])
                .filter((a) => a.attribute.is_highlighted)
                .slice(0, 3)
                .map((a) => ({
                    key: a.id,
                    icon: a.attribute.icon ?? null,
                    label: { ar: a.attribute.name_ar, en: a.attribute.name_en },
                    description: a.description ?? null,
                })),
        [apiDetail],
    );

    const scrollY = useSharedValue(0);
    const [statusStyle, setStatusStyle] = useState<"light" | "dark">("light");
    const [reserving, setReserving] = useState(false);

    const STICKY_FADE_END = HERO_HEIGHT - CARD_OVERLAP - 20;
    const STICKY_FADE_START = STICKY_FADE_END - 80;

    const onScroll = useAnimatedScrollHandler({
        onScroll: (e) => {
            const y = e.contentOffset.y;
            scrollY.value = y;
            const next: "light" | "dark" =
                y > HERO_HEIGHT - 80 ? "dark" : "light";
            runOnJS(setStatusStyle)(next);
        },
    });

    const stickyHeaderStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [STICKY_FADE_START, STICKY_FADE_END],
            [0, 1],
            Extrapolation.CLAMP,
        );
        const translateY = interpolate(
            scrollY.value,
            [STICKY_FADE_START, STICKY_FADE_END],
            [-8, 0],
            Extrapolation.CLAMP,
        );
        return { opacity, transform: [{ translateY }] };
    });

    const liked = listing ? isLiked(listing.id, listing.isLiked) : false;

    // --- Interest scoring (local) -----------------------------------------
    // Each interaction bumps this place's stored score (deduped once per session
    // in the store); the home screen surfaces the highest-interest place.
    const contentHRef = useRef(0);
    const viewportHRef = useRef(0);

    // Seed the place so the home card has a title + photo to render.
    useEffect(() => {
        if (listing)
            seedPlace(listing.id, listing.title, listing.photos[0] ?? null, {
                city: listing.city,
                area: listing.region,
                guests: listing.capacity.guests,
            });
    }, [listing]);

    // Scroll depth on the details page → counts once at ≥60%.
    const sampleScroll = useCallback(
        (e: { nativeEvent: { contentOffset: { y: number } } }) => {
            if (!listing) return;
            const y = e.nativeEvent.contentOffset.y;
            const ch = contentHRef.current;
            const vh = viewportHRef.current;
            const depth = ch > 0 ? Math.min(1, (y + vh) / ch) : 0;
            if (depth >= 0.6) addPlaceInterest(listing.id, "scroll", 8);
        },
        [listing],
    );

    const handleLike = () => {
        if (!listing) return;
        // Counts even when logged out (toggle redirects to login afterwards).
        if (!liked) addPlaceInterest(listing.id, "like", 15);
        toggle(listing.id, liked);
    };

    // Only show parts the backend actually returned (no "0 guests", no empty
    // region segment).
    const subtitle = useMemo(() => {
        if (!listing) return "";
        const parts = [t(listing.city), t(listing.region)].filter(
            (s) => s.trim().length > 0,
        );
        if (listing.capacity.guests > 0) {
            parts.push(
                `${listing.capacity.guests} ${t({ ar: "ضيف", en: "guests" })}`,
            );
        }
        return parts.join(" · ");
    }, [listing, t]);

    const descriptionText = useMemo(
        () => (listing ? t(listing.description).trim() : ""),
        [listing, t],
    );
    const rulesText = useMemo(
        () => (listing?.rules ? t(listing.rules).trim() : ""),
        [listing, t],
    );

    const showDescriptionMore =
        descriptionText.length > DESC_SHOW_MORE_THRESHOLD;

    // المرافق (facilities): each card is a place attribute (an amenity) with
    // its first linked photo + the value-level description. Photos without an
    // `attribute_id` fall into a single "General" card.
    const spaces = useMemo(() => {
        if (!listing) return [];
        type Space = {
            key: string;
            label: string;
            subtitle: string;
            photo: string | null;
        };

        // Use the backend's pre-grouped, pre-ordered gallery. Each group is
        // one amenity (or the general bucket); the card shows its first
        // photo and the value-level description (from attributes[]).
        const photoGroups = apiDetail?.photo_groups ?? [];
        if (photoGroups.length > 0) {
            return photoGroups.map((g): Space => {
                const label = g.attribute
                    ? locale === "ar"
                        ? g.attribute.name_ar
                        : g.attribute.name_en
                    : t({ ar: "عام", en: "General" });
                const attr = g.attribute_id
                    ? apiDetail?.attributes.find(
                          (a) => a.attribute.id === g.attribute_id,
                      )
                    : undefined;
                const subtitle =
                    attr?.description ??
                    t({
                        ar: `${g.photos.length} صور`,
                        en: `${g.photos.length} photo${g.photos.length === 1 ? "" : "s"}`,
                    });
                return {
                    key: g.attribute_id ?? "general",
                    label,
                    subtitle,
                    photo: g.photos[0]?.url ?? null,
                };
            });
        }

        // No groups available — show plain photo cards.
        return listing.photos.slice(0, 6).map((photo, i) => ({
            key: `photo-${i}`,
            label: "",
            subtitle: "",
            photo,
        }));
    }, [listing, apiDetail, locale, t]);

    if (!listing) {
        return (
            <SafeAreaView style={styles.notFound}>
                <Stack.Screen options={{ headerShown: false }} />
                <ThemedText variant="heading">
                    {t({
                        ar: "لم يتم العثور على المكان",
                        en: "Listing not found",
                    })}
                </ThemedText>
            </SafeAreaView>
        );
    }

    const goToPhotos = (section?: string) => {
        addPlaceInterest(listing.id, "viewall", 10);
        router.push({
            pathname: "/listing/[id]/photos",
            params: section ? { id: listing.id, section } : { id: listing.id },
        });
    };

    // Reserve: ALWAYS re-fetch this place's blocked dates on tap (spinner shows
    // next to the button text) so the calendar reflects the latest server state,
    // then route. A pre-selected range that crosses a blocked night diverts to
    // the date picker; otherwise straight to the summary. With no pre-selected
    // dates we open the (now cache-warm) picker.
    const handleReserve = async () => {
        if (reserving) return;
        addPlaceInterest(listing.id, "reserve", 30, { intent: true });
        const placeId = listing.id;

        let blocked: Set<string> = new Set();
        setReserving(true);
        try {
            blocked = await fetchUnavailableDates(placeId);
        } catch {
            blocked = getCachedUnavailableDates(placeId) ?? new Set();
        } finally {
            setReserving(false);
        }

        if (startDate && endDate) {
            const crosses = rangeHasBlockedDay(
                new Date(startDate),
                new Date(endDate),
                blocked,
            );
            router.push(
                crosses
                    ? {
                          pathname: "/booking/[id]/dates",
                          params: { id: placeId, startDate, endDate },
                      }
                    : {
                          pathname: "/booking/[id]/summary",
                          params: {
                              id: placeId,
                              checkIn: startDate,
                              checkOut: endDate,
                          },
                      },
            );
        } else {
            router.push({
                pathname: "/booking/[id]/dates",
                params: { id: placeId },
            });
        }
    };

    const rowDir = "row" as const;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style={statusStyle} animated />

            <Animated.ScrollView
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentInsetAdjustmentBehavior="never"
                automaticallyAdjustContentInsets={false}
                // Sample scroll depth (for the interest score) at rest points.
                onScrollEndDrag={sampleScroll}
                onMomentumScrollEnd={sampleScroll}
                onContentSizeChange={(_w, h) => {
                    contentHRef.current = h;
                }}
                onLayout={(e) => {
                    viewportHRef.current = e.nativeEvent.layout.height;
                }}
                contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
            >
                {/* idx 0: hero */}
                <View style={styles.heroBox}>
                    <HeroCarousel
                        photos={listing.photos}
                        scrollY={scrollY}
                        bottomInset={CARD_OVERLAP + 4}
                        onPhotoPress={() => goToPhotos()}
                        onSwipe={() => addPlaceInterest(listing.id, "swipe", 6)}
                    />
                </View>

                {/* idx 1: card head (title + stats) */}
                <View style={styles.cardHead}>
                    <View style={styles.titleBlock}>
                        <ThemedText
                            numberOfLines={1}
                            style={[
                                styles.title,
                                { fontFamily: fontFamilyFor("bold", locale) },
                            ]}
                        >
                            {t(listing.title)}
                        </ThemedText>
                        <ThemedText
                            numberOfLines={1}
                            style={[
                                styles.subtitle,
                                {
                                    fontFamily: fontFamilyFor(
                                        "regular",
                                        locale,
                                    ),
                                },
                            ]}
                        >
                            {subtitle}
                        </ThemedText>
                    </View>

                    <View style={styles.statsRow}>
                        <RatingSummary
                            rating={listing.rating.average}
                            count={listing.rating.count}
                            size="sm"
                        />
                    </View>
                </View>

                {/* Description — only when the backend provides one */}
                {descriptionText ? (
                    <View style={styles.section}>
                        <ThemedText
                            style={[
                                styles.sectionTitle,
                                {
                                    fontFamily: fontFamilyFor("bold", locale),
                                    textAlign: "left",
                                    writingDirection: isRTL ? "rtl" : "ltr",
                                },
                            ]}
                        >
                            {t({ ar: "وصف", en: "Description" })}
                        </ThemedText>
                        <ThemedText
                            numberOfLines={showDescriptionMore ? 5 : undefined}
                            style={[
                                styles.body,
                                {
                                    fontFamily: fontFamilyFor(
                                        "regular",
                                        locale,
                                    ),
                                    textAlign: "left",
                                    writingDirection: isRTL ? "rtl" : "ltr",
                                },
                            ]}
                        >
                            {descriptionText}
                        </ThemedText>
                        {showDescriptionMore ? (
                            <PressableScale
                                haptic="select"
                                onPress={() =>
                                    router.push({
                                        pathname: "/listing/[id]/description",
                                        params: { id: listing.id },
                                    })
                                }
                                style={styles.showMorePill}
                            >
                                <ThemedText
                                    style={[
                                        styles.showMoreText,
                                        {
                                            fontFamily: fontFamilyFor(
                                                "medium",
                                                locale,
                                            ),
                                        },
                                    ]}
                                >
                                    {t({ ar: "عرض المزيد", en: "Show more" })}
                                </ThemedText>
                            </PressableScale>
                        ) : null}
                    </View>
                ) : null}

                {/* Facilities — only when the backend returned photos */}
                {spaces.length > 0 ? (
                    <View style={styles.section}>
                        <ThemedText
                            style={[
                                styles.sectionTitle,
                                {
                                    fontFamily: fontFamilyFor("bold", locale),
                                    textAlign: "left",
                                    writingDirection: isRTL ? "rtl" : "ltr",
                                },
                            ]}
                        >
                            {t({ ar: "صور المرافق", en: "Space images" })}
                        </ThemedText>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.spacesRow}
                        >
                            {spaces.map((s) => (
                                <View key={s.key}>
                                    <PressableScale
                                        haptic="select"
                                        onPress={() => goToPhotos(s.key)}
                                        scaleTo={0.98}
                                        style={styles.spaceCard}
                                    >
                                        <View style={styles.spaceImageWrap}>
                                            {s.photo ? (
                                                <Image
                                                    source={{ uri: s.photo }}
                                                    style={styles.spaceImage}
                                                    contentFit="cover"
                                                    transition={200}
                                                />
                                            ) : null}
                                        </View>
                                        {s.label ? (
                                            <ThemedText
                                                numberOfLines={1}
                                                style={[
                                                    styles.spaceLabel,
                                                    {
                                                        fontFamily:
                                                            fontFamilyFor(
                                                                "medium",
                                                                locale,
                                                            ),
                                                        textAlign: "left",
                                                    },
                                                ]}
                                            >
                                                {s.label}
                                            </ThemedText>
                                        ) : null}
                                        {s.subtitle ? (
                                            <ThemedText
                                                numberOfLines={1}
                                                style={[
                                                    styles.spaceSub,
                                                    {
                                                        fontFamily:
                                                            fontFamilyFor(
                                                                "regular",
                                                                locale,
                                                            ),
                                                        textAlign: "left",
                                                    },
                                                ]}
                                            >
                                                {s.subtitle}
                                            </ThemedText>
                                        ) : null}
                                    </PressableScale>
                                </View>
                            ))}
                        </ScrollView>
                        {(() => {
                            // Full gallery count (not the featured showcase).
                            const total =
                                apiDetail?.photos.length ??
                                listing.photos.length;
                            if (total === 0) return null;
                            return (
                                <PressableScale
                                    haptic="select"
                                    onPress={() => goToPhotos()}
                                    style={styles.showMorePill}
                                >
                                    <ThemedText
                                        style={[
                                            styles.showMoreText,
                                            {
                                                fontFamily: fontFamilyFor(
                                                    "medium",
                                                    locale,
                                                ),
                                            },
                                        ]}
                                    >
                                        {t({
                                            ar: `عرض كل الصور (${total})`,
                                            en: `Show all images (${total})`,
                                        })}
                                    </ThemedText>
                                </PressableScale>
                            );
                        })()}
                    </View>
                ) : null}

                {/* Highlighted amenities — top 3 admin-flagged amenities, fenced by an
                    elegant separator above and below. */}
                {highlights.length > 0 ? (
                    <View style={styles.highlightsSection}>
                        <View style={styles.highlightSep} />
                        <ThemedText
                            style={[
                                styles.highlightsTitle,
                                { fontFamily: fontFamilyFor("bold", locale) },
                            ]}
                        >
                            {t({
                                ar: "المميزات البارزة",
                                en: "Highlighted amenities",
                            })}
                        </ThemedText>
                        <View
                            style={[
                                styles.highlightsList,
                                { flexDirection: "row" },
                            ]}
                        >
                            {highlights.map((h) => (
                                <View key={h.key} style={styles.highlightItem}>
                                    <View style={styles.highlightTile}>
                                        <View style={styles.highlightInner}>
                                            <ThemedText
                                                style={styles.highlightIcon}
                                            >
                                                {h.icon ?? "✨"}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    <ThemedText
                                        numberOfLines={1}
                                        style={[
                                            styles.highlightLabel,
                                            {
                                                fontFamily: fontFamilyFor(
                                                    "regular",
                                                    locale,
                                                ),
                                                writingDirection: isRTL
                                                    ? "rtl"
                                                    : "ltr",
                                            },
                                        ]}
                                    >
                                        {t(h.label)}
                                    </ThemedText>
                                    {h.description ? (
                                        <ThemedText
                                            numberOfLines={2}
                                            style={[
                                                styles.highlightDesc,
                                                {
                                                    fontFamily: fontFamilyFor(
                                                        "regular",
                                                        locale,
                                                    ),
                                                    writingDirection: isRTL
                                                        ? "rtl"
                                                        : "ltr",
                                                },
                                            ]}
                                        >
                                            {h.description}
                                        </ThemedText>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                        <View style={styles.highlightSep} />
                    </View>
                ) : null}

                {/* Features (amenities) — only when the backend returned any */}
                {amenityDisplay.length > 0 ? (
                    <View style={styles.section}>
                        <ThemedText
                            style={[
                                styles.sectionTitle,
                                {
                                    fontFamily: fontFamilyFor("bold", locale),
                                    textAlign: "left",
                                    writingDirection: isRTL ? "rtl" : "ltr",
                                },
                            ]}
                        >
                            {t({
                                ar: "المرافق و المميزات",
                                en: "Features & Spaces",
                            })}
                        </ThemedText>
                        <View style={styles.amenitiesList}>
                            {amenityDisplay.slice(0, 5).map((a) => (
                                <View
                                    key={a.key}
                                    style={[
                                        styles.amenityRow,
                                        { flexDirection: rowDir },
                                    ]}
                                >
                                    {a.amenityId ? (
                                        <AmenityIcon
                                            id={a.amenityId}
                                            size={18}
                                        />
                                    ) : (
                                        <ThemedText style={styles.amenityEmoji}>
                                            {a.iconEmoji ?? "•"}
                                        </ThemedText>
                                    )}
                                    <ThemedText
                                        numberOfLines={1}
                                        style={[
                                            styles.amenityLabel,
                                            {
                                                fontFamily: fontFamilyFor(
                                                    "regular",
                                                    locale,
                                                ),
                                                textAlign: "left",
                                            },
                                        ]}
                                    >
                                        {t(a.label)}
                                    </ThemedText>
                                </View>
                            ))}
                        </View>
                        {amenityDisplay.length > 5 ? (
                            <PressableScale
                                haptic="select"
                                onPress={() =>
                                    router.push(
                                        `/listing/${listing.id}/amenities`,
                                    )
                                }
                                style={styles.showMorePill}
                            >
                                <ThemedText
                                    style={[
                                        styles.showMoreText,
                                        {
                                            fontFamily: fontFamilyFor(
                                                "medium",
                                                locale,
                                            ),
                                        },
                                    ]}
                                >
                                    {t({
                                        ar: `عرض جميع المميزات (${amenityDisplay.length})`,
                                        en: `Show all features (${amenityDisplay.length})`,
                                    })}
                                </ThemedText>
                            </PressableScale>
                        ) : null}
                    </View>
                ) : null}

                {/* Location section hidden — re-enable once API ships real coordinates. */}

                {/* Check-in / check-out times */}
                {listing.checkInTime || listing.checkOutTime ? (
                    <View style={styles.section}>
                        <ThemedText
                            style={[
                                styles.sectionTitle,
                                {
                                    fontFamily: fontFamilyFor("bold", locale),
                                    textAlign: "left",
                                    writingDirection: isRTL ? "rtl" : "ltr",
                                },
                            ]}
                        >
                            {t({
                                ar: "أوقات الدخول والمغادرة",
                                en: "Check-in & check-out",
                            })}
                        </ThemedText>
                        <View
                            style={[styles.checkCard, { flexDirection: "row" }]}
                        >
                            {[
                                {
                                    key: "in",
                                    title: t({
                                        ar: "الدخول",
                                        en: "Check-in",
                                    }),
                                    caption: t({
                                        ar: "في أول يوم من الحجز",
                                        en: "On the first day of your booking",
                                    }),
                                    time: formatTime12(listing.checkInTime),
                                },
                                {
                                    key: "out",
                                    title: t({
                                        ar: "المغادرة",
                                        en: "Check-out",
                                    }),
                                    caption: listing.checkoutNextDay
                                        ? t({
                                              ar: "في اليوم التالي لآخر يوم من الحجز",
                                              en: "The day after your booking's last day",
                                          })
                                        : t({
                                              ar: "في آخر يوم من الحجز",
                                              en: "On the last day of your booking",
                                          }),
                                    time: formatTime12(listing.checkOutTime),
                                },
                            ].map((col, idx) => (
                                <Fragment key={col.key}>
                                    {idx === 1 ? (
                                        <View style={styles.checkIconWrap}>
                                            <SwitchIcon
                                                size={16}
                                                color={Colors.light.text}
                                            />
                                        </View>
                                    ) : null}
                                    <View style={styles.checkCol}>
                                        <ThemedText
                                            style={[
                                                styles.checkTitle,
                                                {
                                                    fontFamily: fontFamilyFor(
                                                        "bold",
                                                        locale,
                                                    ),
                                                },
                                            ]}
                                        >
                                            {col.title}
                                        </ThemedText>
                                        <ThemedText
                                            style={[
                                                styles.checkValue,
                                                {
                                                    // English font so the time
                                                    // numbers read as Latin.
                                                    fontFamily: fontFamilyFor(
                                                        "bold",
                                                        "en",
                                                    ),
                                                },
                                            ]}
                                        >
                                            {col.time || "—"}
                                        </ThemedText>
                                        <ThemedText
                                            style={[
                                                styles.checkLabel,
                                                {
                                                    fontFamily: fontFamilyFor(
                                                        "regular",
                                                        locale,
                                                    ),
                                                },
                                            ]}
                                        >
                                            {col.caption}
                                        </ThemedText>
                                    </View>
                                </Fragment>
                            ))}
                        </View>
                    </View>
                ) : null}

                {/* Reviews — published only; hidden when the place has none. */}
                {reviews.length > 0 ? (
                <View style={styles.section}>
                    {/* Overall rating — big number + count, stars beneath. */}
                    <View style={styles.overallInline}>
                        <ThemedText
                            style={[
                                styles.overallNum,
                                { fontFamily: fontFamilyFor("bold", "en") },
                            ]}
                        >
                            {listing.rating.average.toFixed(1)}
                        </ThemedText>
                        <View
                            style={[
                                styles.overallStars,
                                { flexDirection: rowDir },
                            ]}
                        >
                            {Array.from({ length: 5 }).map((_, i) => (
                                <StarIcon
                                    key={i}
                                    size={15}
                                    color={
                                        i < Math.round(listing.rating.average)
                                            ? TEXT_PRIMARY
                                            : "#E5E5E5"
                                    }
                                />
                            ))}
                        </View>
                        <ThemedText
                            style={[
                                styles.overallCount,
                                {
                                    fontFamily: fontFamilyFor(
                                        "regular",
                                        locale,
                                    ),
                                },
                            ]}
                        >
                            {listing.rating.count}{" "}
                            {t({ ar: "تقييم", en: "reviews" })}
                        </ThemedText>
                    </View>

                    {/* Paginated review comments — one snaps into view at a time,
                        the next peeks in; separator sits in the gap between. */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={REVIEW_ITEM_W}
                        snapToAlignment="start"
                        decelerationRate="fast"
                        disableIntervalMomentum
                        contentContainerStyle={styles.reviewsRow}
                    >
                        {reviews.slice(0, 6).map((r, idx) => (
                            <View key={r.id} style={{ flexDirection: "row" }}>
                                {/* Border on the leading edge for every comment
                                    except the first → a separator only between them. */}
                                <View
                                    style={[
                                        styles.reviewItem,
                                        idx > 0 && styles.reviewItemSep,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.reviewHead,
                                            { flexDirection: rowDir },
                                        ]}
                                    >
                                        <View style={styles.reviewAvatarTile}>
                                            {r.reviewer_avatar_url ? (
                                                <Image
                                                    source={{ uri: r.reviewer_avatar_url }}
                                                    style={styles.reviewAvatarImg}
                                                    contentFit="cover"
                                                />
                                            ) : (
                                                <View style={styles.reviewAvatarInner}>
                                                    <ThemedText
                                                        style={[
                                                            styles.reviewAvatarInitial,
                                                            {
                                                                fontFamily: fontFamilyFor(
                                                                    "bold",
                                                                    locale,
                                                                ),
                                                            },
                                                        ]}
                                                    >
                                                        {r.reviewer_name?.trim()?.charAt(0) || "-"}
                                                    </ThemedText>
                                                </View>
                                            )}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <ThemedText
                                                numberOfLines={1}
                                                style={[
                                                    styles.reviewName,
                                                    {
                                                        fontFamily:
                                                            fontFamilyFor(
                                                                "bold",
                                                                locale,
                                                            ),
                                                        textAlign: "left",
                                                    },
                                                ]}
                                            >
                                                {reviewerName(r.reviewer_name)}
                                            </ThemedText>
                                            <ThemedText
                                                numberOfLines={1}
                                                style={[
                                                    styles.reviewDate,
                                                    {
                                                        fontFamily:
                                                            fontFamilyFor(
                                                                "regular",
                                                                locale,
                                                            ),
                                                        textAlign: "left",
                                                    },
                                                ]}
                                            >
                                                {formatReviewDate(r.created_at)}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    <View
                                        style={[
                                            styles.reviewStars,
                                            { flexDirection: rowDir },
                                        ]}
                                    >
                                        {Array.from({ length: 5 }).map(
                                            (_, i) => (
                                                <StarIcon
                                                    key={i}
                                                    size={11}
                                                    color={
                                                        i < r.rate
                                                            ? TEXT_PRIMARY
                                                            : "#E5E5E5"
                                                    }
                                                />
                                            ),
                                        )}
                                    </View>
                                    {r.comment ? (
                                        <>
                                            <ThemedText
                                                numberOfLines={5}
                                                style={[
                                                    styles.reviewText,
                                                    {
                                                        fontFamily: fontFamilyFor(
                                                            "regular",
                                                            locale,
                                                        ),
                                                        textAlign: "left",
                                                    },
                                                ]}
                                            >
                                                {r.comment}
                                            </ThemedText>
                                            <PressableScale
                                                haptic="select"
                                                onPress={() =>
                                                    router.push(
                                                        `/listing/${listing.id}/reviews`,
                                                    )
                                                }
                                            >
                                                <ThemedText
                                                    style={[
                                                        styles.reviewShowMore,
                                                        {
                                                            fontFamily: fontFamilyFor(
                                                                "medium",
                                                                locale,
                                                            ),
                                                            textAlign: "left",
                                                        },
                                                    ]}
                                                >
                                                    {t({
                                                        ar: "عرض المزيد",
                                                        en: "Show more",
                                                    })}
                                                </ThemedText>
                                            </PressableScale>
                                        </>
                                    ) : null}
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <PressableScale
                        haptic="select"
                        onPress={() =>
                            router.push(`/listing/${listing.id}/reviews`)
                        }
                        style={[styles.showMorePill, styles.reviewsShowAll]}
                    >
                        <ThemedText
                            style={[
                                styles.showMoreText,
                                { fontFamily: fontFamilyFor("medium", locale) },
                            ]}
                        >
                            {t({
                                ar: `عرض جميع التقييمات (${listing.rating.count})`,
                                en: `Show all reviews (${listing.rating.count})`,
                            })}
                        </ThemedText>
                    </PressableScale>
                </View>
                ) : null}

                {/* Rules — only when the backend provides them */}
                {rulesText ? (
                    <View style={styles.section}>
                        <ThemedText
                            style={[
                                styles.sectionTitle,
                                {
                                    fontFamily: fontFamilyFor("bold", locale),
                                    textAlign: "left",
                                    writingDirection: isRTL ? "rtl" : "ltr",
                                },
                            ]}
                        >
                            {t({
                                ar: "تعليمات هامة و القواعد",
                                en: "Important rules",
                            })}
                        </ThemedText>
                        <ThemedText
                            style={[
                                styles.body,
                                {
                                    fontFamily: fontFamilyFor(
                                        "regular",
                                        locale,
                                    ),
                                    textAlign: "left",
                                    writingDirection: isRTL ? "rtl" : "ltr",
                                },
                            ]}
                        >
                            {rulesText}
                        </ThemedText>
                    </View>
                ) : null}
            </Animated.ScrollView>

            {/* Compact sticky header: title + subtitle, fades in past the hero */}
            <Animated.View
                pointerEvents="box-none"
                style={[
                    styles.stickyHeader,
                    { paddingTop: insets.top },
                    stickyHeaderStyle,
                ]}
            >
                <BlurView
                    intensity={80}
                    tint="light"
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.stickyTint} pointerEvents="none" />
                <View style={styles.stickyHeaderInner}>
                    <ThemedText
                        numberOfLines={1}
                        style={[
                            styles.stickyTitle,
                            {
                                fontFamily: fontFamilyFor("bold", locale),
                                textAlign: "center",
                                writingDirection: isRTL ? "rtl" : "ltr",
                            },
                        ]}
                    >
                        {t(listing.title)}
                    </ThemedText>
                    <ThemedText
                        numberOfLines={1}
                        style={[
                            styles.stickySubtitle,
                            {
                                fontFamily: fontFamilyFor("regular", locale),
                                textAlign: "center",
                                writingDirection: isRTL ? "rtl" : "ltr",
                            },
                        ]}
                    >
                        {subtitle}
                    </ThemedText>
                </View>
            </Animated.View>

            {/* Floating top buttons */}
            <View
                style={[styles.topBarLayer, { paddingTop: insets.top }]}
                pointerEvents="box-none"
            >
                <View style={styles.topBar}>
                    <FloatingCircleButton
                        onPress={() => router.back()}
                        haptic="back"
                    >
                        <IconSymbol
                            name={isRTL ? "chevron.right" : "chevron.left"}
                            size={18}
                            color={Colors.light.text}
                        />
                    </FloatingCircleButton>
                    <View style={{ flex: 1 }} />
                    <FloatingCircleButton
                        onPress={() => {
                            addPlaceInterest(listing.id, "share", 8);
                            sharePlace(listing.id, t(listing.title));
                        }}
                    >
                        <ShareIcon
                            size={18}
                            stroke={Colors.light.text}
                            strokeWidth={2.2}
                        />
                    </FloatingCircleButton>
                    <View style={{ width: Spacing[2] }} />
                    <FloatingCircleButton onPress={handleLike}>
                        <HeartIcon
                            size={20}
                            stroke={
                                liked ? Colors.light.coral : Colors.light.text
                            }
                            fill={liked ? Colors.light.coral : "none"}
                            strokeWidth={1.8}
                        />
                    </FloatingCircleButton>
                </View>
            </View>

            <ReserveBar
                halalas={listing.pricing.nightly}
                loading={reserving}
                onReserve={handleReserve}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },
    notFound: { flex: 1, alignItems: "center", justifyContent: "center" },

    heroBox: {
        width: SCREEN_W,
        height: HERO_HEIGHT,
    },

    cardHead: {
        marginTop: -CARD_OVERLAP,
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: CARD_RADIUS,
        borderTopRightRadius: CARD_RADIUS,
        borderCurve: "continuous",
        paddingTop: Spacing[6],
    },

    titleBlock: {
        paddingHorizontal: Spacing[5],
        alignItems: "center",
        gap: 6,
    },
    title: {
        fontSize: 19,
        lineHeight: 26,
        color: TEXT_PRIMARY,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 18,
        color: TEXT_SECONDARY,
        textAlign: "center",
    },

    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: Spacing[5],
        paddingTop: Spacing[5],
        paddingBottom: Spacing[3],
    },
    statsHalf: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    statsDivider: {
        width: 1,
        height: 44,
        backgroundColor: DIVIDER_COLOR,
        marginHorizontal: Spacing[3],
    },

    stickyHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "transparent",
        overflow: "hidden",
        zIndex: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: DIVIDER_COLOR,
    },
    stickyTint: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
    },
    stickyHeaderInner: {
        height: 56,
        paddingHorizontal: 80,
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
    },
    stickyTitle: {
        fontSize: 16,
        lineHeight: 21,
        color: TEXT_PRIMARY,
    },
    stickySubtitle: {
        fontSize: 12,
        lineHeight: 16,
        color: TEXT_SECONDARY,
    },

    topBarLayer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[3],
        paddingBottom: Spacing[3],
    },

    section: {
        paddingHorizontal: Spacing[5],
        paddingVertical: Spacing[5],
        backgroundColor: "#FFFFFF",
    },
    sectionTitle: {
        fontSize: 17,
        lineHeight: 24,
        color: TEXT_PRIMARY,
        marginBottom: Spacing[3],
    },

    body: {
        fontSize: 14,
        lineHeight: 24,
        color: TEXT_PRIMARY,
    },

    showMorePill: {
        marginTop: Spacing[4],
        backgroundColor: DIVIDER_COLOR,
        paddingVertical: Spacing[3],
        borderRadius: Radius.lg,
        borderCurve: "continuous",
        alignItems: "center",
    },
    showMoreText: {
        fontSize: 14,
        lineHeight: 19,
        color: TEXT_PRIMARY,
    },

    spacesRow: {
        gap: Spacing[3],
        paddingStart: 0,
        paddingEnd: Spacing[5],
    },
    highlightsSection: {
        paddingHorizontal: Spacing[5],
        paddingVertical: Spacing[2],
        backgroundColor: "#FFFFFF",
    },
    highlightSep: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "#EAEAEA",
    },
    highlightsTitle: {
        fontSize: 17,
        lineHeight: 24,
        color: TEXT_PRIMARY,
        textAlign: "center",
        marginTop: Spacing[5],
        marginBottom: Spacing[1],
    },
    highlightsList: {
        justifyContent: "center",
        alignItems: "flex-start",
        paddingVertical: Spacing[10],
    },
    highlightItem: {
        width: "33%",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing[2],
    },
    // White frame + light-gray inner, like the last-search photo cards.
    highlightTile: {
        backgroundColor: "#FFFFFF",
        padding: 4,
        borderRadius: 999,
        borderCurve: "continuous",
        marginBottom: Spacing[1],
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    highlightInner: {
        width: 58,
        height: 58,
        borderRadius: 999,
        borderCurve: "continuous",
        backgroundColor: "#f9f9f9",
        alignItems: "center",
        justifyContent: "center",
    },
    highlightIcon: {
        fontSize: 28,
        lineHeight: 34,
    },
    highlightLabel: {
        fontSize: 13,
        lineHeight: 18,
        color: TEXT_PRIMARY,
        textAlign: "center",
    },
    highlightDesc: {
        fontSize: 12,
        lineHeight: 16,
        color: TEXT_SECONDARY,
        textAlign: "center",
    },
    spaceCard: {
        width: SPACE_CARD_W,
        gap: 8,
    },
    spaceImageWrap: {
        width: SPACE_CARD_W,
        height: SPACE_CARD_H,
        borderRadius: 10,
        borderCurve: "continuous",
        overflow: "hidden",
        backgroundColor: "#F3F4F6",
    },
    spaceImage: {
        width: "100%",
        height: "100%",
    },
    spaceLabel: {
        fontSize: 14,
        lineHeight: 19,
        color: TEXT_PRIMARY,
    },
    spaceSub: {
        fontSize: 13,
        lineHeight: 18,
        color: TEXT_SECONDARY,
    },

    amenitiesList: {
        gap: Spacing[5],
        paddingTop: Spacing[2],
    },
    amenityRow: {
        alignItems: "center",
        gap: Spacing[3],
    },
    amenityLabel: {
        fontSize: 14,
        lineHeight: 20,
        color: TEXT_PRIMARY,
        flexShrink: 1,
    },
    amenityEmoji: {
        fontSize: 18,
        lineHeight: 24,
        width: 28,
        textAlign: "center",
    },

    locationBox: {
        marginTop: Spacing[2],
        borderRadius: Radius.lg,
        borderCurve: "continuous",
        overflow: "hidden",
    },

    checkCard: {
        marginTop: Spacing[2],
        // Extra bottom room so the drop shadow isn't clipped by the next
        // (white) section painted on top.
        marginBottom: Spacing[4],
        alignItems: "center",
        borderRadius: Radius.lg,
        borderCurve: "continuous",
        backgroundColor: "#FFFFFF",
        borderWidth: 0.5,
        borderColor: "#F4F4F4",
        paddingVertical: Spacing[5],
        paddingHorizontal: Spacing[4],
        shadowColor: "#00000066",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 20,
        elevation: 4,
    },
    checkCol: {
        flex: 1,
        alignItems: "center",
        gap: 3,
    },
    checkIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#F4F4F4",
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: Spacing[2],
    },
    checkTitle: {
        fontSize: 14,
        lineHeight: 19,
        color: TEXT_SECONDARY,
        textAlign: "center",
    },
    checkLabel: {
        fontSize: 12,
        lineHeight: 17,
        color: TEXT_SECONDARY,
        textAlign: "center",
    },
    checkValue: {
        fontSize: 20,
        lineHeight: 26,
        color: TEXT_PRIMARY,
        textAlign: "center",
    },

    overallInline: {
        alignItems: "center",
        paddingVertical: Spacing[3],
        gap: Spacing[2],
        paddingBottom: Spacing[10],
        paddingTop: 0,
    },
    overallNum: {
        fontSize: 32,
        lineHeight: 38,
        color: TEXT_PRIMARY,
    },
    overallCount: {
        fontSize: 14,
        lineHeight: 19,
        color: TEXT_SECONDARY,
    },
    overallStars: {
        gap: 3,
    },
    reviewsRow: {
        paddingTop: Spacing[3],
        paddingStart: Spacing[2],
        paddingEnd: Spacing[5],
    },
    reviewItem: {
        width: REVIEW_ITEM_W,
        gap: Spacing[3],
        paddingVertical: Spacing[1],
    },
    reviewItemSep: {
        // Separator on the leading edge of every comment except the first, so
        // the line always falls between two cards. Logical `start` flips with
        // native RTL (left edge in LTR, right edge in RTL).
        borderStartWidth: 1,
        borderStartColor: "#ededed",
        paddingHorizontal: Spacing[10],
    },
    reviewDate: {
        fontSize: 12,
        lineHeight: 16,
        color: TEXT_SECONDARY,
        marginTop: 2,
    },
    reviewShowMore: {
        fontSize: 13,
        lineHeight: 18,
        color: TEXT_SECONDARY,
        textDecorationLine: "underline",
    },
    reviewsShowAll: {
        marginTop: Spacing[10],
    },
    reviewHead: {
        alignItems: "center",
        gap: Spacing[3],
    },
    reviewAvatarTile: {
        width: 44,
        height: 44,
        borderRadius: 13,
        borderCurve: "continuous",
        backgroundColor: "#FFFFFF",
        padding: 2.5,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
        elevation: 4,
    },
    reviewAvatarInner: {
        width: "100%",
        height: "100%",
        borderRadius: 11,
        borderCurve: "continuous",
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
    },
    reviewAvatarInitial: {
        fontSize: 18,
        lineHeight: 22,
        color: TEXT_PRIMARY,
        textTransform: "uppercase",
    },
    reviewAvatarImg: {
        width: "100%",
        height: "100%",
        borderRadius: 11,
        borderCurve: "continuous",
        backgroundColor: "#F3F4F6",
    },
    reviewName: {
        fontSize: 14,
        lineHeight: 19,
        color: TEXT_PRIMARY,
    },
    reviewStars: {
        gap: 2,
        marginTop: 2,
    },
    reviewText: {
        fontSize: 14,
        lineHeight: 26,
        color: TEXT_PRIMARY,
    },
});
