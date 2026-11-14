import { router } from 'expo-router';
import { ArrowRight, X, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, size, space, useColors } from '@/theme';

import { Button, IconButton } from './button';
import { Card, Divider } from './surface';
import { Txt } from './text';

/** شاشة بخلفية surface وهامش space-4، قابلة للتمرير. */
export function Screen({
  children,
  footer,
  gap = space[6],
  edges = ['top'],
  onRefresh,
  refreshing = false,
  ...scroll
}: ScrollViewProps & {
  children: ReactNode;
  footer?: ReactNode;
  gap?: number;
  edges?: ('top' | 'bottom')[];
  /** سحب للتحديث */
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const c = useColors();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: c.surface }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.olive} /> : undefined}
        {...scroll}
        contentContainerStyle={[
          { paddingHorizontal: space[4], paddingTop: space[4], paddingBottom: space[8], gap },
          scroll.contentContainerStyle,
        ]}>
        {children}
      </ScrollView>
      {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** عنوان أعلى الشاشة مع زر رجوع (→) أو إغلاق (×) أو إجراء. */
export function ScreenHeader({
  title,
  sub,
  back,
  close,
  action,
}: {
  title: string;
  sub?: string;
  back?: boolean;
  close?: boolean;
  action?: ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
      {back && <IconButton icon={ArrowRight} label="رجوع" onPress={() => router.back()} />}
      <View style={{ flex: 1 }}>
        <Txt v="display" accessibilityRole="header">
          {title}
        </Txt>
        {sub ? (
          <Txt v="bodySm" c="inkMuted">
            {sub}
          </Txt>
        ) : null}
      </View>
      {close && <IconButton icon={X} label="إغلاق" tone="sunken" onPress={() => router.back()} />}
      {action}
    </View>
  );
}

/** عنوان قسم صغير خافت فوق مجموعة بطاقات. */
export function SectionLabel({ children }: { children: string }) {
  return (
    <Txt v="section" c="inkMuted" accessibilityRole="header">
      {children}
    </Txt>
  );
}

export function Section({ label, children, gap = 6 }: { label: string; children: ReactNode; gap?: number }) {
  return (
    <View style={{ gap }}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </View>
  );
}

/** بطاقة فيها صفوف مفصولة بخط. */
export function ListCard({ children }: { children: ReactNode[] | ReactNode }) {
  const items = (Array.isArray(children) ? children : [children]).filter(Boolean);
  return (
    <Card padded={false} flush>
      {items.map((child, i) => (
        <View key={i}>
          {i > 0 && <Divider />}
          {child}
        </View>
      ))}
    </Card>
  );
}

/** صف في قائمة: عنصر بداية (صورة/أيقونة)، عنوان ووصف، وعنصر نهاية. */
export function Row({ lead, title, sub, trail }: { lead?: ReactNode; title: string; sub?: string; trail?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[4], paddingVertical: space[3] }}>
      {lead}
      <View style={{ flex: 1 }}>
        <Txt v="bodyStrong">{title}</Txt>
        {sub ? (
          <Txt v="bodySm" c="inkMuted">
            {sub}
          </Txt>
        ) : null}
      </View>
      {trail}
    </View>
  );
}

/** مربع أيقونة ملوّن بداية الصف (قطة، مصروف). */
export function IconTile({ icon: Icon, tone = 'ember' }: { icon: LucideIcon; tone?: 'ember' | 'neutral' }) {
  const c = useColors();
  return (
    <View
      style={{
        width: size.iconTile,
        height: size.iconTile,
        borderRadius: radius.sm + 2,
        backgroundColor: tone === 'ember' ? c.emberSoft : c.surfaceSunken,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon size={size.icon + 2} color={tone === 'ember' ? c.ember : c.ink} strokeWidth={2} />
    </View>
  );
}

/** حالة تحميل أو خطأ بسيطة داخل الشاشة. */
export function Status({ loading, error, onRetry, empty }: { loading?: boolean; error?: unknown; onRetry?: () => void; empty?: string }) {
  if (loading) {
    return (
      <Txt v="bodySm" c="inkMuted" center>
        لحظة...
      </Txt>
    );
  }
  if (error) {
    return (
      <View style={{ alignItems: 'center', gap: space[2] }}>
        <Txt v="bodySm" c="inkMuted" center>
          ما قدرنا نجيب البيانات. تأكد من الإنترنت.
        </Txt>
        {onRetry && <Button label="جرّب مرة ثانية" variant="quiet" onPress={onRetry} />}
      </View>
    );
  }
  if (empty) {
    return (
      <Txt v="bodySm" c="inkMuted" center>
        {empty}
      </Txt>
    );
  }
  return null;
}
