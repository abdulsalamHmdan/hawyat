import { View } from 'react-native';

import { radius, size, space, useColors } from '@/theme';

import { Press } from './pressable';
import { Txt } from './text';

/** زر رد على الدعوة: «جايكم»، «قريب، دقايق»، «معكم بالعشاء»، «ما أقدر». */
export function QuickReply({
  label,
  on,
  no,
  onPress,
  grow,
}: {
  label: string;
  on?: boolean;
  /** «ما أقدر»: نص خافت */
  no?: boolean;
  onPress?: () => void;
  grow?: boolean;
}) {
  const c = useColors();
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      accessibilityLabel={label}
      style={[{ alignItems: 'center' }, grow && { flexGrow: 1, flexBasis: 0 }]}>
      <View
        style={{
          minHeight: size.reply,
          paddingHorizontal: space[4],
          borderRadius: radius.full,
          borderWidth: size.border,
          borderColor: on ? c.olive : c.lineStrong,
          backgroundColor: on ? c.olive : c.surfaceRaised,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'stretch',
        }}>
        <Txt v="label" c={on ? 'onOlive' : no ? 'inkMuted' : 'ink'} numberOfLines={1}>
          {label}
        </Txt>
      </View>
    </Press>
  );
}
