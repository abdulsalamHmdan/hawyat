import { Text as RNText, type TextProps } from 'react-native';

import { text, useColors, type AppColors, type TextVariant } from '@/theme';

export type TxtProps = TextProps & {
  v?: TextVariant;
  c?: keyof AppColors;
  center?: boolean;
};

/** النص الأساسي في التطبيق: النمط من الثيم واللون من رموز الألوان. */
export function Txt({ v = 'body', c = 'ink', center, style, ...rest }: TxtProps) {
  const colors = useColors();
  return (
    <RNText
      {...rest}
      style={[text[v], { color: colors[c], writingDirection: 'rtl' }, center && { textAlign: 'center' }, style]}
    />
  );
}
