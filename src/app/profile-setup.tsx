import { router } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Field } from '@/components/controls';
import { Screen, ScreenHeader } from '@/components/layout';
import { Press } from '@/components/pressable';
import { Txt } from '@/components/text';
import { gap, radius, size, space, useColors } from '@/theme';

/** أول مرة: الاسم والصورة. */
export default function ProfileSetup() {
  const c = useColors();
  const [name, setName] = useState('');
  return (
    <Screen gap={gap.form}>
      <ScreenHeader title="عرّفنا عليك" sub="الاسم اللي يشوفه الشباب" />
      <View style={{ alignItems: 'center', gap: space[2] }}>
        <Press accessibilityRole="button" accessibilityLabel="أضف صورة" style={{ alignItems: 'center' }}>
          <Avatar name={name || '؟'} dim={size.profilePhoto} />
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              end: 0,
              width: size.touch - space[1],
              height: size.touch - space[1],
              borderRadius: radius.full,
              backgroundColor: c.olive,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: c.surface,
            }}>
            <Camera size={size.icon} color={c.onOlive} strokeWidth={2} />
          </View>
        </Press>
        <Txt v="bodySm" c="inkMuted">
          الصورة اختيارية
        </Txt>
      </View>
      <Field label="اسمك" placeholder="مثلًا: عبدالسلام" value={name} onChangeText={setName} autoFocus />
      <Button
        label="يلا ندخل"
        variant="primary"
        large
        block
        disabled={!name.trim()}
        onPress={() => router.replace('/home')}
      />
    </Screen>
  );
}
