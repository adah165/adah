"use client"

import { useState, useEffect } from "react"
import { mockPerformanceData, mockCampaigns, mockKeywords, mockSpendByChannel } from "@/lib/mock-data"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"
import { cn } from "@/lib/utils"
import { Download, FileText } from "lucide-react"

const dateRanges = ["اليوم", "أمس", "آخر ٧ أيام", "آخر ٣٠ يوم", "هذا الشهر", "مخصص"]

const RADIAN = Math.PI / 180
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-right font-tajawal">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: <span className="font-inter">{typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const [activeRange, setActiveRange] = useState("آخر ٣٠ يوم")
  const [activeCampaign, setActiveCampaign] = useState("الكل")

  const [campaigns, setCampaigns] = useState<any[]>(mockCampaigns)
  const [stats, setStats] = useState<any>(null)
  const [spendByChannel, setSpendByChannel] = useState<any[]>(mockSpendByChannel)
  const [performanceTimeline, setPerformanceTimeline] = useState<any[]>(mockPerformanceData)
  const [keywords, setKeywords] = useState<any[]>(mockKeywords)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [analyticsRes, campaignsRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch("/api/campaigns")
        ])
        
        if (analyticsRes.ok) {
          const data = await analyticsRes.json()
          setStats(data.stats)
          setSpendByChannel(data.spendByChannel)
          setPerformanceTimeline(data.performanceTimeline)
          setKeywords(data.keywords)
        }
        if (campaignsRes.ok) {
          const campData = await campaignsRes.json()
          setCampaigns(campData)
        }
      } catch (err) {
        console.error("Failed to load analytics", err)
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [])

  const totalSpend = stats ? stats.totalSpend.numericValue : campaigns.reduce((a, c) => a + c.spend, 0)
  const totalClicks = stats ? stats.totalClicks.numericValue : campaigns.reduce((a, c) => a + c.clicks, 0)
  const totalImpressions = stats ? (stats.totalClicks.numericValue * 15) : campaigns.reduce((a, c) => a + c.impressions, 0)
  const totalConversions = stats ? stats.totalConversions.numericValue : campaigns.reduce((a, c) => a + c.conversions, 0)

  const handleExportCSV = () => {
    const headers = ["الحملة", "الإنفاق", "النقرات", "مرات الظهور", "CTR", "التحويلات"]
    const rows = campaigns.map(c => [c.name, c.spend, c.clicks, c.impressions, c.ctr, c.conversions])
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "adah-report.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    window.print()
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-cairo text-foreground">التقارير والإحصائيات</h1>
          <p className="text-sm font-tajawal text-muted-foreground mt-1">تحليل شامل لأداء جميع حملاتك الإعلانية</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold font-tajawal text-foreground bg-card hover:bg-muted transition-colors"
          >
            <Download className="w-4 h-4" />
            تصدير CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold font-tajawal hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            <FileText className="w-4 h-4" />
            تصدير PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap print:hidden">
        <div className="flex gap-1.5 flex-wrap">
          {dateRanges.map(range => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold font-tajawal transition-colors",
                activeRange === range ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {range}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-border" />
        <select
          value={activeCampaign}
          onChange={e => setActiveCampaign(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-tajawal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option>الكل</option>
          {campaigns.map(c => <option key={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الإنفاق", value: stats ? `${stats.totalSpend.value} ${stats.totalSpend.unit}` : `${totalSpend.toLocaleString()} ر.س`, color: "text-primary" },
          { label: "إجمالي النقرات", value: stats ? `${stats.totalClicks.value} ${stats.totalClicks.unit}` : totalClicks.toLocaleString(), color: "text-sky-500" },
          { label: "مرات الظهور", value: stats ? totalImpressions.toLocaleString() : totalImpressions.toLocaleString(), color: "text-amber-500" },
          { label: "التحويلات", value: stats ? `${stats.totalConversions.value} ${stats.totalConversions.unit}` : totalConversions.toLocaleString(), color: "text-emerald-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5 text-center">
            <div className={cn("text-2xl font-bold font-inter", color)}>{value}</div>
            <div className="text-xs font-tajawal text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Area Chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-base font-bold font-cairo text-foreground mb-5">الأداء الزمني — الإنفاق والنقرات</h2>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={performanceTimeline} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1B4FDB" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1B4FDB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="clicksGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "Tajawal" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "Inter" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontFamily: "Tajawal", fontSize: "12px", paddingTop: "12px" }} formatter={v => v === "spend" ? "الإنفاق" : "النقرات"} />
            <Area type="monotone" dataKey="spend" name="spend" stroke="#1B4FDB" strokeWidth={2.5} fill="url(#spendGrad)" dot={false} />
            <Area type="monotone" dataKey="clicks" name="clicks" stroke="#0EA5E9" strokeWidth={2.5} fill="url(#clicksGrad2)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pie + Bar side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-base font-bold font-cairo text-foreground mb-5">توزيع الإنفاق حسب القناة</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={spendByChannel}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {spendByChannel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, "الحصة"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 flex-1">
              {spendByChannel.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-xs font-tajawal text-foreground">{item.name}</span>
                  </div>
                  <span className="text-xs font-inter font-bold text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Keywords Bar Chart */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-base font-bold font-cairo text-foreground mb-5">أفضل الكلمات المفتاحية أداءً</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={keywords.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "Inter" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="keyword" tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "Tajawal" }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="clicks" name="النقرات" fill="#1B4FDB" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-bold font-cairo text-foreground">جدول أداء الحملات التفصيلي</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-tajawal">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {["الحملة", "الإنفاق", "النقرات", "مرات الظهور", "CTR", "CPC", "التحويلات"].map(h => (
                  <th key={h} className="py-3 px-4 text-xs font-semibold text-muted-foreground text-center first:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-foreground">{c.name}</td>
                  <td className="py-3.5 px-4 text-center font-inter">ر.س {c.spend.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-center font-inter">{c.clicks.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-center font-inter">{c.impressions.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={cn("font-inter font-bold", c.ctr > 5 ? "text-emerald-500" : c.ctr > 3 ? "text-amber-500" : "text-red-500")}>
                      {c.ctr}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-inter">ر.س {c.cpc}</td>
                  <td className="py-3.5 px-4 text-center font-inter font-bold text-primary">{c.conversions.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
