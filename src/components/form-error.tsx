import { Txt } from './text';

/** سطر خطأ تحت النموذج (بلون ember، بدون علامات تعجب). */
export function FormError({ text }: { text?: string | null }) {
  if (!text) return null;
  return (
    <Txt v="bodySm" c="ember" accessibilityLiveRegion="polite">
      {text}
    </Txt>
  );
}
