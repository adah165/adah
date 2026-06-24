"use client"

import { mockCampaigns } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Plus, Search, Filter, MoreVertical, TrendingUp, TrendingDown, Megaphone, ShoppingBag, Video, Monitor, MapPin, Tag, Globe, Sparkles, Check, X, Loader2, Eye, Settings, Map } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Toast } from "@/components/ui/toast"
import { AreaChart, Area, ResponsiveContainer } from "recharts"



const statusConfig: Record<string, { label: string; color: string }> = {
  ENABLED: { label: "نشطة", color: "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20" },
  PAUSED:  { label: "متوقفة", color: "bg-amber-500/15 text-amber-500 border border-amber-500/20" },
  REMOVED: { label: "منتهية", color: "bg-slate-500/15 text-slate-400 border border-slate-500/20" },
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  search:   { label: "بحث", icon: Search, color: "text-blue-500" },
  display:  { label: "شبكة العرض", icon: Monitor, color: "text-sky-500" },
  shopping: { label: "تسوق", icon: ShoppingBag, color: "text-amber-500" },
  video:    { label: "فيديو", icon: Video, color: "text-red-500" },
}

const generateSparklineData = (clicks: number) => {
  const base = clicks / 7
  return [
    { clicks: base * 0.9 },
    { clicks: base * 1.1 },
    { clicks: base * 0.8 },
    { clicks: base * 1.2 },
    { clicks: base * 1.0 },
    { clicks: base * 1.3 },
    { clicks: clicks > 0 ? base * 1.15 : base * 0.95 },
  ]
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>(mockCampaigns)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("ALL")
  const [loading, setLoading] = useState(true)

  // Edit campaign states
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editBudget, setEditBudget] = useState(0)
  const [editStatus, setEditStatus] = useState("")
  const [editBidStrategy, setEditBidStrategy] = useState("maximize_clicks")
  const [editLocations, setEditLocations] = useState<string[]>([])
  const [editKeywords, setEditKeywords] = useState<string[]>([])
  const [editHeadlines, setEditHeadlines] = useState<string[]>(["", "", ""])
  const [editDescriptions, setEditDescriptions] = useState<string[]>(["", ""])
  const [editFinalUrl, setEditFinalUrl] = useState("")
  
  // Custom Tab index & AI Context description
  const [activeTab, setActiveTab] = useState<"basics" | "geotargeting" | "keywords" | "adcopy">("basics")
  const [aiContext, setAiContext] = useState("")
  const [saving, setSaving] = useState(false)

  // Geotargeting states
  const [locationQuery, setLocationQuery] = useState("")
  const [locationResults, setLocationResults] = useState<{ id: string; name: string; type: string }[]>([])
  const [searchingLocations, setSearchingLocations] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)

  // Radius map states
  const [targetMode, setTargetMode] = useState<"search" | "radius">("search")
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [mapRadius, setMapRadius] = useState(5)
  const [customLocationName, setCustomLocationName] = useState("")

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerInstanceRef = useRef<any>(null)
  const circleInstanceRef = useRef<any>(null)

  // Keyword Generator states
  const [loadingKeywords, setLoadingKeywords] = useState(false)
  const [suggestedKeywords, setSuggestedKeywords] = useState<any[]>([])
  const [showKeywordDrawer, setShowKeywordDrawer] = useState(false)
  const [keywordInput, setKeywordInput] = useState("")

  // Ad Copy states
  const [loadingAdCopy, setLoadingAdCopy] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile")

  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success")

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCampaign) return
    setSaving(true)
    try {
      const res = await fetch("/api/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCampaign.id,
          name: editName,
          budget: Number(editBudget),
          status: editStatus,
          bidStrategy: editBidStrategy,
          locations: editLocations,
          keywords: editKeywords,
          headlines: editHeadlines.filter(h => h.trim() !== ""),
          descriptions: editDescriptions.filter(d => d.trim() !== ""),
          finalUrl: editFinalUrl,
        }),
      })

      if (res.ok) {
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === editingCampaign.id
              ? {
                  ...c,
                  name: editName,
                  budget: Number(editBudget),
                  status: editStatus,
                  bidStrategy: editBidStrategy,
                  targetLocations: editLocations,
                  keywords: editKeywords,
                  headlines: editHeadlines,
                  descriptions: editDescriptions,
                  finalUrl: editFinalUrl,
                }
              : c
          )
        )
        setIsEditOpen(false)
        setEditingCampaign(null)
        setToastType("success")
        setToastMessage("تم تحديث تفاصيل الحملة بنجاح")
      } else {
        const data = await res.json()
        setToastType("error")
        setToastMessage(data.error || "فشل تحديث الحملة")
      }
    } catch (err) {
      console.error(err)
      setToastType("error")
      setToastMessage("حدث خطأ أثناء تعديل الحملة")
    } finally {
      setSaving(false)
    }
  }



  useEffect(() => {
    async function loadCampaigns() {
      try {
        const res = await fetch("/api/campaigns")
        if (res.ok) {
          const data = await res.json()
          setCampaigns(data)
        }
      } catch (err) {
        console.error("Failed to load campaigns", err)
      } finally {
        setLoading(false)
      }
    }
    loadCampaigns()
  }, [])

  // Location search effect for Edit modal
  useEffect(() => {
    if (!locationQuery.trim()) {
      setLocationResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearchingLocations(true)
      try {
        const res = await fetch(`/api/locations/search?q=${encodeURIComponent(locationQuery)}`)
        if (res.ok) {
          const data = await res.json()
          setLocationResults(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setSearchingLocations(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [locationQuery])

  // Load Leaflet in Edit modal
  useEffect(() => {
    if (activeTab !== "geotargeting" || targetMode !== "radius" || !isEditOpen) return

    if ((window as any).L) {
      setLeafletLoaded(true)
      return
    }

    // Load Leaflet CSS
    const cssId = "leaflet-cdn-css"
    let link = document.getElementById(cssId) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement("link")
      link.id = cssId
      link.rel = "stylesheet"
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      document.head.appendChild(link)
    }

    // Load Leaflet JS
    const jsId = "leaflet-cdn-js"
    let script = document.getElementById(jsId) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement("script")
      script.id = jsId
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      script.async = true
      script.defer = true
      script.onload = () => setLeafletLoaded(true)
      document.body.appendChild(script)
    } else {
      setLeafletLoaded(true)
    }
  }, [activeTab, targetMode, isEditOpen])

  // Initialize Map in Edit modal
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || activeTab !== "geotargeting" || targetMode !== "radius" || !isEditOpen) return

    const L = (window as any).L
    if (!L) return

    const customIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })

    const initialCenter = mapCoordinates ? [mapCoordinates.lat, mapCoordinates.lng] : [24.7136, 46.6753] // Default Riyadh

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
      markerInstanceRef.current = null
      circleInstanceRef.current = null
    }

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: mapCoordinates ? 12 : 5,
      zoomControl: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map)

    mapInstanceRef.current = map

    const updatePosition = (lat: number, lng: number) => {
      setMapCoordinates({ lat, lng })
      setCustomLocationName(`نطاق دائري [${lat.toFixed(4)}، ${lng.toFixed(4)}]`)

      if (markerInstanceRef.current) {
        markerInstanceRef.current.setLatLng([lat, lng])
      } else {
        const marker = L.marker([lat, lng], { draggable: true, icon: customIcon }).addTo(map)
        marker.on("dragend", () => {
          const newLatLng = marker.getLatLng()
          updatePosition(newLatLng.lat, newLatLng.lng)
        })
        markerInstanceRef.current = marker
      }

      if (circleInstanceRef.current) {
        circleInstanceRef.current.setLatLng([lat, lng])
      } else {
        const circle = L.circle([lat, lng], {
          color: "#1B4FDB",
          fillColor: "#1B4FDB",
          fillOpacity: 0.15,
          radius: mapRadius * 1000 // meters
        }).addTo(map)
        circleInstanceRef.current = circle
      }
    }

    if (mapCoordinates) {
      updatePosition(mapCoordinates.lat, mapCoordinates.lng)
    }

    map.on("click", (e: any) => {
      updatePosition(e.latlng.lat, e.latlng.lng)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerInstanceRef.current = null
        circleInstanceRef.current = null
      }
    }
  }, [leafletLoaded, activeTab, targetMode, isEditOpen])

  // Sync radius slider modifications
  useEffect(() => {
    if (circleInstanceRef.current) {
      circleInstanceRef.current.setRadius(mapRadius * 1000)
    }
  }, [mapRadius])

  // AI Keyword Suggestion fetcher
  const fetchAISuggestions = async () => {
    setLoadingKeywords(true)
    setShowKeywordDrawer(true)
    try {
      const res = await fetch("/api/keywords/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: editName,
          goal: "sales",
          description: aiContext || editName
        })
      })
      if (res.ok) {
        const data = await res.json()
        setSuggestedKeywords(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingKeywords(false)
    }
  }

  // AI Ad Copy generator
  const generateAIAdCopy = async () => {
    setLoadingAdCopy(true)
    try {
      const res = await fetch("/api/ad-copy/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: editName,
          goal: "sales",
          description: aiContext || editName
        })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.headlines && data.headlines.length >= 3) {
          setEditHeadlines([data.headlines[0], data.headlines[1], data.headlines[2]])
        }
        if (data.descriptions && data.descriptions.length >= 2) {
          setEditDescriptions([data.descriptions[0], data.descriptions[1]])
        }
        if (!editFinalUrl) {
          setEditFinalUrl("https://mybusiness.sa")
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAdCopy(false)
    }
  }

  const addLocation = (locName: string) => {
    if (!editLocations.includes(locName)) {
      setEditLocations(prev => [...prev, locName])
    }
    setLocationQuery("")
    setLocationResults([])
    setShowLocationDropdown(false)
  }

  const removeLocation = (locName: string) => {
    setEditLocations(prev => prev.filter(l => l !== locName))
  }

  const addKeyword = (kw: string) => {
    const trimmed = kw.trim()
    if (trimmed && !editKeywords.includes(trimmed)) {
      setEditKeywords(prev => [...prev, trimmed])
    }
    setKeywordInput("")
  }

  const removeKeyword = (kw: string) => setEditKeywords(prev => prev.filter(k => k !== kw))

  const filtered = campaigns.filter(c => {
    const matchSearch = c.name.includes(search) || search === ""
    const matchFilter = filter === "ALL" || c.status === filter
    return matchSearch && matchFilter
  })


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-cairo text-foreground">الحملات الإعلانية</h1>
          <p className="text-sm font-tajawal text-muted-foreground mt-1">إدارة وتتبع جميع حملاتك على Google Ads</p>
        </div>
        <Link
          href="/campaigns/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold font-tajawal hover:bg-primary/90 transition-all duration-200 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء حملة جديدة</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="البحث عن حملة..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl bg-card border border-border text-sm font-tajawal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex gap-1.5 font-tajawal text-sm">
          {[
            { val: "ALL", label: "الكل" },
            { val: "ENABLED", label: "نشطة" },
            { val: "PAUSED", label: "متوقفة" },
            { val: "REMOVED", label: "منتهية" },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={cn(
                "px-3 py-2 rounded-xl font-medium transition-colors text-sm",
                filter === val
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "إجمالي الحملات", value: campaigns.length, color: "text-foreground" },
          { label: "الحملات النشطة", value: campaigns.filter(c => c.status === "ENABLED").length, color: "text-emerald-500" },
          { label: "الحملات المتوقفة", value: campaigns.filter(c => c.status === "PAUSED").length, color: "text-amber-500" },
          { label: "إجمالي التحويلات", value: campaigns.reduce((a, c) => a + c.conversions, 0).toLocaleString(), color: "text-primary" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className={cn("text-2xl font-bold font-inter", color)}>{value}</div>
            <div className="text-xs font-tajawal text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Campaigns Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-tajawal">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-right py-3.5 px-5 text-xs font-semibold text-muted-foreground">اسم الحملة</th>
                <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground">النوع</th>
                <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground">الحالة</th>
                <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground">الميزانية/يوم</th>
                <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground">النقرات</th>
                <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground">CTR</th>
                <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground">أداء 7 أيام</th>
                <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground">التحويلات</th>
                <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground">إجمالي الإنفاق</th>
                <th className="text-center py-3.5 px-3 text-xs font-semibold text-muted-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-muted-foreground font-tajawal">
                    لا توجد حملات تطابق بحثك
                  </td>
                </tr>

              ) : (
                filtered.map((campaign) => {
                  const status = statusConfig[campaign.status]
                  const type = typeConfig[campaign.type]
                  const TypeIcon = type.icon
                  return (
                    <tr key={campaign.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-semibold text-foreground text-sm">{campaign.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 font-inter">
                          {campaign.startDate}{campaign.endDate ? ` — ${campaign.endDate}` : " — مستمرة"}
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <div className={cn("flex items-center justify-center gap-1.5 text-xs font-medium", type.color)}>
                          <TypeIcon className="w-3.5 h-3.5" />
                          {type.label}
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full", status.color)}>{status.label}</span>
                      </td>
                      <td className="py-4 px-3 text-center font-inter font-semibold text-foreground">
                        ر.س {campaign.budget.toLocaleString()}
                      </td>
                      <td className="py-4 px-3 text-center font-inter font-semibold text-foreground">
                        {campaign.clicks.toLocaleString()}
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className={cn("font-inter font-bold text-sm", campaign.ctr > 5 ? "text-emerald-500" : campaign.ctr > 3 ? "text-amber-500" : "text-red-500")}>
                          {campaign.ctr}%
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <div className="w-16 h-8 mx-auto">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={generateSparklineData(campaign.clicks)} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                              <defs>
                                <linearGradient id={`sparklineGrad-${campaign.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={campaign.ctr > 4 ? "#10B981" : "#1B4FDB"} stopOpacity={0.2} />
                                  <stop offset="95%" stopColor={campaign.ctr > 4 ? "#10B981" : "#1B4FDB"} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Area
                                type="monotone"
                                dataKey="clicks"
                                stroke={campaign.ctr > 4 ? "#10B981" : "#1B4FDB"}
                                strokeWidth={1.5}
                                fill={`url(#sparklineGrad-${campaign.id})`}
                                dot={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-center font-inter font-semibold text-foreground">
                        {campaign.conversions.toLocaleString()}
                      </td>

                      <td className="py-4 px-3 text-center font-inter font-semibold text-foreground">
                        ر.س {campaign.spend.toLocaleString()}
                      </td>
                      <td className="py-4 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingCampaign(campaign)
                              setEditName(campaign.name)
                              setEditBudget(campaign.budget)
                              setEditStatus(campaign.status)
                              setEditBidStrategy(campaign.bidStrategy || "maximize_clicks")
                              setEditLocations(campaign.targetLocations || ["المملكة العربية السعودية"])
                              setEditKeywords(campaign.keywords || [])
                              const h = campaign.headlines || ["", "", ""]
                              const d = campaign.descriptions || ["", ""]
                              while (h.length < 3) h.push("")
                              while (d.length < 2) d.push("")
                              setEditHeadlines([...h])
                              setEditDescriptions([...d])
                              setEditFinalUrl(campaign.finalUrl || "https://mybusiness.sa")
                              setAiContext(campaign.name || "")
                              setTargetMode("search")
                              setActiveTab("basics")
                              setIsEditOpen(true)
                            }}
                            className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors text-xs font-tajawal"
                          >
                            تعديل
                          </button>

                          <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Campaign Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-3xl bg-card border border-border text-foreground font-tajawal text-right p-6 rounded-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader className="mb-4 pb-2 border-b border-border/60">
            <DialogTitle className="text-xl font-bold font-cairo text-foreground font-cairo">إعدادات الحملة الإعلانية المتقدمة</DialogTitle>
          </DialogHeader>
          
          {/* Tabs Selector */}
          <div className="flex bg-muted/40 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("basics")}
              className={cn(
                "flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                activeTab === "basics" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Settings className="w-4 h-4 text-primary" />
              <span>الأساسيات</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("geotargeting")}
              className={cn(
                "flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                activeTab === "geotargeting" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MapPin className="w-4 h-4 text-primary" />
              <span>الاستهداف والخرائط</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("keywords")}
              className={cn(
                "flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                activeTab === "keywords" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Tag className="w-4 h-4 text-primary" />
              <span>الكلمات المفتاحية</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("adcopy")}
              className={cn(
                "flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                activeTab === "adcopy" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Globe className="w-4 h-4 text-primary" />
              <span>نصوص الإعلان</span>
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* TAB 1: BASICS */}
            {activeTab === "basics" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">اسم الحملة</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">الميزانية اليومية (ر.س)</label>
                    <input
                      type="number"
                      value={editBudget}
                      onChange={(e) => setEditBudget(Number(e.target.value))}
                      required
                      min={50}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-inter text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">حالة الحملة</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="ENABLED">نشطة</option>
                      <option value="PAUSED">متوقفة</option>
                      <option value="REMOVED">منتهية</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">استراتيجية المزايدة</label>
                  <select
                    value={editBidStrategy}
                    onChange={(e) => setEditBidStrategy(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="target_cpa">تكلفة اكتساب مستهدفة (CPA)</option>
                    <option value="target_roas">عائد مستهدف على الإنفاق (ROAS)</option>
                    <option value="maximize_clicks">تعظيم النقرات</option>
                    <option value="maximize_conversions">تعظيم التحويلات</option>
                    <option value="manual_cpc">تكلفة نقرة يدوية (CPC)</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 2: GEOTARGETING & MAPS */}
            {activeTab === "geotargeting" && (
              <div className="space-y-4">
                <div className="flex bg-muted/60 p-1 rounded-xl max-w-[320px] mb-4">
                  <button
                    type="button"
                    onClick={() => setTargetMode("search")}
                    className={cn(
                      "flex-1 text-center py-1.5 rounded-lg text-xs font-bold font-tajawal transition-all",
                      targetMode === "search" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    البحث بالاسم
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode("radius")}
                    className={cn(
                      "flex-1 text-center py-1.5 rounded-lg text-xs font-bold font-tajawal transition-all",
                      targetMode === "radius" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    نطاق دائري (Radius Map)
                  </button>
                </div>

                {targetMode === "search" ? (
                  <div className="relative border-b border-border/40 pb-4">
                    <label className="block text-sm font-semibold text-foreground mb-1.5">ابحث عن مناطق استهداف</label>
                    <div className="relative">
                      <Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                      <input
                        value={locationQuery}
                        onChange={e => { setLocationQuery(e.target.value); setShowLocationDropdown(true) }}
                        onFocus={() => setShowLocationDropdown(true)}
                        placeholder="ابحث عن دولة، مدينة أو منطقة (مثال: دبي، الرياض...)"
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    {showLocationDropdown && (locationQuery || searchingLocations) && (
                      <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                        {searchingLocations ? (
                          <div className="p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> جاري البحث عن المواقع...
                          </div>
                        ) : locationResults.length === 0 ? (
                          <div className="p-3 text-center text-xs text-muted-foreground">لا توجد نتائج مطابقة</div>
                        ) : (
                          locationResults.map(loc => (
                            <button
                              key={loc.id}
                              type="button"
                              onClick={() => addLocation(loc.name)}
                              className="w-full px-4 py-2 text-right hover:bg-muted/50 transition-colors flex items-center justify-between border-b border-border/40 last:border-b-0 text-xs"
                            >
                              <span className="font-semibold text-foreground">{loc.name}</span>
                              <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-[10px]">{loc.type}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 border-b border-border/40 pb-4">
                    <div className="w-full h-[200px] rounded-xl overflow-hidden border border-border bg-slate-950 flex items-center justify-center relative z-0">
                      <div ref={mapContainerRef} className="w-full h-full" />
                      {!leafletLoaded && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950 font-tajawal text-muted-foreground text-xs z-10">
                          <Loader2 className="w-5 h-5 animate-spin text-primary mb-2" />
                          <span>جاري تحميل الخريطة التفاعلية...</span>
                        </div>
                      )}
                    </div>

                    {mapCoordinates && (
                      <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-muted-foreground mb-1">اسم المنطقة</label>
                            <input
                              value={customLocationName}
                              onChange={(e) => setCustomLocationName(e.target.value)}
                              placeholder="مثال: محيط ميت غمر"
                              className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground focus:ring-2 focus:ring-primary/40"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-muted-foreground mb-1">قطر التغطية: <span className="font-bold text-primary font-inter">{mapRadius} كم</span></label>
                            <input
                              type="range"
                              min="1"
                              max="50"
                              value={mapRadius}
                              onChange={(e) => setMapRadius(Number(e.target.value))}
                              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary mt-2"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (mapCoordinates) {
                              const val = `${customLocationName || 'نطاق دائري'} (${mapRadius} كم حول ${mapCoordinates.lat.toFixed(4)}، ${mapCoordinates.lng.toFixed(4)})`
                              addLocation(val)
                            }
                            setMapCoordinates(null)
                            setCustomLocationName("")
                          }}
                          className="w-full py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow"
                        >
                          إضافة النطاق المحدد للاستهداف
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Target location badges */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-muted-foreground">المناطق المستهدفة الحالية</label>
                  <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-muted/20 rounded-xl border border-border">
                    {editLocations.length > 0 ? (
                      editLocations.map(loc => (
                        <span key={loc} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/20">
                          <MapPin className="w-3 h-3" />
                          {loc}
                          <button type="button" onClick={() => removeLocation(loc)} className="hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground p-1">لا توجد مناطق استهداف مضافة حالياً.</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: KEYWORDS */}
            {activeTab === "keywords" && (
              <div className="space-y-4">
                {/* AI contextual prompt */}
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-primary flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> وصف النشاط للحصول على اقتراحات الذكاء الاصطناعي
                  </label>
                  <textarea
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    rows={2}
                    placeholder="اكتب وصفاً مختصراً لنشاطك (مثال: متجر عبايات عصرية بالرياض)..."
                    className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-tajawal text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                  />
                  <button
                    type="button"
                    onClick={fetchAISuggestions}
                    disabled={loadingKeywords}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary text-xs font-bold transition-all disabled:opacity-75"
                  >
                    {loadingKeywords ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {loadingKeywords ? "جاري جلب الاقتراحات..." : "اقترح كلمات مفتاحية بالذكاء الاصطناعي"}
                  </button>
                </div>

                {/* AI keyword list */}
                {showKeywordDrawer && (
                  <div className="border border-border/80 rounded-xl p-3 bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">اقتراحات الكلمات</span>
                      <button
                        type="button"
                        onClick={() => {
                          suggestedKeywords.forEach(k => {
                            if (!editKeywords.includes(k.text)) setEditKeywords(prev => [...prev, k.text])
                          })
                        }}
                        className="text-[10px] text-primary hover:underline font-bold"
                      >
                        إضافة الكل
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                      {suggestedKeywords.map(k => {
                        const added = editKeywords.includes(k.text)
                        return (
                          <div key={k.text} className="flex items-center justify-between p-1.5 bg-card border border-border/60 rounded-lg text-[11px]">
                            <span className="font-semibold">{k.text}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-muted-foreground font-inter">{k.volume.toLocaleString()} بحث/شهر</span>
                              <button
                                type="button"
                                onClick={() => { if (!added) setEditKeywords(prev => [...prev, k.text]) }}
                                className={cn("p-0.5 rounded", added ? "text-emerald-500" : "text-primary hover:bg-muted")}
                              >
                                {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Manual keyword add */}
                <div className="flex gap-2">
                  <input
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKeyword(keywordInput) } }}
                    placeholder="أدخل كلمة مفتاحية جديدة..."
                    className="flex-1 px-4 py-2 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addKeyword(keywordInput)}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    إضافة
                  </button>
                </div>

                {/* Current keywords */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground">الكلمات المفتاحية النشطة للحملة</label>
                  <div className="flex flex-wrap gap-1.5 min-h-[50px] p-2 bg-muted/20 rounded-xl border border-border max-h-36 overflow-y-auto">
                    {editKeywords.length > 0 ? (
                      editKeywords.map(kw => (
                        <span key={kw} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/20">
                          <Tag className="w-3 h-3 text-primary/75" />
                          {kw}
                          <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground p-1">لا توجد كلمات مفتاحية مضافة لهذه الحملة.</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: AD COPY */}
            {activeTab === "adcopy" && (
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-foreground mb-1">رابط الهبوط (Final URL)</label>
                    <input
                      value={editFinalUrl}
                      onChange={e => setEditFinalUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-2 rounded-xl bg-background border border-border text-sm font-inter text-foreground focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateAIAdCopy}
                    disabled={loadingAdCopy}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold font-tajawal hover:bg-primary/20 transition-colors disabled:opacity-75 mt-6"
                  >
                    {loadingAdCopy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>توليد النصوص بالـ AI</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Inputs */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-muted-foreground">العناوين الرئيسية (حد أقصى 30 حرف)</label>
                      {editHeadlines.map((headline, idx) => (
                        <div key={idx} className="relative">
                          <input
                            value={headline}
                            onChange={e => {
                              const val = e.target.value
                              setEditHeadlines(prev => {
                                const clone = [...prev]
                                clone[idx] = val
                                return clone
                              })
                            }}
                            placeholder={`العنوان الرئيسي ${idx + 1}`}
                            className={cn(
                              "w-full pl-10 pr-3 py-2 rounded-lg bg-background border text-xs text-foreground focus:outline-none",
                              headline.length > 30 ? "border-red-500" : "border-border"
                            )}
                          />
                          <span className={cn("absolute left-2.5 top-2.5 text-[9px] font-bold font-inter", headline.length > 30 ? "text-red-500" : "text-muted-foreground")}>
                            {headline.length}/30
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-muted-foreground">الأوصاف الإعلانية (حد أقصى 90 حرف)</label>
                      {editDescriptions.map((desc, idx) => (
                        <div key={idx} className="relative">
                          <textarea
                            value={desc}
                            rows={2}
                            onChange={e => {
                              const val = e.target.value
                              setEditDescriptions(prev => {
                                const clone = [...prev]
                                clone[idx] = val
                                return clone
                              })
                            }}
                            placeholder={`الوصف الإعلاني ${idx + 1}`}
                            className={cn(
                              "w-full pl-10 pr-3 py-2 rounded-lg bg-background border text-xs text-foreground focus:outline-none resize-none",
                              desc.length > 90 ? "border-red-500" : "border-border"
                            )}
                          />
                          <span className={cn("absolute left-2.5 bottom-2 text-[9px] font-bold font-inter", desc.length > 90 ? "text-red-500" : "text-muted-foreground")}>
                            {desc.length}/90
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Simulator Preview */}
                  <div className="bg-muted/30 border border-border/80 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
                        <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-primary" /> معاينة الإعلان المحدث
                        </span>
                        <div className="flex bg-muted rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => setPreviewDevice("mobile")}
                            className={cn("text-[9px] px-2 py-0.5 rounded transition-all", previewDevice === "mobile" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground")}
                          >
                            جوال
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewDevice("desktop")}
                            className={cn("text-[9px] px-2 py-0.5 rounded transition-all", previewDevice === "desktop" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground")}
                          >
                            كمبيوتر
                          </button>
                        </div>
                      </div>

                      {/* Google Simulator Card */}
                      <div className={cn(
                        "bg-card border border-border p-3 rounded-xl space-y-1.5 text-right shadow-sm",
                        previewDevice === "mobile" ? "max-w-[280px] mx-auto" : "w-full"
                      )}>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-inter">
                          <span className="font-bold text-[9px] bg-muted px-1 py-0.5 rounded border border-border">إعلان sponsored</span>
                          <span className="truncate max-w-[150px]">{editFinalUrl || "https://mybusiness.sa"}</span>
                        </div>
                        <h3 className="text-blue-700 font-semibold text-xs hover:underline leading-snug cursor-pointer font-tajawal">
                          {editHeadlines.filter(h => h.trim() !== "").join(" | ") || "عنوانك الإعلاني المحدث يظهر هنا"}
                        </h3>
                        <p className="text-[10px] text-foreground/80 font-tajawal leading-relaxed">
                          {editDescriptions.filter(d => d.trim() !== "").join(" ") || "أوصاف الحملة ونصوصها الترويجية التي قمت بتعديلها تظهر هنا."}
                        </p>
                      </div>
                    </div>
                    <div className="text-[9px] text-muted-foreground pt-3 border-t border-border/40 mt-3 font-tajawal">
                      💡 تتكون الإعلانات الاحترافية من ثلاثة عناوين على الأقل ووصفين.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <DialogFooter className="flex gap-2 justify-end pt-4 border-t border-border mt-6">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={saving || (
                  activeTab === "adcopy" && (
                    editHeadlines.some(h => h.length > 30) ||
                    editDescriptions.some(d => d.length > 90)
                  )
                )}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "جاري حفظ التعديلات..." : "حفظ كل التغييرات"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
