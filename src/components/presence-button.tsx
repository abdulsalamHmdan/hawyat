import { View } from 'react-native';

import { radius, size, space, useColors } from '@/theme';

import { Mark } from './brand/logo';
import { Press } from './pressable';
import { Txt } from './text';

/** الزر الكبير «وصلت المخيم». لما تكون موجود يصير ليلي وحلقته تنوّر. */
export function PresenceButton({ inCamp, onPress }: { inCamp: boolean; onPress: () => void }) {
  const c = useColors();
  const ring = size.presenceRing;
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={inCamp ? 'أنت في المخيم، اضغط لو طلعت' : 'وصلت المخيم، بلّغ الشباب'}
      style={{ alignItems: 'center' }}>
      <View
        style={{
          width: size.presence + ring * 2 + (inCamp ? 4 : 0),
          height: size.presence + ring * 2 + (inCamp ? 4 : 0),
          borderRadius: radius.full,
          backgroundColor: inCamp ? c.glow : c.oliveSoft,
          padding: inCamp ? 2 : 0,
        }}>
        <View
          style={{
            flex: 1,
            borderRadius: radius.full,
            backgroundColor: inCamp ? c.emberSoft : c.oliveSoft,
            padding: ring,
          }}>
          <View
            style={{
              flex: 1,
              borderRadius: radius.full,
              backgroundColor: inCamp ? c.night : c.olive,
              alignItems: 'center',
              justifyContent: 'center',
              gap: space[2],
            }}>
            <Mark width={size.presenceDoor.width} simple color={inCamp ? c.sand : c.onOlive} />
            <Txt v="presence" c={inCamp ? 'sand' : 'onOlive'}>
              {inCamp ? 'أنت بالمخيم' : 'وصلت المخيم'}
            </Txt>
            <Txt v="small" c={inCamp ? 'sand' : 'onOlive'}>
              {inCamp ? 'طلعت؟ اضغط هنا' : 'بلّغ الشباب'}
            </Txt>
          </View>
        </View>
      </View>
    </Press>
  );
}
