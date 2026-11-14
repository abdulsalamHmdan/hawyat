# الحاويات

تطبيق جوال خاص لمخيم «الحاويات»: القطة والمصاريف والحضور والعزايم، بدون إحراج.

![الهوية](design/screens/00-brand.png)

## البداية من الجوال
1. افتح Claude Code من الجوال، واختر هذا المستودع (`hawyat`).
2. افتح ملف [`PROMPT.md`](PROMPT.md)، انسخ النص اللي فيه، والصقه في المحادثة.
3. Claude Code يشتغل مرحلة مرحلة. بعد كل مرحلة يفتح Pull Request ويقول لك كيف تجرّب من جوالك. جرّب، وادمج الطلب، وقل له «كمّل المرحلة اللي بعدها».

## محتويات المستودع
| المسار | وش فيه |
| --- | --- |
| `PROMPT.md` | البرومبت اللي تلصقه في Claude Code |
| `CLAUDE.md` | قواعد المشروع، يقراها Claude Code لحاله كل مرة |
| `docs/SPEC.md` | المواصفات الكاملة |
| `design/` | الهوية، الألوان، الثيم الجاهز للكود، وصور الشاشات التسع |
| `assets/` | الخطوط، الشعار، أيقونة التطبيق |

لو عدّلت فكرة أو أضفت ميزة، عدّل `docs/SPEC.md` أول، وبعدين قل لـ Claude Code يقراه.

> المستودع عام. لا تحط فيه أي كلمة مرور أو رابط قاعدة بيانات؛ مكانها متغيرات البيئة.

## التشغيل (كل الخطوات من متصفح الجوال)
التطبيق آيفون فقط. قبل ما تسوي الخطوات يشتغل بنسخة **تجريبية** ببيانات وهمية، وبعدها يتصل بقاعدة البيانات الحقيقية.

### 1. Expo (عشان تفتح التطبيق في Expo Go)
1. نزّل **Expo Go** من App Store، وسجّل فيه بحساب expo.dev.
2. expo.dev ← صورتك ← **Access tokens** ← **Create token** ← انسخه.
3. GitHub ← المستودع ← **Settings** ← **Secrets and variables** ← **Actions** ← تبويب **Secrets** ← **New repository secret**: الاسم `EXPO_TOKEN`.

### 2. Supabase (قاعدة البيانات والدخول)
1. supabase.com/dashboard ← **New project**. الاسم `hawyat`، المنطقة الأقرب (مثلًا Frankfurt)، واكتب كلمة مرور قوية لقاعدة البيانات واحفظها.
   - الخطة المجانية تسمح بمشروعين نشطين. لو عندك مشروعين، أوقف واحد مؤقتًا (Pause) أو اسأل Claude.
2. من رابط المشروع خذ **رمز المشروع** (الكلمة اللي بعد `/project/`).
3. **Project Settings** ← **API Keys**: انسخ **Publishable key**. ومن **Data API** انسخ **Project URL**.
4. supabase.com/dashboard/account/tokens ← **Generate new token** ← انسخه.
5. في GitHub (نفس صفحة الأسرار):
   - تبويب **Secrets**: `SUPABASE_ACCESS_TOKEN` (التوكن)، `SUPABASE_DB_PASSWORD` (كلمة مرور القاعدة).
   - تبويب **Variables**: `SUPABASE_PROJECT_REF` (رمز المشروع)، `SUPABASE_URL` (Project URL)، `SUPABASE_PUBLISHABLE_KEY` (Publishable key).

### 3. إيميل رمز الدخول (مهم، مجاني)
Supabase لحاله يرسل الرمز لك أنت بس. عشان يوصل لكل الشباب نرسله من إيميل Gmail:
1. myaccount.google.com ← **Security** ← فعّل **2-Step Verification**.
2. myaccount.google.com/apppasswords ← اكتب «الحاويات» ← **Create** ← انسخ الكلمة (16 حرف).
3. في GitHub تبويب **Secrets**: `SMTP_USER` (إيميل Gmail)، `SMTP_PASS` (الكلمة اللي نسختها).

### 4. انشر
- GitHub ← **Actions** ← «نشر قاعدة البيانات» ← **Run workflow**. يسوي الجداول والخصوصية والمهام المجدولة ورسالة الرمز.
- بعدها أي Pull Request ينزل فيه تعليق فيه QR ورابط، افتحه من الآيفون في Expo Go.
- أول واحد يدخل يضغط «أنشئ المخيم» ويصير **مسؤول الصندوق**، وياخذ كود الدعوة من الإعدادات ويرسله للشباب.

### 5. نسخة كاملة للشباب (TestFlight)
الإعلان التلقائي بالموقع وأزرار الرد داخل الإشعار وتوزيع التطبيق على الشباب تحتاج **حساب Apple Developer** (99 دولار بالسنة). لما تقرر:
1. developer.apple.com ← سجّل في البرنامج. خذ **Team ID** من صفحة Membership.
2. appstoreconnect.apple.com ← **Apps** ← **+** ← تطبيق جديد باسم «الحاويات» و Bundle ID `com.hawyat.app`. خذ رقمه (**Apple ID**).
3. App Store Connect ← **Users and Access** ← **Integrations** ← **App Store Connect API** ← مفتاح جديد بصلاحية **Admin**. نزّل ملف `.p8` وافتحه وانسخ محتواه، وخذ **Key ID** و**Issuer ID**.
4. GitHub **Secrets**: `ASC_API_KEY` (محتوى الملف)، `ASC_KEY_ID`، `ASC_ISSUER_ID`، `APPLE_TEAM_ID`. و**Variables**: `ASC_APP_ID`.
5. **Actions** ← «نسخة TestFlight» ← **Run workflow**. بعد نص ساعة تقريبًا تطلع في TestFlight، وتضيف الشباب من App Store Connect ← TestFlight ← **External Testing** بإيميلاتهم.

## للمطوّر
- `npm run check`: TypeScript و ESLint وقواعد التصميم.
- `./scripts/test-db.sh`: الهجرات واختبارات الخصوصية على Postgres مؤقت.
- `supabase/migrations`: الجداول وسياسات RLS والدوال والمهام المجدولة.
