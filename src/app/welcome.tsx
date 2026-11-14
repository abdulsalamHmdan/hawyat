import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Mark, Wordmark } from '@/components/brand/logo';
import { Button } from '@/components/button';
import { Field } from '@/components/controls';
import { Press } from '@/components/pressable';
import { Txt } from '@/components/text';
import { gap, opacity, radius, size, space, useColors } from '@/theme';

/** 01 — الترحيب والدخول. الدخول برمز على الإيميل (مجاني، بدون رسائل SMS). */
export default function Welcome() {
  const c = useColors();
  const [email, setEmail] = useState('');
  const valid = /^\S+@\S+\.\S+$/.test(email.trim());

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.night }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
        <SafeAreaView edges={['top']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[4], paddingHorizontal: space[8], paddingVertical: space[8] }}>
          <Mark width={size.welcomeMark} tone="reverse" />
          <Wordmark width={size.welcomeWordmark} tone="reverse" />
          <Txt v="body" c="sand" center style={{ opacity: opacity.soft, maxWidth: size.textMax }}>
            القطة والعزايم والحضور، كلها بمكان واحد وبدون إحراج.
          </Txt>
        </SafeAreaView>
        <SafeAreaView
          edges={['bottom']}
          style={{
            backgroundColor: c.surfaceRaised,
            borderTopStartRadius: radius.lg,
            borderTopEndRadius: radius.lg,
            paddingHorizontal: space[6],
            paddingTop: space[8],
            paddingBottom: space[6],
            gap: gap.form,
          }}>
          <View style={{ gap: space[1] }}>
            <Txt v="display" accessibilityRole="header">
              ادخل بإيميلك
            </Txt>
            <Txt v="bodySm" c="inkMuted">
              بنرسل لك رمز من 6 أرقام
            </Txt>
          </View>
          <Field
            label="الإيميل"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={() => valid && router.push({ pathname: '/verify', params: { email } })}
          />
          <Button
            label="أرسل الرمز"
            variant="primary"
            large
            block
            disabled={!valid}
            onPress={() => router.push({ pathname: '/verify', params: { email } })}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: gap.tight }}>
            <Txt v="body" c="inkMuted">
              عندك كود دعوة من الشباب؟
            </Txt>
            <Press onPress={() => router.push('/join')} accessibilityRole="link" accessibilityLabel="انضم بالكود">
              <Txt v="bodyStrong" c="olive">
                انضم بالكود
              </Txt>
            </Press>
          </View>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
