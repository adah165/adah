import type { Metadata } from "next"
import Link from "next/link"
import { Logo } from "@/components/ui/Logo"
import { 
  Shield, 
  Lock, 
  Share2, 
  Trash2, 
  Eye, 
  CheckCircle, 
  Mail, 
  FileText, 
  ArrowLeft, 
  ExternalLink,
  Info,
  Calendar,
  Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "سياسة الخصوصية | أداة (ADAH)",
  description: "سياسة الخصوصية لمنصة أداة لإدارة حملات إعلانات جوجل ومكافحة النقرات الاحتيالية وحماية البيانات.",
  alternates: {
    canonical: "https://adah.sa/privacy",
  },
}

export default function PrivacyPage() {
  const lastUpdated = "24 يونيو 2026"

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-primary selection:text-white" dir="rtl">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="hover:opacity-90 transition">
            <Logo variant="horizontal" lang="ar" size={32} textClassName="text-xl font-bold font-cairo text-white" />
          </Link>
          
          <Link href="/login">
            <Button variant="ghost" className="text-slate-300 hover:text-white gap-2 font-tajawal hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
              الرجوع للرئيسية
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="py-16 md:py-24 border-b border-slate-900 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold font-tajawal mb-4">
            <Shield className="w-3.5 h-3.5" />
            منطقة خصوصية آمنة وموثوقة
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold font-cairo leading-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            سياسة الخصوصية وشروط حماية البيانات
          </h1>
          <p className="text-slate-400 font-tajawal text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            في منصة <span className="text-slate-200 font-semibold">أداة (ADAH)</span>، نضع خصوصية بياناتك وأمن حساباتك الإعلانية على رأس أولوياتنا. نوضح هنا كيفية استخدام وحماية البيانات المرتبطة بـ Google Ads.
          </p>
          
          {/* Metadata Badges */}
          <div className="flex flex-wrap gap-4 justify-center items-center mt-8 text-xs font-tajawal text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-secondary" />
              <span>آخر تحديث: {lastUpdated}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <Globe className="w-3.5 h-3.5 text-secondary" />
              <span className="font-mono">https://adah.sa</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-12 max-w-4xl mx-auto px-4 w-full">
        {/* Important notice for Google OAuth review */}
        <div className="mb-10 p-5 rounded-2xl bg-primary/5 border border-primary/20 backdrop-blur-sm flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold font-cairo text-sm text-white mb-1">بيان إخلاء المسؤولية لـ Google OAuth Verification</h3>
            <p className="text-xs font-tajawal text-slate-400 leading-relaxed">
              هذه السياسة معدة خصيصاً لتوضيح نطاق عمل التطبيق مع واجهة برمجة تطبيقات Google Ads (Google Ads API) وصلاحية الوصول المحدودة <code className="text-primary font-mono text-xs font-semibold">https://www.googleapis.com/auth/adwords</code>. المنصة تلتزم التزاماً كاملاً بجميع سياسات بيانات مستخدم Google API (Google API User Data Policy) بما في ذلك متطلبات الاستخدام المحدود (Limited Use).
            </p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-8">
          
          {/* 1. Introduction */}
          <div className="p-6 md:p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm hover:border-slate-800 transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-cairo text-white">1. مقدمة تمهيدية</h2>
            </div>
            <p className="font-tajawal text-slate-300 text-sm md:text-base leading-relaxed">
              تصف سياسة الخصوصية هذه كيفية قيام منصة "أداة" (المشار إليها بـ "المنصة" أو "نحن") بجمع واستخدام وحماية البيانات والمعلومات الخاصة بالمستخدمين (المسوقين وأصحاب الحسابات الإعلانية) عند تفويض واستخدام خدمات إدارة الحملات واكتشاف النقرات الاحتيالية للموقع <Link href="https://adah.sa" className="text-primary hover:underline font-mono">https://adah.sa</Link>.
            </p>
          </div>

          {/* 2. Collected Data */}
          <div className="p-6 md:p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm hover:border-slate-800 transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-cairo text-white">2. البيانات التي نجمعها وكيفية الوصول إليها</h2>
            </div>
            <p className="font-tajawal text-slate-300 text-sm md:text-base leading-relaxed mb-4">
              لكي تعمل منصتنا بكفاءة وتقدم خدمات حماية الحملات الإعلانية من الاحتيال، نحتاج للوصول إلى معلومات محددة ومصرحة من قبلكم عبر Google OAuth:
            </p>
            <ul className="space-y-3 font-tajawal text-slate-300 text-sm">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 font-semibold">بيانات الهوية والتحقق:</strong>
                  <span className="block text-xs text-slate-400 mt-0.5">البريد الإلكتروني والاسم وصورة الحساب للتحقق من هوية المستخدم وتأمين الدخول.</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 font-semibold">معرفات حسابات إعلانات جوجل (Google Ads Account IDs):</strong>
                  <span className="block text-xs text-slate-400 mt-0.5">نجمع الرقم المعرف للعميل (Customer ID) لعرض قائمة الحسابات الإعلانية التي تمتلكها وتفويض إدارتها.</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 font-semibold">بيانات إعدادات وتكوين الحملات (Campaign Configurations):</strong>
                  <span className="block text-xs text-slate-400 mt-0.5">نقوم بقراءة تفاصيل حملاتك الإعلانية، والمجموعات الإعلانية، والميزانية لتسهيل تحريرها وضبطها من داخل لوحة التحكم.</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 font-semibold">بيانات النقرات وعناوين الـ IP الخاصة بالزوار:</strong>
                  <span className="block text-xs text-slate-400 mt-0.5">نقوم بجمع وتحليل عناوين بروتوكول الإنترنت (IP addresses) للمستخدمين الذين ينقرون على إعلاناتك، بالإضافة إلى بيانات الطوابع الزمنية ومؤشرات الاحتيال الأخرى لرصد الهجمات الوهمية.</span>
                </div>
              </li>
            </ul>
          </div>

          {/* 3. Purpose of Data Use */}
          <div className="p-6 md:p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm hover:border-slate-800 transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-cairo text-white">3. الغرض من استخدام البيانات والـ Google Ads API</h2>
            </div>
            <p className="font-tajawal text-slate-300 text-sm md:text-base leading-relaxed mb-4">
              إن الغرض الحصري والوحيد من طلب تفويض الوصول إلى حساب إعلانات جوجل الخاص بك عبر الصلاحية المعتمدة هو تمكينك من تشغيل الميزات التالية:
            </p>
            <ul className="space-y-3 font-tajawal text-slate-300 text-sm">
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 font-semibold">إدارة الحملات الإعلانية ومراقبتها:</strong>
                  <span className="block text-xs text-slate-400 mt-0.5">عرض أداء الحملات وتحرير الميزانيات وتحديث إعدادات الاستهداف مباشرة لتسهيل إدارة الحملات دون تعقيد.</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 font-semibold">حظر النقرات الاحتيالية ومكافحة النقرات الوهمية:</strong>
                  <span className="block text-xs text-slate-400 mt-0.5">عند رصد نشاط نقر مشبوه أو متكرر من عنوان IP معين، يقوم التطبيق تلقائياً وعبر واجهة البرمجة (API) بإضافة عنوان الـ IP هذا إلى قائمة استبعاد عناوين IP التابعة للحملة في Google Ads لحماية ميزانيتك الإعلانية من الاستنزاف.</span>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 font-semibold">تقديم تقارير وحلول الحماية:</strong>
                  <span className="block text-xs text-slate-400 mt-0.5">إعداد لوحة إحصاءات توضح عدد محاولات الاحتيال التي تم كشفها، وعناوين الـ IP المحظورة وتكلفة الإعلانات التي تم توفيرها.</span>
                </div>
              </li>
            </ul>
          </div>

          {/* 4. Strict No-Sharing Policy */}
          <div className="p-6 md:p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm hover:border-slate-800 transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                <Share2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-cairo text-white">4. عدم مشاركة البيانات مع أي أطراف ثالثة</h2>
            </div>
            <div className="space-y-3 font-tajawal text-slate-300 text-sm md:text-base leading-relaxed">
              <p>
                نحن في منصة "أداة" نلتزم التزاماً صارماً بسياسات جوجل لحماية خصوصية بيانات المستخدمين.
              </p>
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-red-200 text-xs md:text-sm font-semibold">
                ⚠️ تعهد صريح: لا نقوم ببيع، أو تأجير، أو مشاركة، أو مقايضة، أو تحويل أي من بيانات إعلانات جوجل أو معرفات العملاء أو الرموز الأمنية (OAuth tokens) الخاصة بك إلى أي طرف ثالث أو شبكات تسويقية أو شركات إعلانية أو أي جهات خارجية مهما كانت الأسباب.
              </div>
              <p className="text-xs text-slate-400 mt-2">
                الوصول إلى هذه البيانات يقتصر فقط على الكود البرمجي البرمجي التابع للمنصة لتنفيذ طلبات إدارة حسابك ومكافحة الاحتيال، ولا يتم تمكين أي طرف آخر من الإطلاع عليها.
              </p>
            </div>
          </div>

          {/* 5. Data Security */}
          <div className="p-6 md:p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm hover:border-slate-800 transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-cairo text-white">5. أمن وحماية البيانات</h2>
            </div>
            <p className="font-tajawal text-slate-300 text-sm md:text-base leading-relaxed mb-3">
              لحماية بياناتك المخزنة لدينا والمعلومات الواردة من Google APIs، نطبق البروتوكولات الأمنية التالية:
            </p>
            <ul className="space-y-2 font-tajawal text-slate-300 text-xs md:text-sm list-disc list-inside">
              <li>تشفير جميع قنوات الاتصال والبيانات أثناء نقلها باستخدام بروتوكول <strong className="text-white">TLS/HTTPS</strong> معتمد.</li>
              <li>تخزين الرموز الأمنية ورموز التحديث (Access & Refresh Tokens) الخاصة بحساب Google Ads بشكل مشفر ومحمي داخل قواعد بياناتنا الإنتاجية.</li>
              <li>تقييد وصول الموظفين والمطورين إلى البنية التحتية للمنصة، وتخصيص صلاحيات الوصول بدقة لمنع أي محاولة وصول غير مصرح بها.</li>
            </ul>
          </div>

          {/* 6. User Control & Data Deletion */}
          <div className="p-6 md:p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm hover:border-slate-800 transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-cairo text-white">6. تحكم المستخدم وسحب صلاحيات الوصول وحذف البيانات</h2>
            </div>
            <div className="font-tajawal text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
              <p>
                تمتلك السيطرة الكاملة على حسابك الإعلاني وبياناتك ويمكنك التحكم بها عن طريق:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm font-semibold">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-white mb-1">🛡️ إلغاء الربط وسحب الصلاحيات</div>
                  <div className="text-slate-400 text-xs font-normal">
                    يمكنك سحب صلاحيات الوصول الممنوحة لمنصة أداة في أي وقت من خلال صفحة إعدادات الأمان في حساب جوجل الخاص بك عبر <Link href="https://myaccount.google.com/permissions" target="_blank" className="text-primary hover:underline inline-flex items-center gap-1">جوجل للحسابات الأمنية <ExternalLink className="w-3 h-3" /></Link>.
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-white mb-1">🗑️ طلب الحذف الكامل للبيانات</div>
                  <div className="text-slate-400 text-xs font-normal">
                    يمكنك طلب حذف حسابك بالكامل من منصة أداة وحذف جميع السجلات التاريخية وإحصائيات الحملات ورموز الوصول المخزنة لدينا بشكل نهائي عبر إرسال رسالة إلى البريد الإلكتروني <span className="text-primary font-mono font-semibold">support@adah.sa</span>. وسيقوم فريقنا بمعالجة الطلب في غضون 48 ساعة عمل.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Contact Us */}
          <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-900/60 to-primary/10 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-cairo text-white">7. الاستفسارات والتواصل المباشر</h2>
            </div>
            <p className="font-tajawal text-slate-300 text-sm md:text-base leading-relaxed mb-4">
              إذا كان لديك أي سؤال، استفسار أو قلق حيال كيفية إدارة خصوصية بيانات حساب Google Ads الخاص بك داخل منصة أداة، يرجى عدم التردد في التواصل مع مسؤول الحماية والامتثال لدينا مباشرة:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2 p-3 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs md:text-sm font-semibold">
                <span className="text-slate-400">البريد الإلكتروني للدعم والامتثال:</span>
                <Link href="mailto:support@adah.sa" className="text-primary font-mono hover:underline">support@adah.sa</Link>
              </div>
              <div className="flex items-center gap-2 p-3 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs md:text-sm font-semibold">
                <span className="text-slate-400">الموقع الإلكتروني الرسمي:</span>
                <Link href="https://adah.sa" target="_blank" className="text-primary font-mono hover:underline inline-flex items-center gap-1">https://adah.sa <ExternalLink className="w-3 h-3" /></Link>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs font-tajawal text-slate-500">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <div>جميع الحقوق محفوظة © {new Date().getFullYear()} لمنصة أداة (ADAH)</div>
          <div>تم صياغة هذه السياسة بما يتماشى مع لوائح حماية البيانات العامة والسياسات الخاصة ببرنامج شركاء Google Ads.</div>
        </div>
      </footer>
    </div>
  )
}
