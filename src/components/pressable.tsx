import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { opacity, size } from '@/theme';

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** خفّت العنصر لما يكون معطّل (الافتراضي نعم) */
  dimWhenDisabled?: boolean;
};

/** Pressable مع تعتيم عند الضغط وأقل ارتفاع 44. */
export function Press({ style, dimWhenDisabled = true, ...rest }: Props) {
  return (
    <Pressable
      hitSlop={4}
      {...rest}
      style={({ pressed }) => [
        { minHeight: size.touch, justifyContent: 'center' },
        style,
        pressed && { opacity: opacity.pressed },
        rest.disabled && dimWhenDisabled && { opacity: opacity.disabled },
      ]}
    />
  );
}
