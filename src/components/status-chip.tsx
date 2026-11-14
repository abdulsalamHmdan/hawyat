import { Check, Clock } from 'lucide-react-native';
import { View } from 'react-native';

import { radius, size, space, useColors } from '@/theme';

import { Txt } from './text';

export type ChipTone = 'paid' | 'due' | 'neutral';

/**
 * حالة الدفع. يشوفها العضو عن نفسه، ومنشئ القطة عن الكل.
 * ممنوع تُستخدم في أي قائمة أو عدّاد يكشف دفع شخص لغيره.
 */
export function StatusChip({ tone, label, icon = true }: { tone: ChipTone; label: string; icon?: boolean }) {
  const c = useColors();
  const bg = { paid: c.oliveSoft, due: c.emberSoft, neutral: c.surfaceSunken }[tone];
  const fg = ({ paid: 'olive', due: 'ember', neutral: 'inkMuted' } as const)[tone];
  const Icon = tone === 'paid' ? Check : tone === 'due' ? Clock : null;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: space[1],
        backgroundColor: bg,
        borderRadius: radius.full,
        paddingVertical: space[1],
        paddingStart: space[3],
        paddingEnd: 10,
      }}>
      {icon && Icon && <Icon size={size.iconSm} strokeWidth={2.5} color={c[fg]} />}
      <Txt v="smallStrong" c={fg}>
        {label}
      </Txt>
    </View>
  );
}
