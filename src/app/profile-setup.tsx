import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Field } from '@/components/controls';
import { FormError } from '@/components/form-error';
import { Screen, ScreenHeader } from '@/components/layout';
import { Press } from '@/components/pressable';
import { Txt } from '@/components/text';
import { backend } from '@/data';
import { errorText, useMe } from '@/data/hooks';
import type { ImageFile } from '@/data/types';
import { pickImage } from '@/lib/image';
import { gap, radius, size, space, useColors } from '@/theme';

/** أول مرة: الاسم والصورة والانضمام (أو إنشاء المخيم). وبعدها: تعديل الاسم والصورة. */
export default function ProfileSetup() {
  const c = useColors();
  const qc = useQueryClient();
  const me = useMe().data;
  const editing = !!me;
  const params = useLocalSearchParams<{ code?: string }>();

  const [name, setName] = useState(me?.member.displayName ?? '');
  const [photo, setPhoto] = useState<ImageFile | null>(null);
  const [code, setCode] = useState(params.code ?? '');
  const [creating, setCreating] = useState(false);
  const [campName, setCampName] = useState('الحاويات');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const valid = name.trim().length > 0 && (editing || (creating ? campName.trim().length > 0 : code.trim().length >= 4));

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      if (!editing) {
        if (creating) await backend.createCamp(campName, name);
        else await backend.joinCamp(code, name);
      }
      await backend.updateProfile({ displayName: name, avatar: photo ?? undefined });
      await qc.invalidateQueries();
      if (editing) router.back();
      else router.replace('/home');
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen gap={gap.form}>
      <ScreenHeader
        title={editing ? 'ملفك' : 'عرّفنا عليك'}
        sub={editing ? 'اسمك وصورتك يشوفها الشباب' : 'الاسم اللي يشوفه الشباب'}
        back={editing}
      />
      <View style={{ alignItems: 'center', gap: space[2] }}>
        <Press
          accessibilityRole="button"
          accessibilityLabel={photo || me?.member.avatarUrl ? 'غيّر الصورة' : 'أضف صورة'}
          style={{ alignItems: 'center' }}
          onPress={async () => {
            const img = await pickImage({ square: true });
            if (img) setPhoto(img);
          }}>
          <Avatar name={name || '؟'} uri={photo?.uri ?? me?.member.avatarUrl} dim={size.profilePhoto} />
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

      <Field label="اسمك" placeholder="مثلًا: عبدالسلام" value={name} onChangeText={setName} maxLength={40} autoFocus={!editing} />

      {!editing &&
        (creating ? (
          <Field label="اسم المخيم" value={campName} onChangeText={setCampName} maxLength={40} />
        ) : (
          <Field
            label="كود الدعوة"
            placeholder="من مسؤول الصندوق"
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        ))}

      <FormError text={err} />
      <Button
        label={busy ? 'لحظة...' : editing ? 'احفظ' : creating ? 'أنشئ المخيم' : 'يلا ندخل'}
        variant="primary"
        large
        block
        disabled={!valid || busy}
        onPress={save}
      />

      {!editing && (
        <View style={{ alignItems: 'center', gap: space[1] }}>
          <Txt v="bodySm" c="inkMuted" center>
            {creating ? 'عندك كود من الشباب؟' : 'أنت أول واحد؟ تصير مسؤول الصندوق'}
          </Txt>
          <Button label={creating ? 'انضم بالكود' : 'أنشئ المخيم'} variant="quiet" onPress={() => setCreating((v) => !v)} />
          <Button label="اطلع من حسابك" variant="quiet" muted onPress={() => backend.signOut().then(() => router.replace('/welcome'))} />
        </View>
      )}
    </Screen>
  );
}
