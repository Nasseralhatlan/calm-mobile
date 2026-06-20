// Static marketing/legal pages rendered in a WebView. Paths are relative to
// the web origin; override the base with EXPO_PUBLIC_WEB_URL when the web app
// has its own domain (falls back to the API host).
export const PAGES_BASE_URL =
    process.env.EXPO_PUBLIC_WEB_URL ??
    process.env.EXPO_PUBLIC_API_URL ??
    "https://calmapp.co";

export interface InfoPage {
    path: string;
    title: { ar: string; en: string };
}

export const INFO_PAGES = {
    about: { path: "/about", title: { ar: "عن كالم", en: "About Calm" } },
    terms: {
        path: "/terms",
        title: { ar: "الشروط والأحكام", en: "Terms of Service" },
    },
    privacy: {
        path: "/privacy",
        title: { ar: "سياسة الخصوصية", en: "Privacy Policy" },
    },
    cancellation: {
        path: "/cancellation-policy",
        title: { ar: "سياسة الإلغاء والاسترداد", en: "Cancellation & Refund" },
    },
    community: {
        path: "/community-standards",
        title: { ar: "معايير المجتمع", en: "Community Standards" },
    },
} as const satisfies Record<string, InfoPage>;

export type InfoPageKey = keyof typeof INFO_PAGES;

export function infoPageUrl(key: InfoPageKey): string {
    return `${PAGES_BASE_URL}${INFO_PAGES[key].path}`;
}
