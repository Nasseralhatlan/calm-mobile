import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Spacing, fontFamilyFor } from '@/constants/theme';
import { getDatePicker } from '@/data/date-picker-dialog';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';

export default function DatePickerScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const cfg = getDatePicker();

  const [date, setDate] = useState<Date>(cfg?.value ?? new Date(2000, 0, 1));

  const onChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) setDate(selected);
  };

  const done = () => {
    router.back();
    requestAnimationFrame(() => cfg?.onPick(date));
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ThemedText
        style={[styles.title, { fontFamily: fontFamilyFor('bold', locale), textAlign: 'center' }]}>
        {cfg?.title ?? t({ ar: 'اختر التاريخ', en: 'Pick a date' })}
      </ThemedText>

      <View style={styles.pickerWrap}>
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          maximumDate={cfg?.maximumDate}
          minimumDate={cfg?.minimumDate}
          onChange={onChange}
        />
      </View>

      <PressableScale onPress={done} scaleTo={0.98} haptic="forward" style={styles.btn}>
        <ThemedText style={[styles.btnText, { fontFamily: fontFamilyFor('bold', locale) }]}>
          {t({ ar: 'تم', en: 'Done' })}
        </ThemedText>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  title: { fontSize: 20, lineHeight: 26, color: TEXT_PRIMARY },
  pickerWrap: { alignSelf: 'stretch', alignItems: 'center' },
  btn: {
    alignSelf: 'stretch',
    paddingVertical: Spacing[4],
    borderRadius: 16,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  btnText: { color: '#FFFFFF', fontSize: 16, lineHeight: 21 },
});
