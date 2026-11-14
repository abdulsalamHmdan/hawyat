import type { ExpenseCategory, ReplyKind, Treat } from './types';

export const TREAT_LABEL: Record<Treat, string> = {
  tea: 'شاهي',
  coffee: 'قهوة',
  dinner: 'عشاء',
  bbq: 'شوي',
};

export const REPLY_LABEL: Record<ReplyKind, string> = {
  coming: 'جايكم',
  soon: 'قريب، دقايق',
  dinner: 'معكم بالعشاء',
  cant: 'ما أقدر',
};

/** الحالة المختصرة تحت الصورة الرمزية في الرئيسية. */
export const REPLY_SHORT: Record<ReplyKind, string> = {
  coming: 'جاي',
  soon: 'قريب',
  dinner: 'جاي',
  cant: 'ما يقدر',
};

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  firewood: 'حطب',
  food: 'أكل',
  gas: 'غاز',
  maintenance: 'صيانة',
  other: 'أخرى',
};
