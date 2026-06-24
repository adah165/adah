"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Logo } from "@/components/ui/Logo"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة")
    } else {
      window.location.href = "/"
    }
  }

  const handleDemo = async () => {
    setLoading(true)
    await signIn("credentials", {
      email: "demo@adah.sa",
      password: "password123",
      callbackUrl: "/",
    })
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-primary/20 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(27,79,219,0.3),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(14,165,233,0.2),transparent_70%)]" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-10">
            <Logo variant="horizontal" lang="ar" size={32} className="mb-8" textClassName="text-xl font-bold font-cairo text-white" />
            <h2 className="text-3xl font-bold font-cairo leading-tight mb-4">
              إدارة إعلانات Google<br />
              <span className="text-primary">بقوة الذكاء الاصطناعي</span>
            </h2>
            <p className="text-slate-400 font-tajawal text-base leading-relaxed">
              منصة عربية متكاملة لإطلاق وإدارة حملاتك الإعلانية، واكتشاف النقرات الوهمية تلقائياً.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: "🛡️", title: "حماية تلقائية من الاحتيال", desc: "كشف النقرات الوهمية وحظرها فوراً" },
              { icon: "📊", title: "تقارير ذكية وتحليلات دقيقة", desc: "تحليل أداء حملاتك بالوقت الفعلي" },
              { icon: "🚀", title: "معالج إطلاق الحملات بالذكاء الاصطناعي", desc: "أنشئ حملتك في دقائق باقتراحات مدعومة بـ AI" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 backdrop-blur border border-white/10">
                <span className="text-2xl">{icon}</span>
                <div>
                  <div className="font-semibold font-tajawal text-white text-sm">{title}</div>
                  <div className="text-xs font-tajawal text-slate-400 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex flex-1 items-center justify-center p-6 max-w-lg mx-auto lg:mx-0 lg:max-w-[480px]">
        <div className="w-full space-y-6">
          {/* Mobile/Form Logo */}
          <div className="flex flex-col items-center justify-center mb-8 text-center">
            <Logo variant="full" lang="en" size={80} textClassName="text-2xl font-bold font-sans text-slate-800 dark:text-slate-200 mt-2" />
          </div>

          <div>
            <h1 className="text-2xl font-bold font-cairo text-foreground">مرحباً بعودتك 👋</h1>
            <p className="text-sm font-tajawal text-muted-foreground mt-1">قم بتسجيل الدخول للوصول إلى لوحة التحكم</p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-tajawal">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold font-tajawal text-foreground mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.sa"
                className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm font-tajawal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold font-tajawal text-foreground mb-1.5">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pl-12 rounded-xl bg-card border border-border text-sm font-tajawal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-bold font-cairo text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowLeft className="w-5 h-5" />}
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-tajawal text-muted-foreground">أو</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Demo login button */}
          <button
            onClick={handleDemo}
            disabled={loading}
            className="w-full py-3.5 rounded-xl border border-border bg-card text-sm font-bold font-tajawal text-foreground hover:bg-muted hover:border-primary/40 transition-all disabled:opacity-70"
          >
            🎯 تجربة الحساب التجريبي
          </button>

          <p className="text-center text-xs font-tajawal text-muted-foreground">
            بيانات التجربة: <span className="font-mono text-foreground">demo@adah.sa</span> — <span className="font-mono text-foreground">password123</span>
          </p>

          <div className="text-center font-tajawal text-sm text-muted-foreground border-t border-border/50 pt-4">
            ليس لديك حساب؟{" "}
            <Link href="/signup" className="text-primary font-bold hover:underline">
              إنشاء حساب جديد
            </Link>
          </div>

          <div className="text-center font-tajawal text-xs text-muted-foreground/75 mt-2">
            <Link href="/privacy" className="hover:text-primary underline transition-colors">
              سياسة الخصوصية وشروط الاستخدام
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
