import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, Linking, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { Spinner } from '@/components/spinner';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, fontFamilyFor } from '@/constants/theme';
import { useAuthState } from '@/data/auth-state';
import { setDatePicker } from '@/data/date-picker-dialog';
import { dateKey } from '@/lib/date-key';
import {
  ApiError,
  updateProfile,
  updateProfileWithAvatar,
  type AvatarUpload,
  type UpdateProfileFields,
} from '@/lib/api';
import { useLocale, useT } from '@/lib/i18n';

const TEXT_PRIMARY = '#000000';
const TEXT_SECONDARY = '#6B7280';

type Gender = 'male' | 'female';

function parseDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Defined at module scope (NOT inside the screen) so they keep a stable identity
// across renders — otherwise the TextInput inside Field remounts on every
// keystroke / keyboard event and the field loses focus.
function Field({
  label,
  locale,
  align,
  children,
}: {
  label: string;
  locale: 'ar' | 'en';
  align: 'left' | 'right';
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <ThemedText
        style={[styles.fieldLabel, { fontFamily: fontFamilyFor('medium', locale), textAlign: align }]}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

function GenderChip({
  value,
  label,
  gender,
  locale,
  onPick,
}: {
  value: Gender;
  label: string;
  gender: Gender | null;
  locale: 'ar' | 'en';
  onPick: (g: Gender) => void;
}) {
  const active = gender === value;
  return (
    <PressableScale
      scaleTo={0.96}
      haptic="select"
      onPress={() => onPick(value)}
      style={active ? [styles.chip, styles.chipOn] : styles.chip}>
      <ThemedText
        style={[
          active ? styles.chipTextOn : styles.chipText,
          { fontFamily: fontFamilyFor(active ? 'bold' : 'medium', locale) },
        ]}>
        {label}
      </ThemedText>
    </PressableScale>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const align = isRTL ? ('right' as const) : ('left' as const);
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthState();

  // Track the keyboard height so the footer (Save) always stays above it — a
  // plain KeyboardAvoidingView is unreliable inside a presented modal.
  const [kb, setKb] = useState(0);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s = Keyboard.addListener(showEvt, (e) => setKb(e.endCoordinates.height));
    const h = Keyboard.addListener(hideEvt, () => setKb(0));
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  const [name, setName] = useState(user?.name ?? '');
  const [gender, setGender] = useState<Gender | null>(user?.gender ?? null);
  const [email, setEmail] = useState(user?.email ?? '');
  const [birthDate, setBirthDate] = useState<Date | null>(parseDate(user?.birth_date ?? null));
  const [avatar, setAvatar] = useState<AvatarUpload | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarPreview = avatar?.uri ?? user?.avatar_url ?? null;
  const initial = (user?.name ?? '؟').slice(0, 1);

  const pickImage = async () => {
    // Ask in-app first (the OS prompt). If the user refuses — now or before —
    // the request resolves not-granted, so send them to Settings to enable it.
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Linking.openSettings().catch(() => {});
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (res.canceled) return;
    const a = res.assets[0];
    const type = a.mimeType ?? 'image/jpeg';
    const ext = type.split('/')[1] ?? 'jpg';
    setAvatar({ uri: a.uri, name: `avatar.${ext}`, type });
  };

  const openDatePicker = () => {
    setDatePicker({
      title: t({ ar: 'تاريخ الميلاد', en: 'Birth date' }),
      value: birthDate,
      maximumDate: new Date(),
      onPick: setBirthDate,
    });
    router.push('/date-picker');
  };

  const birthLabel = birthDate
    ? new Intl.DateTimeFormat(isRTL ? 'ar-SA-u-ca-gregory' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(birthDate)
    : t({ ar: 'اختر تاريخ ميلادك', en: 'Select your birth date' });

  const onSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    setError(null);

    const fields: UpdateProfileFields = {};
    const n = name.trim();
    if (n && n !== (user.name ?? '')) fields.name = n;
    if (gender && gender !== user.gender) fields.gender = gender;
    const e = email.trim();
    if (e && e !== (user.email ?? '')) fields.email = e;
    const bk = birthDate ? dateKey(birthDate) : null;
    if (bk && bk !== (user.birth_date ?? null)) fields.birth_date = bk;

    try {
      let updated = null;
      if (avatar) {
        updated = await updateProfileWithAvatar(fields, avatar);
      } else if (Object.keys(fields).length > 0) {
        updated = await updateProfile(fields);
      }
      if (updated) await updateUser(updated);
      router.back();
    } catch (err) {
      if (err instanceof ApiError) {
        const errs = (err.payload as { errors?: Record<string, string[]> } | undefined)?.errors;
        const first = errs ? Object.values(errs)[0]?.[0] : undefined;
        setError(first || err.message || t({ ar: 'تعذر الحفظ', en: 'Could not save' }));
      } else {
        setError(t({ ar: 'حدث خطأ ما', en: 'Something went wrong' }));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flex: 1, paddingBottom: kb }}>
        <View style={styles.header}>
          <PressableScale onPress={() => router.back()} scaleTo={0.88} haptic="back" style={styles.closeBtn}>
            <IconSymbol name="xmark" size={18} color={TEXT_PRIMARY} />
          </PressableScale>
          <View style={styles.titleCenter} pointerEvents="none">
            <ThemedText style={[styles.title, { fontFamily: fontFamilyFor('bold', locale) }]}>
              {t({ ar: 'تعديل الملف', en: 'Edit profile' })}
            </ThemedText>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <PressableScale onPress={pickImage} scaleTo={0.95} style={styles.avatarTile}>
              {avatarPreview ? (
                <Image source={{ uri: avatarPreview }} style={styles.avatarImg} contentFit="cover" transition={150} />
              ) : (
                <ThemedText style={[styles.avatarInitial, { fontFamily: fontFamilyFor('bold', locale) }]}>
                  {initial}
                </ThemedText>
              )}
              <View style={styles.cameraBadge}>
                <IconSymbol name="square.and.arrow.up" size={14} color="#FFFFFF" />
              </View>
            </PressableScale>
            <PressableScale onPress={pickImage} hitSlop={8}>
              <ThemedText style={[styles.changePhoto, { fontFamily: fontFamilyFor('bold', locale) }]}>
                {t({ ar: 'تغيير الصورة', en: 'Change photo' })}
              </ThemedText>
            </PressableScale>
          </View>

          <Field label={t({ ar: 'الاسم', en: 'Name' })} locale={locale} align={align}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t({ ar: 'اسمك', en: 'Your name' })}
              placeholderTextColor="#C7C7C7"
              style={[styles.input, { fontFamily: fontFamilyFor('regular', locale), textAlign: align }]}
              maxLength={120}
            />
          </Field>

          <Field label={t({ ar: 'الجنس', en: 'Gender' })} locale={locale} align={align}>
            <View style={[styles.chipsRow, { flexDirection: 'row' }]}>
              <GenderChip
                value="male"
                label={t({ ar: 'ذكر', en: 'Male' })}
                gender={gender}
                locale={locale}
                onPick={setGender}
              />
              <GenderChip
                value="female"
                label={t({ ar: 'أنثى', en: 'Female' })}
                gender={gender}
                locale={locale}
                onPick={setGender}
              />
            </View>
          </Field>

          <Field label={t({ ar: 'البريد الإلكتروني', en: 'Email' })} locale={locale} align={align}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              placeholderTextColor="#C7C7C7"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { fontFamily: fontFamilyFor('regular', locale), textAlign: align }]}
            />
          </Field>

          <Field label={t({ ar: 'تاريخ الميلاد', en: 'Birth date' })} locale={locale} align={align}>
            <PressableScale onPress={openDatePicker} scaleTo={0.99} style={styles.input}>
              <ThemedText
                style={[
                  birthDate ? styles.dateText : styles.datePlaceholder,
                  { fontFamily: fontFamilyFor('regular', locale), textAlign: align },
                ]}>
                {birthLabel}
              </ThemedText>
            </PressableScale>
          </Field>

          {error ? (
            <ThemedText
              style={[styles.error, { fontFamily: fontFamilyFor('regular', locale), textAlign: align }]}>
              {error}
            </ThemedText>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: kb > 0 ? Spacing[3] : insets.bottom + Spacing[3] },
          ]}>
          <PressableScale
            onPress={onSave}
            disabled={saving}
            scaleTo={0.98}
            haptic="forward"
            style={[styles.saveBtn, { opacity: saving ? 0.6 : 1 }]}>
            {saving ? (
              <Spinner size={20} />
            ) : (
              <ThemedText style={[styles.saveText, { fontFamily: fontFamilyFor('bold', locale) }]}>
                {t({ ar: 'حفظ', en: 'Save' })}
              </ThemedText>
            )}
          </PressableScale>
        </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEEE',
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
  titleCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, lineHeight: 23, color: TEXT_PRIMARY },

  scroll: { padding: Spacing[5], gap: Spacing[5], paddingBottom: Spacing[10] },

  avatarWrap: { alignItems: 'center', gap: Spacing[3] },
  avatarTile: {
    width: 104,
    height: 104,
    borderRadius: 28,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    borderCurve: 'continuous',
    backgroundColor: '#F0F0F0',
  },
  avatarInitial: { fontSize: 40, lineHeight: 48, color: TEXT_SECONDARY },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  changePhoto: { fontSize: 14, lineHeight: 19, color: Colors.light.coral },

  field: { gap: Spacing[2] },
  fieldLabel: { fontSize: 13, lineHeight: 18, color: TEXT_SECONDARY },
  input: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    fontSize: 15,
    color: TEXT_PRIMARY,
    justifyContent: 'center',
  },
  dateText: { fontSize: 15, lineHeight: 20, color: TEXT_PRIMARY },
  datePlaceholder: { fontSize: 15, lineHeight: 20, color: '#C7C7C7' },

  chipsRow: { gap: Spacing[2] + 2 },
  chip: {
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[5],
    borderRadius: 999,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
  },
  chipOn: { borderColor: '#000000', backgroundColor: '#F7F7F7' },
  chipText: { fontSize: 14, lineHeight: 19, color: Colors.light.text },
  chipTextOn: { fontSize: 14, lineHeight: 19, color: '#000000' },

  error: { fontSize: 13, lineHeight: 18, color: '#C53030' },

  footer: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEEEEE',
  },
  saveBtn: {
    backgroundColor: '#000000',
    paddingVertical: Spacing[4],
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 53,
  },
  saveText: { color: '#FFFFFF', fontSize: 16, lineHeight: 21 },
});
