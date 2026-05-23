import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale, useT } from '@/lib/i18n';

export type Audience = 'family' | 'guys' | 'girls' | 'mixed';
export type Vibe = 'chill' | 'lively' | 'luxury';

export interface HelpAnswers {
  audience: Audience | null;
  activity: string | null;
  vibe: Vibe | null;
}

interface HelpContentProps {
  answers: HelpAnswers;
  onChange: (next: HelpAnswers) => void;
  onSkip: () => void;
  /** Fired the moment the last question (vibe) is answered. */
  onComplete: () => void;
}

interface Option {
  value: string;
  emoji: string;
  label: { ar: string; en: string };
}

const AUDIENCE_OPTIONS: Option[] = [
  { value: 'family', emoji: '👨‍👩‍👧', label: { ar: 'عائلة', en: 'Family' } },
  { value: 'guys', emoji: '🧑‍🤝‍🧑', label: { ar: 'شباب', en: 'Guys' } },
  { value: 'girls', emoji: '👯‍♀️', label: { ar: 'بنات', en: 'Girls' } },
  { value: 'mixed', emoji: '👥', label: { ar: 'مختلط', en: 'Mixed' } },
];

const ACTIVITY_BY_AUDIENCE: Record<Audience, Option[]> = {
  family: [
    { value: 'birthday', emoji: '🎂', label: { ar: 'عيد ميلاد', en: 'Birthday' } },
    { value: 'gathering', emoji: '🍽️', label: { ar: 'تجمع عائلي', en: 'Family gathering' } },
    { value: 'vacation', emoji: '🌴', label: { ar: 'إجازة', en: 'Vacation' } },
    { value: 'kids', emoji: '🧸', label: { ar: 'مناسبة أطفال', en: 'Kids event' } },
  ],
  guys: [
    { value: 'hangout', emoji: '🎮', label: { ar: 'لمة', en: 'Hangout' } },
    { value: 'match', emoji: '⚽', label: { ar: 'مباراة', en: 'Match watch' } },
    { value: 'camping', emoji: '🔥', label: { ar: 'تخييم', en: 'Camping' } },
    { value: 'workshop', emoji: '🍖', label: { ar: 'شواء', en: 'BBQ night' } },
  ],
  girls: [
    { value: 'birthday', emoji: '🎉', label: { ar: 'عيد ميلاد', en: 'Birthday' } },
    { value: 'session', emoji: '🍰', label: { ar: 'جلسة', en: 'Hangout' } },
    { value: 'photo', emoji: '📸', label: { ar: 'تصوير', en: 'Photoshoot' } },
    { value: 'spa', emoji: '💆‍♀️', label: { ar: 'سبا و استرخاء', en: 'Spa & relax' } },
  ],
  mixed: [
    { value: 'gathering', emoji: '🎊', label: { ar: 'تجمع', en: 'Gathering' } },
    { value: 'wedding', emoji: '💍', label: { ar: 'مناسبة عرس', en: 'Wedding event' } },
    { value: 'outing', emoji: '🌅', label: { ar: 'خروج', en: 'Day out' } },
    { value: 'corporate', emoji: '💼', label: { ar: 'مناسبة عمل', en: 'Corporate event' } },
  ],
};

const VIBE_OPTIONS: { value: Vibe; emoji: string; label: { ar: string; en: string } }[] = [
  { value: 'chill', emoji: '🌿', label: { ar: 'هادئ', en: 'Chill' } },
  { value: 'lively', emoji: '🎶', label: { ar: 'نشيط', en: 'Lively' } },
  { value: 'luxury', emoji: '✨', label: { ar: 'فاخر', en: 'Luxurious' } },
];

export function HelpContent({ answers, onChange, onSkip, onComplete }: HelpContentProps) {
  const { locale } = useLocale();
  const t = useT();
  const isRTL = locale === 'ar';

  // Step is implicit: first answer drives second's options, second drives ready state.
  const currentStep: 1 | 2 | 3 = !answers.audience
    ? 1
    : !answers.activity
      ? 2
      : 3;

  const activityOptions = useMemo<Option[]>(
    () => (answers.audience ? ACTIVITY_BY_AUDIENCE[answers.audience] : []),
    [answers.audience],
  );

  const setAudience = (v: Audience) => {
    onChange({ audience: v, activity: null, vibe: null });
  };
  const setActivity = (v: string) => {
    onChange({ ...answers, activity: v, vibe: null });
  };
  const setVibe = (v: Vibe) => {
    onChange({ ...answers, vibe: v });
    // Last question — auto-advance to the next card.
    onComplete();
  };

  return (
    <View style={styles.wrap}>
      {/* Skip button at top */}
      <View style={styles.skipRow}>
        <PressableScale
          haptic="select"
          scaleTo={0.97}
          onPress={onSkip}
          style={styles.skipPill}>
          <ThemedText
            style={[styles.skipText, { fontFamily: fontFamilyFor('bold', locale) }]}>
            {t({ ar: 'ورني كل شئ', en: 'Show me everything' })}
          </ThemedText>
        </PressableScale>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {/* Step 1: Audience */}
        <Question
          n={1}
          active
          title={t({ ar: 'مين معك؟', en: "Who's coming?" })}
          isRTL={isRTL}>
          <View style={styles.optionsGrid}>
            {AUDIENCE_OPTIONS.map((o) => (
              <Pill
                key={o.value}
                emoji={o.emoji}
                label={t(o.label)}
                active={answers.audience === o.value}
                onPress={() => setAudience(o.value as Audience)}
              />
            ))}
          </View>
        </Question>

        {/* Step 2: Activity — depends on audience */}
        {currentStep >= 2 ? (
          <Question
            n={2}
            active
            title={t({ ar: 'وش تبغى تسوي؟', en: 'What for?' })}
            isRTL={isRTL}>
            <View style={styles.optionsGrid}>
              {activityOptions.map((o) => (
                <Pill
                  key={o.value}
                  emoji={o.emoji}
                  label={t(o.label)}
                  active={answers.activity === o.value}
                  onPress={() => setActivity(o.value)}
                />
              ))}
            </View>
          </Question>
        ) : null}

        {/* Step 3: Vibe */}
        {currentStep >= 3 ? (
          <Question
            n={3}
            active
            title={t({ ar: 'وش الجو المفضل؟', en: 'What vibe do you want?' })}
            isRTL={isRTL}>
            <View style={styles.optionsGrid}>
              {VIBE_OPTIONS.map((o) => (
                <Pill
                  key={o.value}
                  emoji={o.emoji}
                  label={t(o.label)}
                  active={answers.vibe === o.value}
                  onPress={() => setVibe(o.value)}
                />
              ))}
            </View>
          </Question>
        ) : null}

      </ScrollView>
    </View>
  );
}

function Question({
  n,
  title,
  isRTL,
  children,
}: {
  n: number;
  active: boolean;
  title: string;
  isRTL: boolean;
  children: React.ReactNode;
}) {
  const { locale } = useLocale();
  return (
    <View style={styles.question}>
      <View style={[styles.qHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={styles.qBadge}>
          <ThemedText
            style={[styles.qBadgeText, { fontFamily: fontFamilyFor('bold', locale) }]}>
            {n}
          </ThemedText>
        </View>
        <ThemedText
          style={[
            styles.qTitle,
            {
              fontFamily: fontFamilyFor('bold', locale),
              textAlign: isRTL ? 'right' : 'left',
              writingDirection: isRTL ? 'rtl' : 'ltr',
            },
          ]}>
          {title}
        </ThemedText>
      </View>
      {children}
    </View>
  );
}

function Pill({
  emoji,
  label,
  active,
  onPress,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { locale } = useLocale();
  return (
    <PressableScale
      scaleTo={0.94}
      haptic="select"
      onPress={onPress}
      style={active ? [styles.pill, styles.pillActive] : styles.pill}>
      <ThemedText style={styles.pillEmoji}>{emoji}</ThemedText>
      <ThemedText
        style={[
          styles.pillLabel,
          active && styles.pillLabelActive,
          { fontFamily: fontFamilyFor(active ? 'bold' : 'medium', locale) },
        ]}>
        {label}
      </ThemedText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },

  skipRow: {
    alignItems: 'stretch',
    paddingBottom: Spacing[4],
  },
  skipPill: {
    backgroundColor: '#F4F4F4',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3] + 2,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 15,
    lineHeight: 20,
    color: Colors.light.text,
  },

  scroll: {
    paddingBottom: Spacing[6],
    gap: Spacing[5],
  },

  question: {
    gap: Spacing[3],
  },
  qHead: {
    alignItems: 'center',
    gap: Spacing[3],
  },
  qBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  qTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: Colors.light.text,
  },

  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2] + 2,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    backgroundColor: '#F4F4F4',
  },
  pillActive: {
    backgroundColor: '#000000',
  },
  pillEmoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  pillLabel: {
    fontSize: 13,
    lineHeight: 17,
    color: Colors.light.text,
  },
  pillLabelActive: {
    color: '#FFFFFF',
  },

});

