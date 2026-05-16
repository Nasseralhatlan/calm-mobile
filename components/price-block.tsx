import { ThemedText } from '@/components/themed-text';
import { useLocale, useT } from '@/lib/i18n';
import { formatMoney } from '@/lib/format';
import { STR } from '@/lib/strings';

interface PriceBlockProps {
  halalas: number;
  perNight?: boolean;
  size?: 'lg' | 'md';
}

export function PriceBlock({ halalas, perNight = true, size = 'md' }: PriceBlockProps) {
  const { locale } = useLocale();
  const t = useT();
  const amount = formatMoney(halalas, locale);

  return (
    <ThemedText variant={size === 'lg' ? 'heading' : 'bodyMedium'}>
      {amount}
      {perNight ? (
        <ThemedText
          variant={size === 'lg' ? 'body' : 'caption'}
          tone="muted">
          {' '}
          {t(STR.listing.perNight)}
        </ThemedText>
      ) : null}
    </ThemedText>
  );
}
