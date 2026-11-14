import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { FormError } from '@/components/form-error';
import { Screen, ScreenHeader } from '@/components/layout';
import { Press } from '@/components/pressable';
import { Txt } from '@/components/text';
import { backend } from '@/data';
import { errorText } from '@/data/hooks';
import { shape, size, space, text, useColors } from '@/theme';

const LEN = 6;

/** إدخال رمز التحقق اللي وصل على الإيميل. */
export default function Verify() {
  const c = useColors();
  const { email = '', code: invite } = useLocalSearchParams<{ email?: string; code?: string }>();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  const submit = async (value = code) => {
    if (value.length < LEN || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await backend.verifyCode(email, value);
      router.replace(invite ? { pathname: '/profile-setup', params: { code: invite } } : '/');
    } catch (e) {
      setErr(errorText(e));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen gap={space[6]}>
      <ScreenHeader title="اكتب الرمز" sub={email ? `أرسلناه على ${email}` : 'أرسلناه على إيميلك'} back />
      <Press onPress={() => input.current?.focus()} accessibilityLabel={`الرمز، ${code.length} من ${LEN}`}>
        <View style={{ flexDirection: 'row', direction: 'ltr', justifyContent: 'center', gap: space[2] }}>
          {Array.from({ length: LEN }).map((_, i) => {
            const active = i === code.length;
            return (
              <View
                key={i}
                style={{
                  width: size.codeCell,
                  height: size.field + space[2],
                  borderRadius: shape.field,
                  borderWidth: active ? 2 : size.border,
                  borderColor: active ? c.focus : c.lineStrong,
                  backgroundColor: c.surfaceRaised,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Txt v="code">{code[i] ?? ''}</Txt>
              </View>
            );
          })}
        </View>
      </Press>
      <TextInput
        ref={input}
        value={code}
        onChangeText={(t) => {
          const v = t.replace(/\D/g, '').slice(0, LEN);
          setCode(v);
          if (v.length === LEN) submit(v);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus
        maxLength={LEN}
        style={[text.input, { position: 'absolute', opacity: 0, height: 1, width: 1 }]}
        accessibilityLabel="رمز التحقق"
      />
      <FormError text={err} />
      <Button label={busy ? 'لحظة...' : 'تأكيد'} variant="primary" large block disabled={code.length < LEN || busy} onPress={() => submit()} />
      <View style={{ alignItems: 'center' }}>
        <Button
          label={resent ? 'أرسلناه مرة ثانية' : 'ما وصلني، أرسله مرة ثانية'}
          variant="quiet"
          disabled={resent}
          onPress={async () => {
            setErr(null);
            try {
              await backend.sendCode(email);
              setResent(true);
            } catch (e) {
              setErr(errorText(e));
            }
          }}
        />
        <Txt v="small" c="inkMuted" center>
          شيك على البريد غير المرغوب فيه لو ما لقيته
        </Txt>
      </View>
    </Screen>
  );
}
