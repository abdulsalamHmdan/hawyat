// تنسيق الأرقام والأوقات: أرقام إنجليزية، والعملة «ريال» بعد الرقم.

export const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
] as const;

export const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] as const;

/** 1840 ← «1,840» */
export function formatNumber(n: number): string {
  const fixed = Number.isInteger(n) ? String(Math.abs(n)) : Math.abs(n).toFixed(2).replace(/\.?0+$/, '');
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (n < 0 ? '-' : '') + grouped + (dec ? `.${dec}` : '');
}

/** 300 ← «300 ريال» */
export function riyal(n: number): string {
  return `${formatNumber(n)} ريال`;
}

/** 21:12 ← «9:12م» */
export function formatTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const suffix = h < 12 ? 'ص' : 'م';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}

/** «السبت 14 نوفمبر» */
export function formatDayDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** «14 نوفمبر» */
export function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function monthName(d: Date): string {
  return MONTHS[d.getMonth()];
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000);
}

/** «اليوم 1:40م» / «أمس 8:15م» / «12 نوفمبر» */
export function formatRelativeDay(d: Date, now = new Date()): string {
  const diff = daysBetween(d, now);
  if (diff === 0) return `اليوم ${formatTime(d)}`;
  if (diff === 1) return `أمس ${formatTime(d)}`;
  return formatDate(d);
}

/** «باقي 6 أيام» */
export function remainingDays(due: Date, now = new Date()): string {
  const n = daysBetween(now, due);
  if (n <= 0) return 'تستحق اليوم';
  if (n === 1) return 'باقي يوم';
  if (n === 2) return 'باقي يومين';
  if (n <= 10) return `باقي ${n} أيام`;
  return `باقي ${n} يوم`;
}

/** «2 من 3» */
export function countOf(part: number, total: number): string {
  return `${part} من ${total}`;
}

export function initial(name: string): string {
  return name.trim().charAt(0);
}
