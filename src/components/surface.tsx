import { View, type ViewProps } from 'react-native';

import { radius, shadow, space, useColors, useIsDark } from '@/theme';

/** ظل البطاقات، أغمق في الوضع الليلي. */
export function useCardShadow(kind: 'card' | 'sheet' = 'card') {
  const dark = useIsDark();
  const c = useColors();
  const base = shadow[kind];
  return dark ? { ...base, shadowColor: c.shadow, shadowOpacity: kind === 'card' ? 0.5 : 0.6 } : base;
}

type CardProps = ViewProps & { tone?: 'raised' | 'night' | 'olive' | 'sunken'; padded?: boolean; flush?: boolean };

/** بطاقة: surface-raised مع shadow-card، أو night لبطاقة الجلسة الحية. */
export function Card({ tone = 'raised', padded = true, flush, style, ...rest }: CardProps) {
  const c = useColors();
  const sh = useCardShadow();
  const bg = { raised: c.surfaceRaised, night: c.night, olive: c.oliveSoft, sunken: c.surfaceSunken }[tone];
  return (
    <View
      {...rest}
      style={[
        { backgroundColor: bg, borderRadius: radius.md },
        tone === 'raised' && sh,
        padded && !flush && { padding: space[4] },
        flush && { overflow: 'hidden' },
        style,
      ]}
    />
  );
}

/** فاصل رفيع بين صفوف البطاقة. */
export function Divider() {
  const c = useColors();
  return <View style={{ height: 1, backgroundColor: c.line }} />;
}
