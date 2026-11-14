import type { LucideIcon } from 'lucide-react-native';
import { TextInput, View, type TextInputProps } from 'react-native';

import { opacity, radius, shape, size, space, text, useColors } from '@/theme';

import { Press } from './pressable';
import { useCardShadow } from './surface';
import { Txt } from './text';

/** مفتاح تشغيل/إطفاء بنفس شكل التصميم (المقبض يمين لما يكون مطفي). */
export function Switch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const c = useColors();
  const sw = size.switch;
  return (
    <Press
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}>
      <View
        style={{
          width: sw.width,
          height: sw.height,
          borderRadius: radius.full,
          borderWidth: size.border,
          borderColor: value ? c.olive : c.lineStrong,
          backgroundColor: value ? c.olive : c.surfaceSunken,
          justifyContent: 'center',
          paddingHorizontal: 3,
          // في RTL: flex-start = يمين (مطفي)، flex-end = يسار (شغّال)
          alignItems: value ? 'flex-end' : 'flex-start',
        }}>
        <View
          style={{
            width: sw.knob,
            height: sw.knob,
            borderRadius: radius.full,
            backgroundColor: value ? c.onOlive : c.lineStrong,
          }}
        />
      </View>
    </Press>
  );
}

/** صف بعنوان ووصف ومفتاح (تخصيص الإشعارات). */
export function ToggleRow({
  title,
  sub,
  value,
  onChange,
  disabled,
}: {
  title: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space[3],
        paddingVertical: space[3],
        paddingHorizontal: space[4],
        opacity: disabled ? opacity.off : 1,
      }}
      pointerEvents={disabled ? 'none' : 'auto'}>
      <View style={{ flex: 1 }}>
        <Txt v="rowTitle">{title}</Txt>
        {sub ? (
          <Txt v="rowSub" c="inkMuted">
            {sub}
          </Txt>
        ) : null}
      </View>
      <Switch value={value} onChange={onChange} label={title} />
    </View>
  );
}

/** شريط اختيار من خيارين أو أكثر على surface-sunken. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const c = useColors();
  const sh = useCardShadow();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        gap: space[1],
        padding: space[1],
        backgroundColor: c.surfaceSunken,
        borderRadius: shape.field,
      }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Press
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            style={[
              { flex: 1, alignItems: 'center', borderRadius: shape.segment },
              on && { backgroundColor: c.surfaceRaised, ...sh },
            ]}>
            <Txt v={on ? 'bodyStrong' : 'label'} c={on ? 'ink' : 'inkMuted'}>
              {o.label}
            </Txt>
          </Press>
        );
      })}
    </View>
  );
}

/** زر اختيار بشكل حبة (الوقت، الأشخاص، الموعد). */
export function Pill({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Press
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}>
      <View
        style={{
          minHeight: size.reply,
          paddingHorizontal: space[4] + 2,
          borderRadius: radius.full,
          borderWidth: size.border,
          borderColor: on ? c.olive : c.lineStrong,
          backgroundColor: on ? c.olive : c.surfaceRaised,
          justifyContent: 'center',
        }}>
        <Txt v="label" c={on ? 'onOlive' : 'ink'}>
          {label}
        </Txt>
      </View>
    </Press>
  );
}

/** بطاقة اختيار بأيقونة (نوع العزيمة). */
export function ChoiceTile({
  label,
  icon: Icon,
  on,
  onPress,
}: {
  label: string;
  icon: LucideIcon;
  on: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Press
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      style={{
        flex: 1,
        minHeight: size.choice,
        borderRadius: radius.md,
        borderWidth: size.border,
        borderColor: on ? c.olive : c.lineStrong,
        backgroundColor: on ? c.olive : c.surfaceRaised,
        alignItems: 'center',
        gap: 6,
      }}>
      <Icon size={size.iconTab} color={on ? c.onOlive : c.ink} strokeWidth={2} />
      <Txt v="smallStrong" c={on ? 'onOlive' : 'ink'}>
        {label}
      </Txt>
    </Press>
  );
}

/** حقل إدخال نص. */
export function Field({
  label,
  hint,
  suffix,
  big,
  ...input
}: TextInputProps & { label?: string; hint?: string; suffix?: string; big?: boolean }) {
  const c = useColors();
  return (
    <View style={{ gap: space[2] }}>
      {label ? (
        <Txt v="linkSm">
          {label}
          {hint ? <Txt v="linkSm" c="inkMuted" style={{ fontFamily: text.bodySm.fontFamily }}>{` ${hint}`}</Txt> : null}
        </Txt>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: big ? size.fieldLg : size.field,
          borderWidth: size.border,
          borderColor: c.lineStrong,
          borderRadius: shape.field,
          backgroundColor: c.surfaceRaised,
          paddingHorizontal: space[4],
        }}>
        <TextInput
          placeholderTextColor={c.inkMuted}
          accessibilityLabel={label}
          {...input}
          style={[
            big ? text.amount : text.input,
            { flex: 1, minWidth: 0, color: c.ink, paddingVertical: space[2] },
            input.style,
          ]}
        />
        {suffix ? (
          <Txt v="body" c="inkMuted">
            {suffix}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

export function Progress({ value }: { value: number }) {
  const c = useColors();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      style={{ height: size.progress, borderRadius: radius.full, backgroundColor: c.surfaceSunken, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: c.olive, borderRadius: radius.full }} />
    </View>
  );
}
