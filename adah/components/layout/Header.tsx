"use client"

import { useTheme } from "next-themes"
import { Bell, Sun, Moon, Sparkles, AlertCircle, RefreshCw, User, Settings, LogOut, Camera, Loader2, Check } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function Header() {
  const { data: session, update } = useSession()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [customerId, setCustomerId] = useState("١٢٣-٤٥٦-٧٨٩٠")
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      title: "تم اكتشاف نقرات مشبوهة",
      desc: "نظام الحماية رصد ١٢ نقرة مكررة من IP: 192.168.1.145",
      time: "قبل ٥ دقائق",
      type: "error",
      actionType: "block_ip",
      ipAddress: "192.168.1.145",
      actionText: "حظر الـ IP",
      status: "idle",
      link: "/analytics"
    },
    {
      id: 2,
      title: "تحسين ميزانية الحملة",
      desc: "AI يقترح زيادة ميزانية حملة رمضان بنسبة ١٥٪ لتحسين العائد",
      time: "قبل ساعة",
      type: "success",
      actionType: "approve_budget",
      actionText: "موافقة وتطبيق",
      status: "idle",
      link: "/campaigns"
    },
    {
      id: 3,
      title: "تنبيه إيقاف الكلمات المفتاحية",
      desc: "كلمة 'شراء منتجات' لها تكلفة عالية ونسبة تحويل منخفضة",
      time: "قبل ٣ ساعات",
      type: "warning",
      actionType: "disable_keyword",
      keyword: "شراء منتجات",
      actionText: "إيقاف الكلمة",
      status: "idle",
      link: "/campaigns"
    },
  ])

  // Handles quick action buttons
  const handleAlertAction = async (e: React.MouseEvent, alertId: number) => {
    e.stopPropagation()
    const alert = alerts.find(a => a.id === alertId)
    if (!alert || alert.status === "loading" || alert.status === "success") return

    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: "loading" } : a))

    try {
      let res;
      if (alert.actionType === "block_ip") {
        res = await fetch("/api/fraud/block-ip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ipAddress: alert.ipAddress || "192.168.1.145" })
        })
      } else if (alert.actionType === "approve_budget") {
        res = await fetch("/api/campaigns/apply-budget-recommendation", {
          method: "POST"
        })
      } else if (alert.actionType === "disable_keyword") {
        res = await fetch("/api/keywords/disable", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword: alert.keyword || "شراء منتجات" })
        })
      }

      if (res && res.ok) {
        setAlerts(prev => prev.map(a => a.id === alertId ? {
          ...a,
          status: "success",
          desc: alert.actionType === "block_ip"
            ? `تم حظر الـ IP ${alert.ipAddress} بنجاح.`
            : alert.actionType === "approve_budget"
              ? `تمت زيادة الميزانية بنسبة ١٥٪ وتطبيقها.`
              : `تم إيقاف الكلمة المفتاحية '${alert.keyword}' بنجاح.`
        } : a))
        router.refresh()
      } else {
        throw new Error()
      }
    } catch (err) {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: "error" } : a))
      setTimeout(() => {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: "idle" } : a))
      }, 3000)
    }
  }

  const handleAlertClick = (link?: string) => {
    if (link) {
      router.push(link)
      setNotificationsOpen(false)
    }
  }

  // Dropdown & Modal State
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  // Edit Profile Form State
  const [editName, setEditName] = useState("")
  const [editJobTitle, setEditJobTitle] = useState("")
  const [editImage, setEditImage] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Dynamic User Display State (to support immediate frontend reflection)
  const [userName, setUserName] = useState("")
  const [userJobTitle, setUserJobTitle] = useState("")
  const [userImage, setUserImage] = useState("")

  // Initialize edit form when modal opens
  useEffect(() => {
    if (modalOpen && session?.user) {
      setEditName(session.user.name || "")
      setEditJobTitle((session.user as any).jobTitle || "")
      setEditImage(session.user.image || "")
      setEditPassword("")
      setErrorMsg("")
      setSuccessMsg("")
    }
  }, [modalOpen, session])

  // Sync display states when session changes/loads
  useEffect(() => {
    if (session?.user) {
      setUserName(session.user.name || "")
      setUserJobTitle((session.user as any).jobTitle || "")
      setUserImage(session.user.image || "")
    }
  }, [session])

  // Handle local file read to Base64
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("حجم الصورة يجب أن يكون أقل من ٢ ميجابايت")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setEditImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Handle Form Submission
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg("")
    setSuccessMsg("")

    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          jobTitle: editJobTitle,
          image: editImage,
          password: editPassword || undefined
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "حدث خطأ أثناء حفظ التعديلات")
      }

      // Update local display state immediately for seamless frontend responsiveness
      setUserName(editName)
      setUserJobTitle(editJobTitle)
      setUserImage(editImage)

      // Dynamically update user session in Next-Auth
      await update({
        name: editName,
        image: editImage,
        jobTitle: editJobTitle
      })

      setSuccessMsg("تم تحديث الملف الشخصي بنجاح! 🎉")

      // Trigger Next.js router refresh to reload Server Components / page states
      router.refresh()

      setTimeout(() => {
        setModalOpen(false)
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ غير متوقع")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    fetch("/api/settings/google-ads")
      .then(res => res.json())
      .then(data => {
        if (data.connected && data.customerId) {
          setCustomerId(data.customerId)
        }
      })
      .catch(() => { })
  }, [])

  const handleToggleTheme = () => {
    if (!mounted) return
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between w-full h-16 px-6 border-b border-border bg-card/85 backdrop-blur-md print:hidden">
        {/* Search / Workspace selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-500 font-tajawal bg-emerald-500/10 px-2 py-0.5 rounded-full">
              متصل بالحملة النشطة
            </span>
          </div>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div className="text-sm font-medium font-tajawal text-muted-foreground hidden sm:block">
            معرّف الحساب: <span className="font-inter font-bold text-foreground">{customerId}</span>
          </div>
        </div>

        {/* User profile, notifications, settings, themes */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={handleToggleTheme}
            className="p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            aria-label="تبديل المظهر"
          >
            {mounted && theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 relative"
            >
              <Bell className="w-5 h-5" />
              {alerts.length > 0 && (
                <span className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-red-500" />
              )}
            </button>

            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
                <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-xl z-20 overflow-hidden font-tajawal animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-border flex justify-between items-center">
                    <h3 className="font-bold text-foreground font-cairo">الإشعارات الحالية</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold">
                      {alerts.length} تنبيهات
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        لا توجد إشعارات جديدة حالياً.
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <div
                          key={alert.id}
                          onClick={() => handleAlertClick(alert.link)}
                          className="p-4 border-b border-border hover:bg-muted/40 transition-colors flex gap-3 cursor-pointer text-right"
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5",
                            alert.type === "error" ? "bg-red-500/10 text-red-500" :
                              alert.type === "warning" ? "bg-amber-500/10 text-amber-500" :
                                "bg-emerald-500/10 text-emerald-500"
                          )}>
                            {alert.type === "error" ? <AlertCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                          </div>
                          <div className="space-y-1 flex-1">
                            <h4 className="font-semibold text-sm text-foreground">{alert.title}</h4>
                            <p className="text-xs text-muted-foreground leading-normal">{alert.desc}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                            </div>

                            {alert.status !== "success" ? (
                              <button
                                onClick={(e) => handleAlertAction(e, alert.id)}
                                className={cn(
                                  "mt-2 px-3 py-1.5 rounded-lg text-xs font-bold font-tajawal transition-all duration-200 flex items-center gap-1.5 border shadow-sm",
                                  alert.status === "loading"
                                    ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                                    : alert.status === "error"
                                      ? "bg-red-500/10 text-red-500 border-red-500/30"
                                      : alert.type === "error"
                                        ? "bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border-red-500/20 active:scale-95"
                                        : alert.type === "warning"
                                          ? "bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500 border-amber-500/20 active:scale-95"
                                          : "bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-500 border-emerald-500/20 active:scale-95"
                                )}
                                disabled={alert.status === "loading"}
                              >
                                {alert.status === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                <span>
                                  {alert.status === "loading"
                                    ? "جاري المعالجة..."
                                    : alert.status === "error"
                                      ? "فشلت المحاولة"
                                      : alert.actionText}
                                </span>
                              </button>
                            ) : (
                              <span className="mt-2 text-xs font-semibold text-emerald-500 flex items-center gap-1 justify-start">
                                <Check className="w-3.5 h-3.5" />
                                <span>تم تطبيق الإجراء بنجاح</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 bg-muted/40 text-center border-t border-border">
                    <button
                      onClick={() => setAlerts([])}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      تحديد الكل كمقروء
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Card & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 border border-border bg-muted/30 px-3 py-1.5 rounded-xl hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 cursor-pointer text-right"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0 overflow-hidden border border-border">
                {userImage || session?.user?.image ? (
                  <img src={userImage || session?.user?.image || undefined} alt={userName || session?.user?.name || "User"} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div className="text-right hidden md:block">
                <span className="text-xs font-bold font-tajawal text-foreground block leading-tight">
                  {userName || session?.user?.name || "سارة الأحمد"}
                </span>
                <span className="text-[10px] font-tajawal text-muted-foreground block leading-none mt-0.5">
                  {userJobTitle || (session?.user as any)?.jobTitle || "مدير التسويق"}
                </span>
              </div>
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute left-0 mt-2 w-72 bg-card border border-border rounded-2xl shadow-xl z-20 overflow-hidden font-tajawal animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Header User details */}
                  <div className="p-4 border-b border-border bg-muted/20 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden border-2 border-primary/20 mb-3 shadow-inner">
                      {userImage || session?.user?.image ? (
                        <img src={userImage || session.user.image} alt={userName || session.user.name || "User"} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8" />
                      )}
                    </div>
                    <h4 className="font-bold text-foreground text-sm font-cairo">
                      {userName || session?.user?.name || "سارة الأحمد"}
                    </h4>
                    <p className="text-xs text-primary font-semibold mt-0.5">
                      {userJobTitle || (session?.user as any)?.jobTitle || "مدير التسويق"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-1 break-all">
                      {session?.user?.email || "demo@adah.sa"}
                    </p>
                  </div>

                  {/* Dropdown Items */}
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false)
                        setModalOpen(true)
                      }}
                      className="flex items-center justify-start gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted text-foreground transition-all duration-200 text-right"
                    >
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>تعديل الملف الشخصي</span>
                    </button>

                    <a
                      href="/settings"
                      className="flex items-center justify-start gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted text-foreground transition-all duration-200 text-right"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span>إعدادات مساحة العمل</span>
                    </a>

                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex items-center justify-start gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-200 text-right"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Edit Profile Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-y-auto font-tajawal animate-in zoom-in-95 duration-200 max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/10">
              <h3 className="text-lg font-bold font-cairo text-foreground">تعديل الملف الشخصي</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors"
              >
                إغلاق
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-2 pb-2">
                <div className="relative group w-20 h-20 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 shadow-inner flex items-center justify-center">
                  {editImage ? (
                    <img src={editImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-primary" />
                  )}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center cursor-pointer text-white text-[10px]">
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span>تغيير</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <span className="text-[10px] text-muted-foreground">صيغ الصور المدعومة (JPEG, PNG). الحد الأقصى ٢ ميجابايت</span>
              </div>

              {/* Name */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-semibold text-foreground">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-right"
                  placeholder="مثال: سارة الأحمد"
                />
              </div>

              {/* Job Title */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-semibold text-foreground">الوظيفة / المسمى الوظيفي</label>
                <input
                  type="text"
                  required
                  value={editJobTitle}
                  onChange={(e) => setEditJobTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-right"
                  placeholder="مثال: مدير التسويق الرقمي"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-semibold text-foreground">تغيير كلمة المرور</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-right"
                  placeholder="اتركها فارغة إذا لم ترغب في التغيير"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted text-sm font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10 disabled:opacity-75 animate-duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>حفظ التعديلات</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
