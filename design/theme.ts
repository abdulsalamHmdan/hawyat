// الحاويات — ثيم التطبيق، مولّد من design/tokens.json. عدّل الرموز هناك ثم حدّث هذا الملف.

const lightColors = {
  surface: '#f7f1e6', // خلفية الشاشات: رمل فاتح نهارًا، ليل المخيم في الوضع الداكن.
  surfaceRaised: '#fffcf6', // البطاقات والنوافذ المنبثقة والقوائم.
  surfaceSunken: '#efe5d3', // الحقول، شريط التبويبات المجزأ، خلفية شريط التقدم.
  line: '#e2d5bd', // فواصل رفيعة بين الصفوف وحدود البطاقات. زخرفي فقط.
  lineStrong: '#8f7d65', // حدود الحقول والمفاتيح ومربعات الاختيار: 3:1 على surface و surface-raised في الوضعين.
  ink: '#2a2118', // النص الأساسي على surface و surface-raised و surface-sunken و olive-soft و ember-soft.
  inkMuted: '#6b5b4a', // النص الثانوي: الوقت، الأسماء الفرعية، التلميحات؛ على surface و surface-raised و surface-sunken.
  olive: '#4e5e2c', // لون الهوية: الزر الأساسي، التبويب النشط، حالة «دفعت»، وجسم الحاوية في الشعار. كنص: على surface و surface-raised و olive-soft.
  onOlive: '#fffcf6', // النص والأيقونات فوق تعبئة olive (عنوان الزر الأساسي).
  oliveSoft: '#e4e7d0', // خلفية ملونة خلف نص olive: شارة «دفعت»، بطاقة «في المخيم الآن».
  ember: '#b5481c', // لون العزايم والتنبيه: زر «عزيمة»، حالة «ما دفعت»، شارة الإشعارات. كنص: على surface و surface-raised و ember-soft.
  onEmber: '#fffcf6', // النص والأيقونات فوق تعبئة ember.
  emberSoft: '#fcede4', // خلفية ملونة خلف نص ember: شارة «ما دفعت»، بطاقة الدعوة.
  glow: '#d9622b', // الضوء داخل باب الحاوية: نقطة «موجود الآن» وحلقة الحضور وداخل الشعار. علامة فقط، لا نص: 3:1 على surface-raised و night.
  night: '#1e1a15', // سطح ليلي داكن: خلفية أيقونة التطبيق وبطاقة الجلسة الحية في الوضع الفاتح.
  sand: '#f2e6cf', // لون الشعار المعكوس فوق night و olive، والنص فوق night.
  focus: '#4e5e2c', // حلقة التركيز: 2px صلبة بإزاحة 2px، 3:1 على كل الأسطح.
} as const;

const darkColors = {
  surface: '#17130f', // خلفية الشاشات: رمل فاتح نهارًا، ليل المخيم في الوضع الداكن.
  surfaceRaised: '#221c16', // البطاقات والنوافذ المنبثقة والقوائم.
  surfaceSunken: '#100d0a', // الحقول، شريط التبويبات المجزأ، خلفية شريط التقدم.
  line: '#3a3128', // فواصل رفيعة بين الصفوف وحدود البطاقات. زخرفي فقط.
  lineStrong: '#7d6d58', // حدود الحقول والمفاتيح ومربعات الاختيار: 3:1 على surface و surface-raised في الوضعين.
  ink: '#f3ece1', // النص الأساسي على surface و surface-raised و surface-sunken و olive-soft و ember-soft.
  inkMuted: '#b8a994', // النص الثانوي: الوقت، الأسماء الفرعية، التلميحات؛ على surface و surface-raised و surface-sunken.
  olive: '#a9bc6e', // لون الهوية: الزر الأساسي، التبويب النشط، حالة «دفعت»، وجسم الحاوية في الشعار. كنص: على surface و surface-raised و olive-soft.
  onOlive: '#17130f', // النص والأيقونات فوق تعبئة olive (عنوان الزر الأساسي).
  oliveSoft: '#2b3219', // خلفية ملونة خلف نص olive: شارة «دفعت»، بطاقة «في المخيم الآن».
  ember: '#f08a4b', // لون العزايم والتنبيه: زر «عزيمة»، حالة «ما دفعت»، شارة الإشعارات. كنص: على surface و surface-raised و ember-soft.
  onEmber: '#17130f', // النص والأيقونات فوق تعبئة ember.
  emberSoft: '#3d2314', // خلفية ملونة خلف نص ember: شارة «ما دفعت»، بطاقة الدعوة.
  glow: '#f08a4b', // الضوء داخل باب الحاوية: نقطة «موجود الآن» وحلقة الحضور وداخل الشعار. علامة فقط، لا نص: 3:1 على surface-raised و night.
  night: '#2a2219', // سطح ليلي داكن: خلفية أيقونة التطبيق وبطاقة الجلسة الحية في الوضع الفاتح.
  sand: '#f2e6cf', // لون الشعار المعكوس فوق night و olive، والنص فوق night.
  focus: '#c5d48e', // حلقة التركيز: 2px صلبة بإزاحة 2px، 3:1 على كل الأسطح.
} as const;

export const colors = { light: lightColors, dark: darkColors };
export type ThemeColors = { [K in keyof typeof lightColors]: string };

export const space = {1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32} as const;
export const radius = {xs: 4, sm: 10, md: 16, lg: 24, full: 9999} as const;

// أسماء الخطوط كما تُحمّل بـ expo-font (انظر assets/fonts)
export const fonts = {
  display600: 'Changa-600', display700: 'Changa-700', display800: 'Changa-800',
  sans400: 'IBMPlexSansArabic-400', sans500: 'IBMPlexSansArabic-500', sans600: 'IBMPlexSansArabic-600', sans700: 'IBMPlexSansArabic-700',
} as const;

export const fontFiles = {
  'Changa-600': require('../assets/fonts/Changa-600.ttf'),
  'Changa-700': require('../assets/fonts/Changa-700.ttf'),
  'Changa-800': require('../assets/fonts/Changa-800.ttf'),
  'IBMPlexSansArabic-400': require('../assets/fonts/IBMPlexSansArabic-400.ttf'),
  'IBMPlexSansArabic-500': require('../assets/fonts/IBMPlexSansArabic-500.ttf'),
  'IBMPlexSansArabic-600': require('../assets/fonts/IBMPlexSansArabic-600.ttf'),
  'IBMPlexSansArabic-700': require('../assets/fonts/IBMPlexSansArabic-700.ttf'),
};

// أنماط النص. في React Native الوزن يأتي من ملف الخط نفسه، فلا تضع fontWeight.
export const type = {
  displayXl: { fontFamily: fonts.display800, fontSize: 40, lineHeight: 48 }, // شاشة الترحيب واسم المخيم فقط.
  display: { fontFamily: fonts.display700, fontSize: 28, lineHeight: 36 }, // عنوان أعلى كل شاشة.
  title: { fontFamily: fonts.display700, fontSize: 20, lineHeight: 28 }, // عناوين البطاقات والأقسام.
  amount: { fontFamily: fonts.display700, fontSize: 32, lineHeight: 36 }, // المبالغ الكبيرة: مبلغ القطة، رصيدك في الحساب.
  body: { fontFamily: fonts.sans400, fontSize: 16, lineHeight: 26 }, // النص الأساسي.
  bodyStrong: { fontFamily: fonts.sans600, fontSize: 16, lineHeight: 26 }, // أسماء الأشخاص وسطر الحالة المهم.
  bodySm: { fontFamily: fonts.sans400, fontSize: 14, lineHeight: 22 }, // النص الثانوي والوصف تحت العناوين.
  label: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 20 }, // عناوين الأزرار والتبويبات.
  caption: { fontFamily: fonts.sans500, fontSize: 12, lineHeight: 18 }, // الشارات والطوابع الزمنية الصغيرة.
} as const;

export const shadow = {
  card: { shadowColor: '#2a2118', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  sheet: { shadowColor: '#2a2118', shadowOpacity: 0.14, shadowRadius: 24, shadowOffset: { width: 0, height: -8 }, elevation: 8 },
} as const;
