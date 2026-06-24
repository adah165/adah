"use client"

import { useState, useEffect } from "react"
import { mockFraudData, mockFraudTimeline } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Shield, ShieldAlert, ShieldCheck, Ban, Eye, RefreshCw, Sparkles, AlertTriangle, Activity } from "lucide-react"
import { Toast } from "@/components/ui/toast"

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"

const actionConfig: Record<string, { label: string; color: string; bg: string }> = {
  blocked: { label: "محظور", color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
  review:  { label: "قيد المراجعة", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
  ignored: { label: "تجاهل", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" },
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-right font-tajawal">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: <span className="font-inter">{entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function FraudPage() {
  const [fraudData, setFraudData] = useState<any[]>(mockFraudData)
  const [autoBlock, setAutoBlock] = useState(true)
  const [threshold, setThreshold] = useState(10)
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(true)

  const [ruleBots, setRuleBots] = useState(true)
  const [ruleGeo, setRuleGeo] = useState(true)
  const [ruleProxy, setRuleProxy] = useState(true)
  const [ruleSpeed, setRuleSpeed] = useState(true)

  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success")

  const handleSaveSettings = () => {
    setToastType("success")
    setToastMessage("تم حفظ إعدادات الحماية وتنشيط القواعد بنجاح! 🛡️")
  }


  useEffect(() => {
    async function loadFraudLogs() {
      try {
        const res = await fetch("/api/fraud")
        if (res.ok) {
          const data = await res.json()
          setFraudData(data)
        }
      } catch (err) {
        console.error("Failed to load fraud logs", err)
      } finally {
        setLoading(false)
      }
    }
    loadFraudLogs()
  }, [])

  const blockedCount = fraudData.filter(f => f.action === "blocked").length
  const reviewCount = fraudData.filter(f => f.action === "review").length
  const totalSaved = fraudData.filter(f => f.action !== "ignored").reduce((a, f) => a + f.estimatedLoss, 0)
  const totalMonthSaved = totalSaved > 0 ? totalSaved : mockFraudTimeline.reduce((a, d) => a + d.moneySaved, 0)

  const handleBlock = async (id: string) => {
    try {
      const res = await fetch("/api/fraud", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "blocked" })
      })
      if (res.ok) {
        setFraudData(prev => prev.map(f => f.id === id ? { ...f, action: "blocked" } : f))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleIgnore = async (id: string) => {
    try {
      const res = await fetch("/api/fraud", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "ignored" })
      })
      if (res.ok) {
        setFraudData(prev => prev.map(f => f.id === id ? { ...f, action: "ignored" } : f))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleRescan = async () => {
    setScanning(true)
    try {
      const res = await fetch("/api/fraud", {
        method: "POST"
      })
      if (res.ok) {
        const logRes = await fetch("/api/fraud")
        if (logRes.ok) {
          const data = await logRes.json()
          setFraudData(data)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-cairo text-foreground flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-red-500" />
            حماية النقرات الوهمية (AI)
          </h1>
          <p className="text-sm font-tajawal text-muted-foreground mt-1">
            رصد تلقائي للنقرات الاحتيالية وحماية ميزانيتك الإعلانية بالذكاء الاصطناعي
          </p>
        </div>
        <button
          onClick={handleRescan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold font-tajawal hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-70"
        >
          <RefreshCw className={cn("w-4 h-4", scanning && "animate-spin")} />
          {scanning ? "جاري الفحص..." : "فحص الآن"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-red-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-rose-400" />
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-xs font-tajawal text-red-500 font-semibold">نشط</span>
          </div>
          <div className="text-3xl font-bold font-inter text-red-500">{fraudData.length}</div>
          <div className="text-xs font-tajawal text-muted-foreground mt-1">نقرة مشبوهة مكتشفة</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-500 to-slate-400" />
          <div className="text-3xl font-bold font-inter text-foreground">{blockedCount}</div>
          <div className="text-xs font-tajawal text-muted-foreground mt-1">IP محظور تلقائياً</div>
        </div>
        <div className="bg-card border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-yellow-400" />
          <div className="text-3xl font-bold font-inter text-amber-500">{reviewCount}</div>
          <div className="text-xs font-tajawal text-muted-foreground mt-1">بانتظار المراجعة</div>
        </div>
        <div className="bg-card border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-green-400" />
          <div className="text-3xl font-bold font-inter text-emerald-500">{totalMonthSaved.toLocaleString()}</div>
          <div className="text-xs font-tajawal text-muted-foreground mt-1">ريال وُفِّر هذا الشهر</div>
        </div>
      </div>

      {/* Fraud Timeline Chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold font-cairo text-foreground">النقرات الوهمية عبر الزمن — آخر ٧ أيام</h2>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={mockFraudTimeline} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="fraudGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="savedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "Tajawal" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "Inter" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontFamily: "Tajawal", fontSize: "12px", paddingTop: "12px" }}
              formatter={v => v === "fraudClicks" ? "نقرات وهمية" : "ريال تم توفيرها"} />
            <Area type="monotone" dataKey="fraudClicks" name="fraudClicks" stroke="#EF4444" strokeWidth={2} fill="url(#fraudGrad)" dot={false} />
            <Area type="monotone" dataKey="moneySaved" name="moneySaved" stroke="#22C55E" strokeWidth={2} fill="url(#savedGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Suspicious Clicks Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="text-base font-bold font-cairo text-foreground">النقرات المشبوهة المكتشفة</h2>
          <div className="flex items-center gap-1.5 mr-auto">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-tajawal text-muted-foreground">تحليل بالذكاء الاصطناعي</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-tajawal">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {["عنوان IP", "عدد النقرات", "السبب", "الثقة", "الموقع", "الحالة", "إجراء"].map(h => (
                  <th key={h} className="py-3 px-4 text-xs font-semibold text-muted-foreground text-center first:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fraudData.map((item) => {
                const action = actionConfig[item.action]
                return (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-mono text-sm font-bold text-foreground">{item.ip}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-tajawal">{item.device}</div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-lg font-bold font-inter text-red-500">{item.clickCount}</span>
                      <span className="text-xs text-muted-foreground font-tajawal block">نقرة</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-xs font-tajawal text-foreground max-w-[140px] block mx-auto">{item.reason}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex-1 max-w-[60px] bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", item.confidence > 85 ? "bg-red-500" : item.confidence > 65 ? "bg-amber-500" : "bg-slate-400")}
                            style={{ width: `${item.confidence}%` }}
                          />
                        </div>
                        <span className={cn(
                          "text-xs font-bold font-inter",
                          item.confidence > 85 ? "text-red-500" : item.confidence > 65 ? "text-amber-500" : "text-slate-400"
                        )}>
                          {item.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-xs font-tajawal text-muted-foreground">{item.location}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border font-tajawal", action.color, action.bg)}>
                        {action.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.action !== "blocked" && (
                          <button
                            onClick={() => handleBlock(item.id)}
                            title="حظر هذا العنوان"
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {item.action !== "ignored" && (
                          <button
                            onClick={() => handleIgnore(item.id)}
                            title="تجاهل هذا التنبيه"
                            className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auto-Protection Settings */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold font-cairo text-foreground">إعدادات الحماية التلقائية</h2>
        </div>
        <div className="space-y-5">
          {/* Auto Block Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border">
            <div>
              <div className="font-semibold font-tajawal text-foreground text-sm">تفعيل الحظر التلقائي</div>
              <div className="text-xs font-tajawal text-muted-foreground mt-0.5">
                حظر IP تلقائياً عند تجاوز حد النقرات المحدد بثقة {">"} 85%
              </div>
            </div>
            <button
              onClick={() => setAutoBlock(!autoBlock)}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none",
                autoBlock ? "bg-primary" : "bg-muted border border-border"
              )}
            >
              <span className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                autoBlock ? "right-1" : "right-7"
              )} />
            </button>
          </div>

          {/* Threshold Slider */}
          <div className="p-4 bg-muted/30 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold font-tajawal text-foreground text-sm">حد النقرات قبل الحظر</div>
                <div className="text-xs font-tajawal text-muted-foreground mt-0.5">الحد الأقصى للنقرات من نفس IP قبل الحظر التلقائي</div>
              </div>
              <div className="text-xl font-bold font-inter text-primary">{threshold} نقرات</div>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] font-inter text-muted-foreground mt-1">
              <span>5</span><span>50</span>
            </div>
          </div>

          {/* AI Custom Rules */}
          <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-4">
            <div className="font-semibold font-tajawal text-foreground text-sm border-b border-border pb-2">قواعد التصفية بالذكاء الاصطناعي (Heuristics)</div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-tajawal font-medium text-foreground">حظر أجهزة الـ Bots وأنظمة المحاكاة تلقائياً</div>
                <div className="text-[10px] font-tajawal text-muted-foreground mt-0.5">استبعاد الزيارات الوهمية المصنفة كأنظمة برمجية آليّة</div>
              </div>
              <button
                onClick={() => setRuleBots(!ruleBots)}
                className={cn("relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none shrink-0", ruleBots ? "bg-primary" : "bg-muted border border-border")}
              >
                <span className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all duration-200", ruleBots ? "right-1" : "right-5")} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-tajawal font-medium text-foreground">كشف وفلترة استخدام البروكسي والـ VPN</div>
                <div className="text-[10px] font-tajawal text-muted-foreground mt-0.5">منع النقرات القادمة من شبكات متخفية أو عناوين مضللة</div>
              </div>
              <button
                onClick={() => setRuleProxy(!ruleProxy)}
                className={cn("relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none shrink-0", ruleProxy ? "bg-primary" : "bg-muted border border-border")}
              >
                <span className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all duration-200", ruleProxy ? "right-1" : "right-5")} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-tajawal font-medium text-foreground">التحقق من التناسق الجغرافي المستهدف</div>
                <div className="text-[10px] font-tajawal text-muted-foreground mt-0.5">تصفية النقرات من مناطق خارج نطاق استهداف حملتك الإعلانية</div>
              </div>
              <button
                onClick={() => setRuleGeo(!ruleGeo)}
                className={cn("relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none shrink-0", ruleGeo ? "bg-primary" : "bg-muted border border-border")}
              >
                <span className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all duration-200", ruleGeo ? "right-1" : "right-5")} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-tajawal font-medium text-foreground">تحليل سرعة النقر المكرر (أقل من ثانيتين)</div>
                <div className="text-[10px] font-tajawal text-muted-foreground mt-0.5">حظر فوري للزيارات فائقة السرعة التي يستحيل قيام البشر بها</div>
              </div>
              <button
                onClick={() => setRuleSpeed(!ruleSpeed)}
                className={cn("relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none shrink-0", ruleSpeed ? "bg-primary" : "bg-muted border border-border")}
              >
                <span className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all duration-200", ruleSpeed ? "right-1" : "right-5")} />
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold font-tajawal text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            حفظ إعدادات الحماية
          </button>
        </div>
      </div>

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
