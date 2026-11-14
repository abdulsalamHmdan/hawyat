import Svg, { Defs, G, Mask, Path, Rect } from 'react-native-svg';

import { useColors } from '@/theme';

import { WORDMARK_PATH, WORDMARK_VIEWBOX } from './wordmark-path';

type Tone = 'default' | 'reverse';

/** رمز الحاوية (باب مفتوح والنور شغّال). مأخوذ من assets/logo/hawiyat-mark.svg. */
export function Mark({
  width = 124,
  tone = 'default',
  simple = false,
  color,
}: {
  width?: number;
  tone?: Tone;
  simple?: boolean;
  /** لون جسم الحاوية لو كان فوق تعبئة ملونة (مثل زر «وصلت المخيم»). */
  color?: string;
}) {
  const c = useColors();
  const body = color ?? (tone === 'reverse' ? c.sand : c.olive);
  const height = (width * 100) / 124;
  const id = `mark-${tone}-${simple ? 's' : 'f'}`;
  return (
    <Svg width={width} height={height} viewBox="0 0 124 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        <Mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="124" height="100">
          <Rect x="0" y="0" width="124" height="100" fill="#fff" />
          <G fill="#000">
            <Rect x="19" y="20" width="4.5" height="60" rx="1" />
            <Rect x="33" y="20" width="4.5" height="60" rx="1" />
            {!simple && (
              <>
                <Rect x="23" y="47" width="5" height="6" rx="1" />
                <Rect x="37" y="47" width="5" height="6" rx="1" />
                <Rect x="10" y="13" width="80" height="2.5" />
                <Rect x="10" y="84.5" width="80" height="2.5" />
                <Path d="M104.5 18.5 L108.5 20 L108.5 80 L104.5 81.5z" />
                <Path d="M112 21.3 L115 22.4 L115 77.6 L112 78.7z" />
              </>
            )}
            <Rect x="51" y="16" width="38" height="68" />
          </G>
        </Mask>
      </Defs>
      <G mask={`url(#${id})`} fill={body}>
        <Rect x="4" y="6" width="92" height="88" rx="6" />
        <Path d="M98 6 L120 14 L120 86 L98 94z" />
      </G>
      <Rect x="51" y="16" width="38" height="68" fill={c.glow} />
    </Svg>
  );
}

/** «الحاويات» مكتوبة بـ Changa 800 ومحوّلة لمسارات (لا تكتبها بالخط). */
export function Wordmark({ width = 220, tone = 'default' }: { width?: number; tone?: Tone }) {
  const c = useColors();
  const height = (width * WORDMARK_VIEWBOX.height) / WORDMARK_VIEWBOX.width;
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${WORDMARK_VIEWBOX.width} ${WORDMARK_VIEWBOX.height}`}
      accessibilityRole="image"
      accessibilityLabel="الحاويات">
      <Path d={WORDMARK_PATH} fill={tone === 'reverse' ? c.sand : c.ink} />
    </Svg>
  );
}
