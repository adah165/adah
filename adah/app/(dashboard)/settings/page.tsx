"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Link2, Users, CreditCard, Mail, Bell, Shield, ChevronLeft, Check, Loader2, Plus, Trash2 } from "lucide-react"
import { Toast } from "@/components/ui/toast"
import { signIn, useSession } from "next-auth/react"


const planBadge = {
  pro: { label: "Pro ⚡", color: "bg-primary/10 text-primary border border-primary/30" },
}

const teamMembers = [
  { id: "1", name: "سارة الأحمد", email: "sara@company.sa", role: "ADMIN", avatar: "س" },
  { id: "2", name: "محمد التركي", email: "mohammed@company.sa", role: "ANALYST", avatar: "م" },
  { id: "3", name: "نورا القحطاني", email: "noura@company.sa", role: "VIEWER", avatar: "ن" },
]

const roleLabels: Record<string, string> = {
  ADMIN: "مدير كامل الصلاحيات",
  ANALYST: "محلل — قراءة وتعديل",
  VIEWER: "مشاهد فقط",
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [accountName, setAccountName] = useState("حساب الشركة الرئيسي")
  const [customerId, setCustomerId] = useState("123-456-7890")
  const [loading, setLoading] = useState(true)

  const [inviteEmail, setInviteEmail] = useState("")
  const [reportEmail, setReportEmail] = useState("sara@company.sa")
  const [reportSchedule, setReportSchedule] = useState("weekly")
  const [defaultCurrency, setDefaultCurrency] = useState("SAR")
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [members, setMembers] = useState(teamMembers)
  const [saved, setSaved] = useState(false)

  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success")

  // Sync profile edits dynamically from Session
  useEffect(() => {
    if (session?.user) {
      setMembers(prev => prev.map(m => {
        if (m.role === "ADMIN" || m.id === "1") {
          return {
            ...m,
            name: session.user?.name || "سارة الأحمد",
            email: session.user?.email || "demo@adah.sa",
            avatar: (session.user?.name || "سارة الأحمد")[0]
          }
        }
        return m
      }))
      
      if (reportEmail === "sara@company.sa") {
        setReportEmail(session.user?.email || "demo@adah.sa")
      }
    }
  }, [session])

  useEffect(() => {
    fetch("/api/settings/google-ads")
      .then(res => res.json())
      .then(data => {
        if (data.connected) {
          setConnected(true)
          setAccountName(data.name || "حساب الشركة الرئيسي")
          setCustomerId(data.customerId || "123-456-7890")
        } else {
          setConnected(false)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleConnect = async () => {
    setConnecting(true)
    signIn("google", { callbackUrl: "/settings" })
  }

  const handleDisconnect = async () => {
    try {
      const res = await fetch("/api/settings/google-ads", { method: "DELETE" })
      if (res.ok) {
        setConnected(false)
        setToastType("success")
        setToastMessage("تم فصل حساب Google Ads بنجاح")
      } else {
        setToastType("error")
        setToastMessage("حدث خطأ أثناء فصل الحساب")
      }
    } catch {
      setToastType("error")
      setToastMessage("حدث خطأ أثناء فصل الحساب")
    }
  }

  const handleSave = async () => {
    setSaved(true)
    await new Promise(r => setTimeout(r, 800))
    setSaved(false)
    setToastType("success")
    setToastMessage("تم حفظ إعدادات الحساب بنجاح! 💾")
  }

  const handleInvite = () => {
    if (!inviteEmail) return
    setMembers(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: "VIEWER",
      avatar: inviteEmail[0].toUpperCase(),
    }])
    setToastType("success")
    setToastMessage(`تم إرسال دعوة بنجاح إلى: ${inviteEmail} ✉️`)
    setInviteEmail("")
  }


  const SectionCard = ({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h2 className="font-bold font-cairo text-foreground">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-cairo text-foreground">إعدادات الحساب</h1>
        <p className="text-sm font-tajawal text-muted-foreground mt-1">إدارة حسابك وتفضيلاتك وإعدادات الفريق</p>
      </div>

      {/* 1. Google Ads Connection */}
      <SectionCard icon={Link2} title="ربط حساب Google Ads">
        {loading ? (
          <div className="flex items-center gap-2 text-sm font-tajawal text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" /> جاري التحميل...
          </div>
        ) : connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <div className="font-semibold font-tajawal text-foreground text-sm">{accountName}</div>
                <div className="text-xs font-inter text-muted-foreground mt-0.5">معرّف الحساب: {customerId}</div>
              </div>
              <button 
                onClick={handleDisconnect}
                className="text-xs font-tajawal text-red-500 hover:text-red-400 font-semibold hover:underline"
              >
                فصل
              </button>
            </div>
            <button 
              onClick={handleConnect}
              className="flex items-center gap-2 text-sm font-tajawal text-primary hover:underline font-semibold"
            >
              <Plus className="w-4 h-4" />
              ربط حساب آخر
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-tajawal text-muted-foreground">
              قم بربط حساب Google Ads الخاص بك لاستيراد الحملات والبيانات تلقائياً.
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold font-tajawal hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-70"
            >
              {connecting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جاري الربط...</>
              ) : (
                <><Link2 className="w-4 h-4" /> ربط حساب Google Ads</>
              )}
            </button>
          </div>
        )}
      </SectionCard>

      {/* 2. Protection Settings */}
      <SectionCard icon={Shield} title="إعدادات الحماية من الاحتيال">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border">
            <div>
              <div className="text-sm font-semibold font-tajawal text-foreground">إشعارات البريد الإلكتروني عند اكتشاف احتيال</div>
              <div className="text-xs font-tajawal text-muted-foreground">إرسال تنبيه فوري عند اكتشاف نقرات مشبوهة</div>
            </div>
            <button
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={cn("relative w-11 h-6 rounded-full transition-colors", emailAlerts ? "bg-primary" : "bg-muted border border-border")}
            >
              <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all", emailAlerts ? "right-1" : "right-6")} />
            </button>
          </div>
          <div>
            <label className="block text-sm font-semibold font-tajawal text-foreground mb-1.5">البريد الإلكتروني للتنبيهات</label>
            <input
              value={reportEmail}
              onChange={e => setReportEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </SectionCard>

      {/* 3. Reports Settings */}
      <SectionCard icon={Bell} title="إعدادات التقارير">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold font-tajawal text-foreground mb-1.5">جدول إرسال التقارير</label>
              <select
                value={reportSchedule}
                onChange={e => setReportSchedule(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="daily">يومي</option>
                <option value="weekly">أسبوعي</option>
                <option value="monthly">شهري</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold font-tajawal text-foreground mb-1.5">عملة العرض الافتراضية</label>
              <select
                value={defaultCurrency}
                onChange={e => setDefaultCurrency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="SAR">ريال سعودي</option>
                <option value="AED">درهم إماراتي</option>
                <option value="EGP">جنيه مصري</option>
                <option value="USD">دولار أمريكي</option>
              </select>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 4. Team Members */}
      <SectionCard icon={Users} title="الفريق والمستخدمون">
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold font-cairo flex items-center justify-center shrink-0 text-sm">
                {member.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold font-tajawal text-foreground">{member.name}</div>
                <div className="text-xs font-tajawal text-muted-foreground">{member.email}</div>
              </div>
              <div className="text-xs font-tajawal text-muted-foreground hidden sm:block">{roleLabels[member.role]}</div>
              {member.role !== "ADMIN" && (
                <button
                  onClick={() => setMembers(prev => prev.filter(m => m.id !== member.id))}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="البريد الإلكتروني للعضو الجديد..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={handleInvite}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold font-tajawal hover:bg-primary/90 transition-colors"
            >
              دعوة
            </button>
          </div>
        </div>
      </SectionCard>

      {/* 5. Plan & Billing */}
      <SectionCard icon={CreditCard} title="الخطة والفوترة">
        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold font-cairo text-foreground">الخطة الاحترافية</span>
              <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full", planBadge.pro.color)}>
                {planBadge.pro.label}
              </span>
            </div>
            <div className="text-xs font-tajawal text-muted-foreground">تاريخ التجديد: ١ يوليو ٢٠٢٤ — ٤٩٩ ر.س/شهر</div>
          </div>
          <button className="px-4 py-2 rounded-xl border border-primary text-primary text-xs font-bold font-tajawal hover:bg-primary hover:text-white transition-all">
            ترقية الخطة
          </button>
        </div>
      </SectionCard>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saved}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold font-cairo text-sm transition-all shadow-md disabled:opacity-85",
          saved
            ? "bg-emerald-500 text-white shadow-emerald-500/20"
            : "bg-primary text-white hover:bg-primary/90 shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
        )}
      >
        {saved ? (
          <><Check className="w-5 h-5" /> تم الحفظ بنجاح!</>
        ) : (
          "حفظ الإعدادات"
        )}
      </button>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage("")}
        />
      )}
    </div>
  )
}
