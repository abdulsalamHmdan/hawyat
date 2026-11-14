import type { LucideIcon } from 'lucide-react-native';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, size, space, useColors, type AppColors } from '@/theme';

import { Press } from './pressable';
import { useCardShadow } from './surface';
import { Txt } from './text';

type Variant = 'primary' | 'ember' | 'secondary' | 'quiet';

const palette = (c: AppColors, v: Variant) =>
  ({
    primary: { bg: c.olive, border: c.olive, fg: 'onOlive' as const },
    ember: { bg: c.ember, border: c.ember, fg: 'onEmber' as const },
    secondary: { bg: c.surfaceRaised, border: c.lineStrong, fg: 'ink' as const },
    quiet: { bg: 'transparent', border: 'transparent', fg: 'olive' as const },
  })[v];

export function Button({
  label,
  onPress,
  variant = 'secondary',
  icon: Icon,
  large,
  block,
  disabled,
  style,
  accessibilityLabel,
  muted,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  large?: boolean;
  block?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** نص ثانوي (مثل «اقفل القطة») */
  muted?: boolean;
}) {
  const c = useColors();
  const p = palette(c, variant);
  const fg = muted ? 'inkMuted' : p.fg;
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        {
          minHeight: large ? size.buttonLg : size.button,
          paddingHorizontal: variant === 'quiet' ? space[3] : space[6],
          borderRadius: radius.md,
          borderWidth: size.border,
          borderColor: p.border,
          backgroundColor: p.bg,
          alignItems: 'center',
        },
        block && { alignSelf: 'stretch' },
        style,
      ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[2] }}>
        {Icon && <Icon size={size.icon} color={c[fg]} strokeWidth={2} />}
        <Txt v={large ? 'bodyStrong' : 'label'} c={fg}>
          {label}
        </Txt>
      </View>
    </Press>
  );
}

/** زر دائري للأيقونة فقط (رجوع، إغلاق، الإشعارات). */
export function IconButton({
  icon: Icon,
  onPress,
  label,
  tone = 'raised',
}: {
  icon: LucideIcon;
  onPress?: () => void;
  label: string;
  tone?: 'raised' | 'sunken';
}) {
  const c = useColors();
  const sh = useCardShadow();
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        {
          width: size.iconButton,
          height: size.iconButton,
          borderRadius: radius.full,
          alignItems: 'center',
          backgroundColor: tone === 'raised' ? c.surfaceRaised : c.surfaceSunken,
        },
        tone === 'raised' && sh,
      ]}>
      <Icon size={size.iconHeader} color={c.ink} strokeWidth={2} />
    </Press>
  );
}
