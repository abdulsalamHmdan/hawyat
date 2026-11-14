import { Image } from 'expo-image';
import { View } from 'react-native';

import { initial } from '@/lib/format';
import { radius, size, space, useColors } from '@/theme';

import { Txt } from './text';

/** صورة رمزية بأول حرف من الاسم. «in» = موجود الآن (حلقة ونقطة glow). */
export function Avatar({
  name,
  uri,
  present,
  dim = size.avatar,
  tone = 'sunken',
}: {
  name: string;
  uri?: string;
  present?: boolean;
  dim?: number;
  tone?: 'sunken' | 'glow';
}) {
  const c = useColors();
  const ring = present ? 4 : 0;
  return (
    <View
      style={{
        width: dim + ring * 2,
        height: dim + ring * 2,
        margin: -ring,
        borderRadius: radius.full,
        borderWidth: present ? 2 : 0,
        borderColor: c.glow,
        padding: present ? 2 : 0,
        backgroundColor: present ? c.surfaceRaised : 'transparent',
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View
        style={{
          flex: 1,
          borderRadius: radius.full,
          backgroundColor: tone === 'glow' ? c.glow : c.surfaceSunken,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
        {uri ? (
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Txt v="avatar" c={tone === 'glow' ? 'night' : 'ink'}>
            {initial(name)}
          </Txt>
        )}
      </View>
      {present && (
        <View
          style={{
            position: 'absolute',
            bottom: 1,
            end: 1,
            width: size.presenceDot + 4,
            height: size.presenceDot + 4,
            borderRadius: radius.full,
            backgroundColor: c.glow,
            borderWidth: 2,
            borderColor: c.surfaceRaised,
          }}
        />
      )}
    </View>
  );
}

/** صورة رمزية مع الاسم وسطر صغير تحتها (الرئيسية). */
export function Person({ name, sub, present }: { name: string; sub: string; present?: boolean }) {
  return (
    <View
      style={{ width: size.person, alignItems: 'center', gap: 6 }}
      accessible
      accessibilityLabel={`${name}، ${sub}`}>
      <Avatar name={name} present={present} />
      <View style={{ alignItems: 'center', marginTop: space[1] }}>
        <Txt v="smallStrong" numberOfLines={1}>
          {name}
        </Txt>
        <Txt v="caption" c="inkMuted" numberOfLines={1}>
          {sub}
        </Txt>
      </View>
    </View>
  );
}
