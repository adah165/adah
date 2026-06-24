"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, DollarSign, MousePointerClick, Target, Percent, BarChart2, ShieldAlert, ArrowLeft, Loader2 } from "lucide-react"
import { mockStats, mockPerformanceData, mockCampaigns, mockFraudData } from "@/lib/mock-data"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from "recharts"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

const statCards = [
  {
    title: "إجمالي الإنفاق",
    key: "totalSpend" as const,
    icon: DollarSign,
    color: "blue",
    gradient: "from-blue-600 via-blue-500 to-sky-400",
  },
  {
    title: "إجمالي النقرات",
    key: "totalClicks" as const,
    icon: MousePointerClick,
    color: "sky",
    gradient: "from-sky-500 via-cyan-400 to-teal-400",
  },
  {
    title: "التحويلات",
    key: "totalConversions" as const,
    icon: Target,
    color: "green",
    gradient: "from-emerald-500 via-green-400 to-teal-400",
  },
  {
    title: "معدل النقر CTR",
    key: "avgCTR" as const,
    icon: Percent,
    color: "amber",
    gradient: "from-amber-500 via-yellow-400 to-orange-400",
  },
  {
    title: "تكلفة النقرة CPC",
    key: "avgCPC" as const,
    icon: BarChart2,
    color: "purple",
    gradient: "from-purple-500 via-violet-400 to-indigo-400",
  },
]

const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
  blue:   { bg: "bg-blue-500/10",   text: "text-blue-500",   ring: "shadow-blue-500/20" },
  sky:    { bg: "bg-sky-500/10",    text: "text-sky-500",    ring: "shadow-sky-500/20" },
  green:  { bg: "bg-emerald-500/10",text: "text-emerald-500",ring: "shadow-emerald-500/20" },
  amber:  { bg: "bg-amber-500/10",  text: "text-amber-500",  ring: "shadow-amber-500/20" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-500", ring: "shadow-purple-500/20" },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  ENABLED: { label: "نشطة", color: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20" },
  PAUSED:  { label: "متوقفة", color: "bg-amber-500/15 text-amber-500 border border-amber-500/20" },
  REMOVED: { label: "منتهية", color: "bg-slate-500/15 text-slate-400 border border-slate-500/20" },
}

function StatCard({
  title,
  value,
  unit,
  change,
  icon: Icon,
  color,
  gradient,
}: {
  title: string
  value: string
  unit: string
  change: number
  icon: React.ElementType
  color: string
  gradient: string
}) {
  const colors = colorMap[color]
  const isPositive = change > 0

  return (
    <div className="relative rounded-2xl bg-card border border-border p-5 overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      {/* animated gradient border at top */}
      <div className={cn("absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r animate-gradient-border", gradient)} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-tajawal text-muted-foreground mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-inter text-foreground">{value}</span>
            <span className="text-sm font-tajawal text-muted-foreground">{unit}</span>
          </div>
          <div className={cn(
            "flex items-center gap-1 mt-2 text-xs font-medium font-tajawal",
            isPositive ? "text-emerald-500" : "text-red-500"
          )}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{isPositive ? "+" : ""}{change}%</span>
            <span className="text-muted-foreground font-normal">مقارنة بالشهر الماضي</span>
          </div>
        </div>
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-lg", colors.bg, colors.ring)}>
          <Icon className={cn("w-5 h-5", colors.text)} />
        </div>
      </div>
    </div>
  )
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

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(mockStats)
  const [performanceTimeline, setPerformanceTimeline] = useState<any[]>(mockPerformanceData)
  const [campaigns, setCampaigns] = useState<any[]>(mockCampaigns)
  const [fraudData, setFraudData] = useState<any[]>(mockFraudData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Trigger auto seed first
        await fetch("/api/seed")
        
        // Load data in parallel
        const [campRes, polyRes, fraudRes] = await Promise.all([
          fetch("/api/campaigns"),
          fetch("/api/analytics"),
          fetch("/api/fraud")
        ])
        
        if (campRes.ok) {
          const campData = await campRes.json()
          setCampaigns(campData)
        }
        if (polyRes.ok) {
          const polyData = await polyRes.json()
          setStats(polyData.stats)
          setPerformanceTimeline(polyData.performanceTimeline)
        }
        if (fraudRes.ok) {
          const fraudDataList = await fraudRes.json()
          setFraudData(fraudDataList)
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const activeLogs = fraudData.filter(f => f.action !== "ignored")
  const fraudToday = activeLogs.length
  const moneySavedToday = activeLogs.reduce((acc, f) => acc + f.estimatedLoss, 0)


  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-cairo text-foreground">
            مرحباً، {session?.user?.name || "سارة الأحمد"} 👋
          </h1>
          <p className="text-sm font-tajawal text-muted-foreground mt-1">
            إليك ملخص أداء حملاتك لليوم — الأحد، ٢٢ يونيو ٢٠٢٤
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold font-tajawal hover:bg-primary/90 transition-all duration-200 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
        >
          <span>+ إنشاء حملة جديدة</span>
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const stat = stats[card.key]
          return (
            <StatCard
              key={card.key}
              title={card.title}
              value={stat.value}
              unit={stat.unit}
              change={stat.change}
              icon={card.icon}
              color={card.color}
              gradient={card.gradient}
            />
          )
        })}
      </div>

      {/* Main Performance Chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold font-cairo text-foreground">أداء الحملات — آخر ١٤ يوم</h2>
            <p className="text-xs font-tajawal text-muted-foreground mt-0.5">النقرات والتحويلات اليومية</p>
          </div>
          <div className="flex gap-2 font-tajawal text-xs">
            {["٧ أيام", "١٤ يوم", "٣٠ يوم"].map((label, i) => (
              <button
                key={label}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium transition-colors",
                  i === 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={performanceTimeline} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1B4FDB" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1B4FDB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "Tajawal" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "Inter" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontFamily: "Tajawal", fontSize: "13px", paddingTop: "16px" }}
              formatter={(value) => value === "clicks" ? "النقرات" : "التحويلات"}
            />
            <Area type="monotone" dataKey="clicks" name="clicks" stroke="#1B4FDB" strokeWidth={2.5} fill="url(#clicksGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="conversions" name="conversions" stroke="#22C55E" strokeWidth={2.5} fill="url(#convGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Fraud alert + Recent campaigns side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Fraud Alert Widget */}
        <div className="lg:col-span-2 bg-card border border-red-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-rose-400 to-orange-500 animate-gradient-border" />
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-bold font-cairo text-foreground">كشف النقرات الوهمية</h2>
              <p className="text-xs font-tajawal text-muted-foreground">تحديث مباشر بواسطة الذكاء الاصطناعي</p>
            </div>
            <div className="mr-auto flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-xs text-red-500 font-semibold font-tajawal">مباشر</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold font-inter text-red-500">{fraudToday}</div>
              <div className="text-xs font-tajawal text-muted-foreground mt-0.5">نقرة مشبوهة اليوم</div>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold font-inter text-emerald-500">{moneySavedToday.toLocaleString()}</div>
              <div className="text-xs font-tajawal text-muted-foreground mt-0.5">ريال تم توفيرها</div>
            </div>
          </div>

          <div className="space-y-2.5">
            {fraudData.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                <div className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  item.action === "blocked" ? "bg-red-500" : item.action === "review" ? "bg-amber-500" : "bg-slate-400"
                )} />
                <span className="text-xs font-inter text-muted-foreground flex-1 truncate">{item.ip}</span>
                <span className="text-xs font-tajawal text-muted-foreground">{item.clickCount} نقرة</span>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full font-tajawal",
                  item.action === "blocked" ? "bg-red-500/10 text-red-500" :
                  item.action === "review" ? "bg-amber-500/10 text-amber-500" : "bg-slate-500/10 text-slate-400"
                )}>
                  {item.action === "blocked" ? "محظور" : item.action === "review" ? "مراجعة" : "تجاهل"}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/fraud"
            className="flex items-center gap-2 mt-4 text-sm font-semibold font-tajawal text-red-500 hover:text-red-400 transition-colors"
          >
            <span>عرض تقرير الحماية الكامل</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Recent Campaigns */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold font-cairo text-foreground">آخر الحملات الإعلانية</h2>
            <Link href="/campaigns" className="text-xs font-tajawal text-primary hover:underline font-semibold">
              عرض الكل
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-tajawal">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right py-2 px-1 text-xs font-semibold text-muted-foreground">الحملة</th>
                  <th className="text-center py-2 px-1 text-xs font-semibold text-muted-foreground">الحالة</th>
                  <th className="text-center py-2 px-1 text-xs font-semibold text-muted-foreground">النقرات</th>
                  <th className="text-center py-2 px-1 text-xs font-semibold text-muted-foreground">CTR</th>
                  <th className="text-center py-2 px-1 text-xs font-semibold text-muted-foreground">الإنفاق</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.slice(0, 4).map((campaign) => {
                  const status = statusConfig[campaign.status] || { label: campaign.status, color: "bg-slate-500/15 text-slate-400" }
                  return (
                    <tr key={campaign.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                      <td className="py-3 px-1">
                        <div className="font-semibold text-foreground text-sm truncate max-w-[160px]" title={campaign.name}>
                          {campaign.name}
                        </div>
                      </td>
                      <td className="py-3 px-1 text-center">
                        <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full", status.color)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-1 text-center font-inter font-semibold text-foreground">
                        {campaign.clicks.toLocaleString()}
                      </td>
                      <td className="py-3 px-1 text-center font-inter font-semibold text-foreground">
                        {campaign.ctr}%
                      </td>
                      <td className="py-3 px-1 text-center font-inter font-semibold text-foreground">
                        ر.س {campaign.spend.toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
