# دليل ومتطلبات إطلاق المنصة للإنتاج (Google Ads API Production Checklist)

يهدف هذا المستند إلى توضيح الخطوات والاشتراطات الرسمية المطلوبة من شركة Google لاعتماد المنصة ونشرها للعملاء بشكل رسمي دون مواجهة شاشات التحذير الحمراء أو قيود الاستخدام.

---

## ١. التحقق من تطبيق Google OAuth (Google Cloud Console)
لإزالة شاشة التحذير الحمراء (**Unverified App**) وللسماح لأي مسوق بربط حسابه:

### الخطوات المطلوبة في Google Cloud Console:
1. **تغيير حالة التطبيق (Publishing Status):**
   * تحويل التطبيق من حالة **Testing** إلى **In Production** في شاشة OAuth consent screen.
2. **التعامل مع الصلاحيات الحساسة (Sensitive Scopes):**
   * نطاق الصلاحية المستخدم لدينا هو `https://www.googleapis.com/auth/adwords` (لإدارة وقراءة حملات إعلانات جوجل).
   * يُصنف هذا النطاق كـ **Sensitive Scope**، وبالتالي يتطلب عملية تحقق رسمية (**OAuth Verification**) من جوجل.
3. **متطلبات عملية التحقق (Verification Requirements):**
   * **سياسة الخصوصية (Privacy Policy):** تجهيز صفحة سياسة الخصوصية ونشرها على رابط مباشر تحت نطاق موقعك الرسمي (مثال: `https://adah.sa/privacy`).
   * **فيديو توضيحي (YouTube Demo Video):** تسجيل فيديو قصير غير مدرج (Unlisted) على YouTube يوضح كيفية تسجيل الدخول بـ Google OAuth داخل موقعك، وشاشة الموافقة الصريحة، وكيفية استخدام البيانات (قراءة وإطلاق الحملات واستبعاد الـ IPs).
   * **اسم النطاق الموثق (Authorized Domains):** إضافة نطاق موقعك الرسمي لقائمة النطاقات المصرحة في شاشة الـ OAuth.

---

## ٢. ترقية الـ Developer Token (Developer Token Upgrade)
جوجل توفر ثلاثة مستويات من الوصول للـ Developer Token:

| مستوى الوصول (Access Level) | عدد العمليات المتاحة | الاستخدام المناسب | الترقية المطلوبة |
| :--- | :--- | :--- | :--- |
| **Test Account** | غير محدود (على الحسابات التجريبية فقط) | مرحلة التطوير الحالية | توكن تجريبي افتراضي |
| **Basic Access** (موصى به للإطلاق) | **15,000 عملية يومياً** و **15,000 تقرير يومياً** | كافٍ جداً لمرحلة الإطلاق والنمو الأولى | طلب ترقية مجاني عبر نموذج جوجل يستغرق ١-٢ أسبوع |
| **Standard Access** | عمليات غير محدودة | للشركات الكبرى ومنصات الـ Enterprise | يتطلب نموذج ترقية إضافي وإثبات الحاجة لعمليات ضخمة |

### خطة العمل للترقية:
* يجب التقديم على **Basic Access** فوراً عبر لوحة تحكم حساب مدير إعلانات جوجل (Google Ads Manager Account / MCC) -> قسم API Center.
* جوجل ستطلب تعبئة نموذج يشرح طبيعة التطبيق (منصة لإدارة الحملات ومكافحة الاحتيال بالذكاء الاصطناعي للشركات الصغيرة والمتوسطة)، والالتزام بسياسات الاستخدام العادل (Required Minimum Functionality - RMF).

---

## ٣. متغيرات البيئة للإنتاج (Environment Variables)
عند رفع الموقع على الدومين الحقيقي (مثال: Vercel أو VPS)، يجب استبدال قيم `localhost` بالقيم الإنتاجية في ملف `.env` الإنتاجي:

```env
# رابط الموقع الأساسي
NEXTAUTH_URL=https://adah.sa

# روابط الـ OAuth المحدثة في Google Cloud Console
# يجب إضافة الرابط أدناه في قائمة Authorized Redirect URIs
# https://adah.sa/api/auth/callback/google

# قاعدة البيانات (Supabase)
# تأكد من استخدام الـ Connection Pooler للإنتاج (المنفذ 6543) لمنع اختناق قواعد البيانات عند تعدد الزيارات
DATABASE_URL="postgresql://postgres:[password]@db.zsjfagvmscmnxqycudqv.supabase.co:6543/postgres?pgbouncer=true&connection_limit=10"
```

---

## ٤. الجدول الزمني المقدر للإطلاق للإنتاج (Estimation Timeline)

```mermaid
gantt
    title جدول مراجعات واعتمادات جوجل (Google Approvals)
    dateFormat  YYYY-MM-DD
    section التجهيز
    تجهيز فيديو الشرح وسياسة الخصوصية    :active, 2026-06-24, 2d
    section مراجعة الـ OAuth
    تقديم طلب مراجعة OAuth App           : 2026-06-26, 7d
    section ترقية الـ Token
    تقديم طلب ترقية Developer Token      : 2026-06-26, 10d
```

---

> [!TIP]
> **نصيحة هامة:** يمكنك بدء عملية التقديم على **Basic Access** لـ Developer Token وتقديم طلب الـ **OAuth Verification** من الآن بالتوازي مع إكمال اللمسات النهائية للبرمجة، حيث يستغرق رد جوجل حوالي 7 إلى 14 يوم عمل.
