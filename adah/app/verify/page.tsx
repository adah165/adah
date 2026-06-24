"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ShieldCheck, Loader2, RefreshCw, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

export default function VerifyPage() {
  const { data: session, status } = useSession()
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [cooldown, setCooldown] = useState(0)

  const email = session?.user?.email

  useEffect(() => {
    // If user is already verified, redirect to dashboard home
    if (session?.user && (session.user as any).emailVerified) {
      window.location.href = "/"
    }
  }, [session])

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setError("رمز التحقق يجب أن يتكون من 6 أرقام")
      return
    }

    setLoading(true)
    setError("")
    setMessage("")

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "رمز التحقق غير صحيح")
      }

      setMessage("تم تفعيل بريدك الإلكتروني بنجاح! جاري توجيهك...")
      
      // Reload page to refresh layouts/session and unlock dashboard
      setTimeout(() => {
        window.location.href = "/"
      }, 1500)
    } catch (err: any) {
      setError(err.message || "حدث خطأ ما")
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setResending(true)
    setError("")
    setMessage("")

    try {
      const res = await fetch("/api/auth/verify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "فشل إعادة إرسال الرمز")
      }

      setMessage("تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني")
      setCooldown(60) // 60 seconds cooldown
    } catch (err: any) {
      setError(err.message || "حدث خطأ ما")
    } finally {
      setResending(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center" dir="rtl font-tajawal">
        <p className="text-muted-foreground mb-4">يرجى تسجيل الدخول أولاً للوصول لهذه الصفحة</p>
        <button
          onClick={() => window.location.href = "/login"}
          className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold"
        >
          ذهاب لصفحة الدخول
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden" dir="rtl">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(27,79,219,0.15),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.1),transparent_50%)]" />

      {/* Main card */}
      <div className="w-full max-w-md bg-card/40 backdrop-blur-xl border border-border/80 rounded-3xl p-8 relative z-10 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-cairo text-foreground mt-2">تفعيل البريد الإلكتروني ✉️</h1>
          <p className="text-sm font-tajawal text-muted-foreground max-w-xs leading-relaxed">
            تم إرسال رمز تفعيل مكون من 6 أرقام إلى بريدك الإلكتروني:<br />
            <span className="font-semibold text-foreground font-mono text-xs">{email}</span>
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-tajawal text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-tajawal text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-center text-sm font-semibold font-tajawal text-foreground mb-3">أدخل رمز التحقق</label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full text-center px-4 py-3.5 rounded-2xl bg-background border border-border text-2xl font-bold font-inter tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/40 transition placeholder:text-muted-foreground/30 placeholder:tracking-normal"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white font-bold font-cairo text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? "جاري التحقق والتفعيل..." : "تفعيل الحساب الآن"}
          </button>
        </form>

        <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs font-tajawal">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
            {cooldown > 0 ? `إعادة الإرسال خلال (${cooldown}ث)` : "إعادة إرسال الرمز"}
          </button>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  )
}
