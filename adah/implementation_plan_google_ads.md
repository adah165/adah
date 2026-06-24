# ربط إطلاق الحملات مع Google Ads API

يهدف هذا المقترح لتحديد تصميم وبنية عملية ربط زر إطلاق الحملات النهائي في ساحر الإنشاء (Campaign Wizard) مع **Google Ads API** ليتم إنشاء الحملة فعلياً على حساب المستخدم فور الإطلاق.

---

## User Review Required

> [!IMPORTANT]
> **اختيار نمط الاتصال (Synchronous Mutate vs Queue):**
> ننصح باعتماد **الربط المتزامن (Synchronous Mutate)** مباشرة داخل معالج طلب الـ `POST` للتحكم بالحملات للأسباب التالية:
> 1. عملية إنشاء الحملة والـ Budget في Google Ads هي عملية سريعة جداً وتستغرق عادةً أقل من ثانية ونصف.
> 2. توفير تغذية راجعة فورية (Immediate Feedback) للمستخدم في حال وجود أي خطأ من الـ API (مثل تكرار الاسم أو خطأ في الميزانية) لعرضه في معالج الإنشاء مباشرة.
> 3. تجنب تعقيد البنية التحتية بإضافة مشغلات خلفية (Queue Workers / Redis listeners) وتوصيلات Webhooks غير ضرورية للمشروع في هذه المرحلة.

---

## Open Questions

> [!NOTE]
> هل تفضل بدء الحملة مباشرة كـ `ENABLED` (نشطة) بمجرد إنشائها في حساب جوجل، أم إطلاقها كـ `PAUSED` (موقوفة مؤقتاً) لإتاحة مراجعتها الأخيرة داخل لوحة Google Ads قبل تفعيلها؟ (ننصح بالبدء بـ `PAUSED` كأفضل ممارسة لحماية ميزانية العميل).

---

## Proposed Changes

### Google Ads API Helper Integration

---

#### [MODIFY] [google-ads.ts](file:///d:/ADS/adah/lib/google-ads.ts)
إضافة دالة `createLiveCampaign` لإنشاء ميزانية الحملة (Campaign Budget) ثم الحملة نفسها (Campaign) عبر مكتبة `google-ads-api` الرسمية، مع توفير وضع محاكاة (Fallback) في حال استخدام معرّف حساب تجريبي (Mock Account).

### Campaigns Controller Integration

---

#### [MODIFY] [route.ts](file:///d:/ADS/adah/app/api/campaigns/route.ts)
تعديل معالج الـ `POST` للحصول على رموز الوصول (OAuth Tokens) الخاصة بالعميل من قاعدة البيانات، واستدعاء دالة `createLiveCampaign` المتزامنة، ثم حفظ السجل النهائي بالـ `googleCampaignId` الحقيقي في قاعدة البيانات المحلية.

---

## Verification Plan

### Manual Verification
1. تسجيل الدخول والذهاب لمعالج إنشاء الحملات.
2. ملء خطوات الإنشاء المعتادة واختيار نوع الحملة (البحث أو الفيديو أو التسوق).
3. الضغط على "إطلاق الحملة".
4. التأكد من إنشاء الحملة وحفظها في قاعدة البيانات بالـ `googleCampaignId` الصحيح.
5. التحقق من سجلات الـ Terminal (Server Logs) لمراقبة استدعاءات Google Ads API والتأكد من عدم وجود أخطاء في الـ Mutate.
