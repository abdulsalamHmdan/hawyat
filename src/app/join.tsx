import { router } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/button';
import { Field } from '@/components/controls';
import { FormError } from '@/components/form-error';
import { Screen, ScreenHeader } from '@/components/layout';
import { Txt } from '@/components/text';
import { backend } from '@/data';
import { errorText } from '@/data/hooks';
import { gap, space } from '@/theme';

/** الانضمام بكود الدعوة اللي أرسله مسؤول الصندوق في الواتساب. */
export default function Join() {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ok = code.trim().length >= 4 && /^\S+@\S+\.\S+$/.test(email.trim());

  const go = async () => {
    setBusy(true);
    setErr(null);
    try {
      await backend.sendCode(email);
      router.push({ pathname: '/verify', params: { email: email.trim(), code: code.trim() } });
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen gap={gap.form}>
      <ScreenHeader title="انضم بالكود" sub="الكود يرسله مسؤول الصندوق في القروب" back />
      <Field
        label="كود الدعوة"
        placeholder="مثلًا A4C21F"
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
      <FormError text={err} />
      <Button label="انضم" variant="primary" large block disabled={!ok || busy} onPress={go} style={{ marginTop: space[2] }} />
    </Screen>
  );
}
