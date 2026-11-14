import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/button';
import { Field } from '@/components/controls';
import { Screen, ScreenHeader } from '@/components/layout';
import { Txt } from '@/components/text';
import { gap, space } from '@/theme';

/** الانضمام بكود الدعوة اللي أرسله مسؤول الصندوق في الواتساب. */
export default function Join() {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const ok = code.trim().length >= 4 && /^\S+@\S+\.\S+$/.test(email.trim());
  return (
    <Screen gap={gap.form}>
      <ScreenHeader title="انضم بالكود" sub="الكود يرسله مسؤول الصندوق في القروب" back />
      <Field
        label="كود الدعوة"
        placeholder="HWY-0000"
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <Field
        label="إيميلك"
        placeholder="name@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Txt v="bodySm" c="inkMuted">
        بنرسل لك رمز على الإيميل عشان نتأكد إنه لك.
      </Txt>
      <Button
        label="انضم"
        variant="primary"
        large
        block
        disabled={!ok}
        onPress={() => router.push({ pathname: '/verify', params: { email } })}
        style={{ marginTop: space[2] }}
      />
    </Screen>
  );
}
