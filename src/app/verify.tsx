import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen, ScreenHeader } from '@/components/layout';
import { Press } from '@/components/pressable';
import { Txt } from '@/components/text';
import { radius, shape, size, space, text, useColors } from '@/theme';

const LEN = 6;

/** إدخال رمز التحقق اللي وصل على الإيميل. */
export default function Verify() {
  const c = useColors();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState('');
  const input = useRef<ComponentRef<typeof TextInput>>(null);

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
        onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, LEN))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus
        maxLength={LEN}
        style={[text.input, { position: 'absolute', opacity: 0, height: 1, width: 1 }]}
        accessibilityLabel="رمز التحقق"
      />
      <Button
        label="تأكيد"
        variant="primary"
        large
        block
        disabled={code.length < LEN}
        onPress={() => router.replace('/profile-setup')}
      />
      <View style={{ alignItems: 'center', borderRadius: radius.md }}>
        <Button label="ما وصلني، أرسله مرة ثانية" variant="quiet" onPress={() => setCode('')} />
      </View>
    </Screen>
  );
}
