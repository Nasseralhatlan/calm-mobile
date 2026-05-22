import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useLocale } from '@/lib/i18n';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface WhenContentProps {
  range: DateRange;
  onChange: (range: DateRange) => void;
  onConfirm?: () => void;
}

const MONTHS_TO_SHOW = 6;

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function WhenContent({ range, onChange, onConfirm }: WhenContentProps) {
  const { locale } = useLocale();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const months = useMemo(() => {
    const arr: Date[] = [];
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    for (let i = 0; i < MONTHS_TO_SHOW; i++) {
      arr.push(new Date(start.getFullYear(), start.getMonth() + i, 1));
    }
    return arr;
  }, [today]);

  const quickChips = useMemo(() => {
    const wantDays = [4, 5, 6]; // Thu, Fri, Sat
    const dayName = (d: Date) =>
      d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long' });
    const monthDay = (d: Date) =>
      d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const nextWord = locale === 'ar' ? 'الجاي' : 'Next';

    return wantDays.map((w) => {
      const d = new Date(today);
      const diff = (w - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      return {
        day: locale === 'ar' ? `${dayName(d)} ${nextWord}` : `${nextWord} ${dayName(d)}`,
        date: monthDay(d),
        value: d,
      };
    });
  }, [today, locale]);

  const handlePick = (d: Date) => {
    Haptics.selectionAsync().catch(() => {});
    const { start, end } = range;
    let next: DateRange;
    if (!start || (start && end)) {
      next = { start: d, end: null };
    } else if (d.getTime() <= start.getTime()) {
      next = { start: d, end: null };
    } else {
      next = { start, end: d };
    }
    onChange(next);
    if (next.start && next.end) {
      onConfirm?.();
    }
  };

  const handleChip = (d: Date) => {
    Haptics.selectionAsync().catch(() => {});
    const start = d;
    const end = new Date(d);
    end.setDate(end.getDate() + 1);
    onChange({ start, end });
    onConfirm?.();
  };

  const weekdayHeader = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.wrap}>
      <View style={styles.stickyWeekdays}>
        {weekdayHeader.map((w, i) => (
          <View key={i} style={monthStyles.cell}>
            <ThemedText
              style={[monthStyles.weekday, { fontFamily: fontFamilyFor('regular', locale) }]}>
              {w}
            </ThemedText>
          </View>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {months.map((m) => (
          <MonthGrid
            key={m.toISOString()}
            month={m}
            today={today}
            range={range}
            onSelect={handlePick}
            locale={locale}
          />
        ))}
      </ScrollView>

      <View style={styles.chipsRow}>
        {quickChips.map((c) => {
          const isActive =
            !!range.start && sameDay(c.value, range.start) && range.end !== null;
          return (
            <PressableScale
              key={c.day}
              scaleTo={0.95}
              onPress={() => handleChip(c.value)}
              style={isActive ? [styles.chip, styles.chipActive] : styles.chip}>
              <ThemedText
                numberOfLines={1}
                style={[
                  styles.chipDay,
                  { fontFamily: fontFamilyFor('bold', locale) },
                ]}>
                {c.day}
              </ThemedText>
              <ThemedText
                style={[
                  styles.chipDate,
                  { fontFamily: fontFamilyFor('regular', locale) },
                ]}>
                {c.date}
              </ThemedText>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

function MonthGrid({
  month,
  today,
  range,
  onSelect,
  locale,
}: {
  month: Date;
  today: Date;
  range: DateRange;
  onSelect: (d: Date) => void;
  locale: 'ar' | 'en';
}) {
  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const cells: ({ day: number; date: Date } | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(month.getFullYear(), month.getMonth(), d) });
  }

  const { start, end } = range;

  return (
    <View style={monthStyles.wrap}>
      <ThemedText
        style={[monthStyles.title, { fontFamily: fontFamilyFor('bold', locale) }]}>
        {monthLabel}
      </ThemedText>
      <View style={monthStyles.grid}>
        {cells.map((c, i) => {
          if (!c) return <View key={i} style={monthStyles.cell} />;
          const past = c.date < today;
          const t = c.date.getTime();
          const isStart = !!start && sameDay(c.date, start);
          const isEnd = !!end && sameDay(c.date, end);
          const isEndpoint = isStart || isEnd;
          const inBetween =
            !!start &&
            !!end &&
            t > start.getTime() &&
            t < end.getTime();
          const hasRange = !!start && !!end;
          const showRangeBg = inBetween || (hasRange && isEndpoint);

          return (
            <Pressable
              key={i}
              onPress={() => !past && onSelect(c.date)}
              style={monthStyles.cell}
              disabled={past}>
              {showRangeBg ? (
                <View
                  style={[
                    monthStyles.rangeFill,
                    isStart && monthStyles.rangeFillStart,
                    isEnd && monthStyles.rangeFillEnd,
                  ]}
                  pointerEvents="none"
                />
              ) : null}
              <View
                style={[
                  monthStyles.dayDisc,
                  isEndpoint && monthStyles.dayDiscSelected,
                ]}>
                <ThemedText
                  style={[
                    monthStyles.dayText,
                    past && monthStyles.dayPast,
                    isEndpoint && monthStyles.daySelected,
                    { fontFamily: fontFamilyFor('bold', locale) },
                  ]}>
                  {c.day}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: Spacing[3] },
  stickyWeekdays: {
    flexDirection: 'row',
    paddingBottom: Spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.divider,
  },
  scroll: { paddingBottom: Spacing[4] },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    paddingTop: Spacing[2],
  },
  chip: {
    flex: 1,
    paddingVertical: Spacing[3] * 0.8,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.light.text,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  chipActive: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  chipDay: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.light.text,
    textAlign: 'center',
  },
  chipDate: {
    fontSize: 11,
    lineHeight: 14,
    color: Colors.light.textMuted,
    textAlign: 'center',
  },
});

const monthStyles = StyleSheet.create({
  wrap: { paddingVertical: Spacing[3] },
  title: {
    fontSize: 15,
    lineHeight: 20,
    color: Colors.light.text,
    marginBottom: Spacing[3],
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekday: {
    fontSize: 11,
    lineHeight: 16,
    color: Colors.light.textMuted,
  },
  rangeFill: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    height: 36,
    left: 0,
    right: 0,
    backgroundColor: '#EFEFEF',
  },
  rangeFillStart: {
    insetInlineStart: '50%',
  },
  rangeFillEnd: {
    insetInlineEnd: '50%',
  },
  dayDisc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDiscSelected: { backgroundColor: Colors.light.text },
  dayText: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.light.text,
  },
  dayPast: {
    color: Colors.light.textMuted,
    textDecorationLine: 'line-through',
  },
  daySelected: { color: '#FFFFFF' },
});
