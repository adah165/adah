"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { Search, Monitor, ShoppingBag, Video, ChevronLeft, ChevronRight, Sparkles, Check, X, Loader2, Rocket, Target, TrendingUp, Globe, Tag, Plus, Eye, MapPin, Map } from "lucide-react"
import { useRouter } from "next/navigation"

const campaignTypes = [
  { id: "search", label: "بحث Google", desc: "ظهر في نتائج البحث عند البحث عن منتجك", icon: Search, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30", selectedBg: "bg-blue-500 text-white" },
  { id: "display", label: "شبكة العرض", desc: "عرض إعلانات مرئية على ملايين المواقع", icon: Monitor, color: "text-sky-500", bg: "bg-sky-500/10 border-sky-500/30", selectedBg: "bg-sky-500 text-white" },
  { id: "shopping", label: "تسوق Shopping", desc: "عرض منتجاتك مباشرةً مع صور وأسعار", icon: ShoppingBag, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30", selectedBg: "bg-amber-500 text-white" },
  { id: "video", label: "فيديو YouTube", desc: "إعلانات فيديو قبل وأثناء محتوى YouTube", icon: Video, color: "text-red-500", bg: "bg-red-500/10 border-red-500/30", selectedBg: "bg-red-500 text-white" },
]

const goalTypes = [
  { id: "sales", label: "زيادة المبيعات", icon: ShoppingBag },
  { id: "leads", label: "جذب العملاء المحتملين", icon: Target },
  { id: "traffic", label: "زيادة الزيارات", icon: TrendingUp },
  { id: "brand", label: "الوعي بالعلامة التجارية", icon: Globe },
]

const bidStrategies = [
  { id: "target_cpa", label: "تكلفة اكتساب مستهدفة (CPA)" },
  { id: "target_roas", label: "عائد مستهدف على الإنفاق (ROAS)" },
  { id: "maximize_clicks", label: "تعظيم النقرات" },
  { id: "maximize_conversions", label: "تعظيم التحويلات" },
  { id: "manual_cpc", label: "تكلفة نقرة يدوية (CPC)" },
]

const currencies = [
  { code: "SAR", label: "ريال سعودي" },
  { code: "AED", label: "درهم إماراتي" },
  { code: "EGP", label: "جنيه مصري" },
  { code: "USD", label: "دولار أمريكي" },
]

const step2Schema = z.object({
  name: z.string().min(3, "اسم الحملة يجب أن يكون 3 أحرف على الأقل"),
  goal: z.string().min(1, "يرجى اختيار هدف الحملة"),
  description: z.string().optional(),
  budget: z.number().min(50, "الحد الأدنى للميزانية ٥٠ ريال"),
  currency: z.string(),
  bidStrategy: z.string().min(1, "يرجى اختيار استراتيجية المزايدة"),
  startDate: z.string().min(1, "يرجى تحديد تاريخ البدء"),
})

const steps = ["نوع الحملة", "تفاصيل الحملة", "الجمهور والكلمات", "نصوص الإعلان", "المراجعة والإطلاق"]

interface SuggestedKeyword {
  text: string
  volume: number
  competition: string
}

interface SuggestedCopy {
  headlines: string[]
  descriptions: string[]
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedType, setSelectedType] = useState("")
  
  // Geographic targeting search state
  const [selectedLocations, setSelectedLocations] = useState<string[]>(["المملكة العربية السعودية"])
  const [locationQuery, setLocationQuery] = useState("")
  const [locationResults, setLocationResults] = useState<{ id: string; name: string; type: string }[]>([])
  const [searchingLocations, setSearchingLocations] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)

  // Proximity Map/Radius States
  const [targetMode, setTargetMode] = useState<"search" | "radius">("search")
  const [mapPin, setMapPin] = useState<{ x: number; y: number } | null>(null)
  const [mapRadius, setMapRadius] = useState(5) // in km
  const [customLocationName, setCustomLocationName] = useState("")

  // Real Leaflet Maps States & Hooks
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerInstanceRef = useRef<any>(null)
  const circleInstanceRef = useRef<any>(null)

  // Dynamically load Leaflet CSS & JS from CDN
  useEffect(() => {
    if (targetMode !== "radius") return

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
  }, [targetMode])

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || targetMode !== "radius") return

    const L = (window as any).L
    if (!L) return

    // Setup custom absolute URLs for marker assets to bypass Webpack path issues
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
    
    // Clean up previous map instance if any
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

    // Synchronize states
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
  }, [leafletLoaded, targetMode])

  // Sync radius slider modifications to active Leaflet Circle
  useEffect(() => {
    if (circleInstanceRef.current) {
      circleInstanceRef.current.setRadius(mapRadius * 1000)
    }
  }, [mapRadius])

  // Keyword states
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  const [loadingKeywords, setLoadingKeywords] = useState(false)
  const [suggestedKeywords, setSuggestedKeywords] = useState<SuggestedKeyword[]>([])
  const [showKeywordDrawer, setShowKeywordDrawer] = useState(false)

  // Ad Copy states
  const [headlines, setHeadlines] = useState<string[]>(["", "", ""])
  const [descriptions, setDescriptions] = useState<string[]>(["", ""])
  const [finalUrl, setFinalUrl] = useState("")
  const [loadingAdCopy, setLoadingAdCopy] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile")

  // Dynamic campaign type inputs (YouTube Video & Shopping)
  const [videoUrl, setVideoUrl] = useState("")
  const [videoButtonText, setVideoButtonText] = useState("تسوق الآن")
  const [skipTimer, setSkipTimer] = useState(5)
  const [productImage, setProductImage] = useState("")
  const [productPrice, setProductPrice] = useState(250)
  const [productCurrency, setProductCurrency] = useState("SAR")
  const [productTitle, setProductTitle] = useState("")

  // YouTube skip ad countdown timer
  useEffect(() => {
    if (step === 3 && selectedType === "video") {
      setSkipTimer(5)
      const interval = setInterval(() => {
        setSkipTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [step, selectedType])

  // Final launch states
  const [launching, setLaunching] = useState(false)
  const [launched, setLaunched] = useState(false)
  const [error, setError] = useState("")

  const form = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      name: "",
      goal: "",
      description: "",
      budget: 500,
      currency: "SAR",
      bidStrategy: "",
      startDate: new Date().toISOString().split("T")[0],
    },
  })

  const formValues = form.watch()

  // Location search effect
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

  const addLocation = (locName: string) => {
    if (!selectedLocations.includes(locName)) {
      setSelectedLocations(prev => [...prev, locName])
    }
    setLocationQuery("")
    setLocationResults([])
    setShowLocationDropdown(false)
  }

  const removeLocation = (locName: string) => {
    setSelectedLocations(prev => prev.filter(l => l !== locName))
  }

  const addKeyword = (kw: string) => {
    const trimmed = kw.trim()
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords(prev => [...prev, trimmed])
    }
    setKeywordInput("")
  }

  const removeKeyword = (kw: string) => setKeywords(prev => prev.filter(k => k !== kw))

  // AI Keyword Suggestion fetcher
  const fetchAISuggestions = async () => {
    setLoadingKeywords(true)
    setShowKeywordDrawer(true)
    try {
      const res = await fetch("/api/keywords/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName: formValues.name,
          goal: formValues.goal,
          description: formValues.description
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
          campaignName: formValues.name,
          goal: formValues.goal,
          description: formValues.description
        })
      })
      if (res.ok) {
        const data: SuggestedCopy = await res.json()
        if (data.headlines && data.headlines.length >= 3) {
          setHeadlines([data.headlines[0], data.headlines[1], data.headlines[2]])
        }
        if (data.descriptions && data.descriptions.length >= 2) {
          setDescriptions([data.descriptions[0], data.descriptions[1]])
        }
        if (!finalUrl) {
          setFinalUrl("https://mybusiness.sa")
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAdCopy(false)
    }
  }

  const handleLaunch = async () => {
    setLaunching(true)
    setError("")
    try {
      let finalHeadlines = headlines.filter(h => h.trim() !== "")
      let finalDescriptions = descriptions.filter(d => d.trim() !== "")
      let activeFinalUrl = finalUrl

      if (selectedType === "video") {
        finalHeadlines = [videoUrl, videoButtonText]
        finalDescriptions = ["YouTube Video Ad"]
        activeFinalUrl = finalUrl // link to action destination
      } else if (selectedType === "shopping") {
        finalHeadlines = [productImage]
        finalDescriptions = [productPrice.toString(), productCurrency, productTitle]
        activeFinalUrl = finalUrl // product page link
      }

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formValues.name,
          budget: formValues.budget,
          type: selectedType,
          startDate: formValues.startDate,
          bidStrategy: formValues.bidStrategy,
          goal: formValues.goal,
          locations: selectedLocations,
          keywords: keywords,
          headlines: finalHeadlines,
          descriptions: finalDescriptions,
          finalUrl: activeFinalUrl
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create campaign")
      }

      setLaunched(true)
      setTimeout(() => router.push("/campaigns"), 2000)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "حدث خطأ أثناء إطلاق الحملة")
    } finally {
      setLaunching(false)
    }
  }

  const canNext = () => {
    if (step === 0) return !!selectedType
    if (step === 1) return form.formState.isValid
    if (step === 2) return keywords.length > 0
    if (step === 3) {
      if (selectedType === "video") {
        return videoUrl.trim().startsWith("http") && finalUrl.trim().startsWith("http")
      }
      if (selectedType === "shopping") {
        return productImage.trim().length > 0 && productPrice > 0 && productTitle.trim().length > 0 && finalUrl.trim().startsWith("http")
      }
      return (
        headlines.every(h => h.trim().length > 0 && h.trim().length <= 30) &&
        descriptions.every(d => d.trim().length > 0 && d.trim().length <= 90) &&
        finalUrl.trim().startsWith("http")
      )
    }
    return true
  }

  const nextStep = async () => {
    if (step === 1) {
      const ok = await form.trigger()
      if (!ok) return
    }
    if (step === 2) {
      if (selectedType === "shopping" && !productTitle) {
        setProductTitle(formValues.name)
      }
    }
    if (step < 4) setStep(s => s + 1)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-cairo text-foreground">إنشاء حملة إعلانية جديدة</h1>
        <p className="text-sm font-tajawal text-muted-foreground mt-1">اتبع الخطوات لإطلاق حملتك على Google Ads</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold font-inter transition-all duration-300",
                i < step ? "bg-primary text-white" : i === step ? "bg-primary text-white ring-4 ring-primary/20" : "bg-muted text-muted-foreground"
              )}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn(
                "text-[10px] font-tajawal text-center whitespace-nowrap",
                i === step ? "text-primary font-semibold" : "text-muted-foreground"
              )}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-0.5 flex-1 max-w-[40px] mb-4 transition-colors", i < step ? "bg-primary" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-card border border-border rounded-2xl p-6 min-h-[400px]">

        {/* STEP 0: Campaign Type */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold font-cairo text-foreground mb-1">اختر نوع الحملة</h2>
              <p className="text-sm font-tajawal text-muted-foreground">نوع الحملة يحدد مكان ظهور إعلاناتك</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {campaignTypes.map((type) => {
                const Icon = type.icon
                const isSelected = selectedType === type.id
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={cn(
                      "p-5 rounded-xl border-2 text-right transition-all duration-200 hover:shadow-md group",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all",
                      isSelected ? "bg-primary text-white" : cn(type.bg, type.color)
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="font-bold font-cairo text-foreground mb-1">{type.label}</div>
                    <div className="text-xs font-tajawal text-muted-foreground leading-relaxed">{type.desc}</div>
                    {isSelected && (
                      <div className="flex items-center gap-1.5 mt-2 text-primary text-xs font-semibold font-tajawal">
                        <Check className="w-3.5 h-3.5" /> تم الاختيار
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 1: Campaign Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold font-cairo text-foreground mb-1">تفاصيل الحملة</h2>
              <p className="text-sm font-tajawal text-muted-foreground">أدخل معلومات حملتك الإعلانية</p>
            </div>
            <div className="space-y-5">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-semibold font-tajawal text-foreground mb-1.5">اسم الحملة *</label>
                <input
                  {...form.register("name")}
                  placeholder="مثال: حملة الصيف ٢٠٢٤"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500 font-tajawal mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Goal */}
              <div>
                <label className="block text-sm font-semibold font-tajawal text-foreground mb-1.5">هدف الحملة *</label>
                <div className="grid grid-cols-2 gap-2">
                  {goalTypes.map(goal => {
                    const GoalIcon = goal.icon
                    const isSelected = form.watch("goal") === goal.id
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => form.setValue("goal", goal.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-right",
                          isSelected ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        <GoalIcon className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-tajawal font-medium">{goal.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Campaign Description (Context for AI) */}
              <div>
                <label className="block text-sm font-semibold font-tajawal text-foreground mb-1.5">وصف مختصر لنشاطك أو منتجك (لتحليل الـ AI) *</label>
                <textarea
                  {...form.register("description")}
                  placeholder="مثال: متجر عطور فرنسية فاخرة مع شحن وتوصيل لكافة مدن المملكة."
                  rows={2.5}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none transition"
                  required
                />
              </div>

              {/* Budget */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold font-tajawal text-foreground mb-1.5">الميزانية اليومية *</label>
                  <input
                    type="number"
                    {...form.register("budget", { valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-inter text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {form.formState.errors.budget && (
                    <p className="text-xs text-red-500 font-tajawal mt-1">{form.formState.errors.budget.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold font-tajawal text-foreground mb-1.5">العملة</label>
                  <select
                    {...form.register("currency")}
                    className="w-full px-3 py-3 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {currencies.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {/* AI Budget Tip */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold font-tajawal text-primary">نصيحة الذكاء الاصطناعي</p>
                  <p className="text-xs font-tajawal text-muted-foreground mt-0.5">
                    بناءً على هدفك المختار، ميزانية <span className="font-bold text-foreground font-inter">{form.watch("budget")} {form.watch("currency")}</span> يومياً تتيح لك
                    الوصول لـ <span className="font-bold text-foreground">~{Math.round(form.watch("budget") / 1.8).toLocaleString()}</span> نقرة متوقعة يومياً في سوقك المستهدف.
                  </p>
                </div>
              </div>

              {/* Bid Strategy + Start Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold font-tajawal text-foreground mb-1.5">استراتيجية المزايدة *</label>
                  <select
                    {...form.register("bidStrategy")}
                    className="w-full px-3 py-3 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">اختر استراتيجية...</option>
                    {bidStrategies.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold font-tajawal text-foreground mb-1.5">تاريخ البدء *</label>
                  <input
                    type="date"
                    {...form.register("startDate")}
                    className="w-full px-3 py-3 rounded-xl bg-background border border-border text-sm font-inter text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Audience & Keywords */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold font-cairo text-foreground mb-1">الجمهور المستهدف والكلمات المفتاحية</h2>
              <p className="text-sm font-tajawal text-muted-foreground">حدد جمهورك واضف كلمات مفتاحية بمساعدة الذكاء الاصطناعي</p>
            </div>

            {/* Location Targeting Mode Selector */}
            <div className="space-y-4">
              <div className="flex bg-muted/60 p-1 rounded-xl max-w-[320px]">
                <button
                  type="button"
                  onClick={() => setTargetMode("search")}
                  className={cn(
                    "flex-1 text-center py-2 rounded-lg text-xs font-bold font-tajawal transition-all",
                    targetMode === "search" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  البحث بالاسم (دولة/مدينة)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode("radius")}
                  className={cn(
                    "flex-1 text-center py-2 rounded-lg text-xs font-bold font-tajawal transition-all",
                    targetMode === "radius" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  استهداف نطاق دائري (Radius Map)
                </button>
              </div>

              {/* Mode 1: Geographic Search */}
              {targetMode === "search" && (
                <div className="relative">
                  <label className="block text-sm font-semibold font-tajawal text-foreground mb-1.5">الاستهداف الجغرافي بالاسم</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute right-3.5 top-3 w-4 h-4 text-muted-foreground" />
                      <input
                        value={locationQuery}
                        onChange={e => {
                          setLocationQuery(e.target.value)
                          setShowLocationDropdown(true)
                        }}
                        onFocus={() => setShowLocationDropdown(true)}
                        placeholder="ابحث عن دولة، مدينة أو منطقة (مثال: دبي، الرياض...)"
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  {/* Location Dropdown */}
                  {showLocationDropdown && (locationQuery || searchingLocations) && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                      {searchingLocations ? (
                        <div className="p-4 text-center text-sm font-tajawal text-muted-foreground flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" /> جاري البحث عن المواقع...
                        </div>
                      ) : locationResults.length === 0 ? (
                        <div className="p-4 text-center text-sm font-tajawal text-muted-foreground">لا توجد نتائج مطابقة</div>
                      ) : (
                        locationResults.map(loc => (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => addLocation(loc.name)}
                            className="w-full px-4 py-3 text-right hover:bg-muted/50 transition-colors flex items-center justify-between border-b border-border/40 last:border-b-0"
                          >
                            <span className="font-semibold text-sm font-tajawal text-foreground">{loc.name}</span>
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-tajawal">{loc.type}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Radius Targeting (Leaflet Map) */}
              {targetMode === "radius" && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="block text-sm font-semibold font-tajawal text-foreground">
                      حدد نقطة على الخريطة وحدد نطاق التغطية (بالكيلومتر)
                    </label>
                    
                    {/* Leaflet Interactive Map Container */}
                    <div 
                      ref={mapContainerRef}
                      className="w-full h-[220px] rounded-2xl overflow-hidden border border-border bg-slate-950 flex items-center justify-center relative z-0"
                    >
                      {!leafletLoaded && (
                        <div className="flex flex-col items-center justify-center text-center p-6 space-y-2 font-tajawal text-muted-foreground text-xs">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <span>جاري تحميل الخريطة التفاعلية...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Radius parameters config */}
                  {mapCoordinates && (
                    <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold font-tajawal text-muted-foreground mb-1">اسم الموقع أو العنوان المستهدف</label>
                          <input 
                            value={customLocationName}
                            onChange={(e) => setCustomLocationName(e.target.value)}
                            placeholder="مثال: محيط قرية ميت غمر"
                            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-tajawal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold font-tajawal text-muted-foreground mb-1">قطر التغطية: <span className="font-bold text-primary font-inter">{mapRadius} كم</span></label>
                          <input 
                            type="range"
                            min="1"
                            max="50"
                            value={mapRadius}
                            onChange={(e) => setMapRadius(Number(e.target.value))}
                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary mt-2.5"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (mapCoordinates) {
                            const val = `${customLocationName || 'نطاق دائري'} (${mapRadius} كم حول ${mapCoordinates.lat.toFixed(4)}، ${mapCoordinates.lng.toFixed(4)})`
                            if (!selectedLocations.includes(val)) {
                              setSelectedLocations(prev => [...prev, val])
                            }
                          }
                          setMapCoordinates(null)
                          setCustomLocationName("")
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-white text-xs font-bold font-tajawal hover:bg-primary/90 transition-all shadow shadow-primary/20"
                      >
                        <Plus className="w-3.5 h-3.5" /> إضافة هذا النطاق للاستهداف
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Location Badges */}
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedLocations.map(loc => (
                  <div
                    key={loc}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold font-tajawal border border-primary/20"
                  >
                    <Globe className="w-3 h-3 text-primary/70" />
                    {loc}
                    <button type="button" onClick={() => removeLocation(loc)} className="hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div className="border-t border-border/50 pt-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold font-tajawal text-foreground">الكلمات المفتاحية</label>
                <button
                  type="button"
                  onClick={fetchAISuggestions}
                  disabled={loadingKeywords}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold font-tajawal hover:bg-primary/20 transition-colors disabled:opacity-60"
                >
                  {loadingKeywords ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {loadingKeywords ? "جاري جلب أفكار الكلمات..." : "مخطط الكلمات بالذكاء الاصطناعي"}
                </button>
              </div>

              {/* AI Suggested Keywords Drawer/Panel */}
              {showKeywordDrawer && (
                <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold font-cairo text-primary flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> أفكار كلمات مفتاحية مقترحة لحملتك:
                    </h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          suggestedKeywords.forEach(k => {
                            if (!keywords.includes(k.text)) setKeywords(prev => [...prev, k.text])
                          })
                        }}
                        className="text-[10px] font-tajawal text-primary hover:underline font-bold"
                      >
                        إضافة الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowKeywordDrawer(false)}
                        className="text-[10px] font-tajawal text-muted-foreground hover:text-foreground font-bold"
                      >
                        إغلاق
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {loadingKeywords ? (
                      <div className="col-span-2 py-6 text-center text-xs text-muted-foreground">جاري تحميل الاقتراحات...</div>
                    ) : (
                      suggestedKeywords.map(k => {
                        const added = keywords.includes(k.text)
                        return (
                          <div key={k.text} className="flex items-center justify-between p-2 bg-card border border-border/60 rounded-lg text-xs">
                            <span className="font-medium text-foreground font-tajawal">{k.text}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-inter text-muted-foreground">{k.volume.toLocaleString()} بحث/شهر</span>
                              <span className={cn(
                                "text-[9px] font-tajawal px-2 py-0.5 rounded-full",
                                k.competition === "مرتفعة" ? "bg-red-500/10 text-red-500" :
                                k.competition === "متوسطة" ? "bg-amber-500/10 text-amber-500" :
                                "bg-emerald-500/10 text-emerald-500"
                              )}>{k.competition}</span>
                              <button
                                type="button"
                                onClick={() => addKeyword(k.text)}
                                disabled={added}
                                className={cn(
                                  "p-1 rounded-md transition-colors",
                                  added ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary hover:bg-primary/20"
                                )}
                              >
                                {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mb-3">
                <input
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKeyword(keywordInput) } }}
                  placeholder="أدخل كلمة مفتاحية واضغط Enter..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={() => addKeyword(keywordInput)}
                  className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-tajawal font-semibold hover:bg-primary/90 transition-colors"
                >
                  إضافة
                </button>
              </div>

              {keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 bg-muted/30 rounded-xl border border-border">
                  {keywords.map(kw => (
                    <div
                      key={kw}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium font-tajawal border border-primary/20"
                    >
                      <Tag className="w-3 h-3" />
                      {kw}
                      <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[60px] bg-muted/30 rounded-xl border border-dashed border-border text-sm font-tajawal text-muted-foreground">
                  أضف كلمات مفتاحية يدوياً أو استخدم اقتراحات الذكاء الاصطناعي
                </div>
              )}
              <p className="text-xs text-muted-foreground font-tajawal mt-1.5">{keywords.length} كلمة مفتاحية مضافة</p>
            </div>
          </div>
        )}

        {/* STEP 3: Ad Copy Headlines & Descriptions */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold font-cairo text-foreground mb-1">
                  {selectedType === "video" ? "تصميم إعلان الفيديو" : selectedType === "shopping" ? "تفاصيل وصورة المنتج" : "نصوص الإعلان (Ad Copy)"}
                </h2>
                <p className="text-sm font-tajawal text-muted-foreground">
                  {selectedType === "video" ? "أدخل رابط فيديو يوتيوب وتفاصيل الإعلان الترويجي" : selectedType === "shopping" ? "ارفع صورة منتجك وحدد سعره وتفاصيله لعرضه في التسوق" : "اكتب العناوين والأوصاف الإعلانية التي ستظهر للعملاء"}
                </p>
              </div>
              {selectedType !== "video" && selectedType !== "shopping" && (
                <button
                  type="button"
                  onClick={generateAIAdCopy}
                  disabled={loadingAdCopy}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold font-tajawal hover:bg-primary/20 transition-colors disabled:opacity-75"
                >
                  {loadingAdCopy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {loadingAdCopy ? "جاري توليد النصوص..." : "توليد النصوص بالذكاء الاصطناعي"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Inputs */}
              <div className="space-y-4">
                {/* 1. YOUTUBE VIDEO TYPE INPUTS */}
                {selectedType === "video" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold font-tajawal text-foreground mb-1">رابط فيديو YouTube *</label>
                      <input
                        value={videoUrl}
                        onChange={e => setVideoUrl(e.target.value)}
                        placeholder="مثال: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-inter text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <p className="text-[10px] text-muted-foreground font-tajawal mt-1">الصق رابط فيديو YouTube الترويجي لحملتك الإعلانية.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold font-tajawal text-foreground mb-1">رابط الهبوط الانتقالي (Final URL) *</label>
                      <input
                        value={finalUrl}
                        onChange={e => setFinalUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-inter text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold font-tajawal text-foreground mb-1">نص زر اتخاذ الإجراء (CTA Button) *</label>
                      <select
                        value={videoButtonText}
                        onChange={e => setVideoButtonText(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {["تسوق الآن", "اشترك الآن", "تعرف على المزيد", "احجز الآن", "تواصل معنا", "تنزيل التطبيق"].map(txt => (
                          <option key={txt} value={txt}>{txt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* 2. SHOPPING TYPE INPUTS */}
                {selectedType === "shopping" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold font-tajawal text-foreground mb-1">اسم المنتج *</label>
                      <input
                        value={productTitle}
                        onChange={e => setProductTitle(e.target.value)}
                        placeholder="مثال: عطر مسك العود الأصلي"
                        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold font-tajawal text-foreground mb-1">سعر المنتج *</label>
                        <input
                          type="number"
                          value={productPrice}
                          onChange={e => setProductPrice(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-inter text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold font-tajawal text-foreground mb-1">العملة</label>
                        <select
                          value={productCurrency}
                          onChange={e => setProductCurrency(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-tajawal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold font-tajawal text-foreground mb-1">رابط صفحة المنتج (Final URL) *</label>
                      <input
                        value={finalUrl}
                        onChange={e => setFinalUrl(e.target.value)}
                        placeholder="https://example.com/product"
                        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-inter text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold font-tajawal text-foreground mb-1">صورة المنتج *</label>
                      <div className="flex items-center gap-4">
                        {productImage ? (
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border shrink-0 bg-muted">
                            <img src={productImage} alt="Product Image" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setProductImage("")}
                              className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/30 transition">
                            <ShoppingBag className="w-6 h-6 text-muted-foreground mb-1" />
                            <span className="text-xs font-tajawal text-muted-foreground">اضغط لرفع صورة المنتج</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  const reader = new FileReader()
                                  reader.onloadend = () => setProductImage(reader.result as string)
                                  reader.readAsDataURL(file)
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. DEFAULT TEXT (SEARCH/DISPLAY) INPUTS */}
                {selectedType !== "video" && selectedType !== "shopping" && (
                  <div className="space-y-4">
                    {/* Final URL */}
                    <div>
                      <label className="block text-sm font-semibold font-tajawal text-foreground mb-1">رابط الهبوط (Final URL) *</label>
                      <input
                        value={finalUrl}
                        onChange={e => setFinalUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-inter text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    {/* Headlines */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold font-tajawal text-foreground">العناوين الرئيسية (حد أقصى 30 حرف لكل عنوان) *</label>
                      {headlines.map((headline, idx) => (
                        <div key={idx} className="relative">
                          <input
                            value={headline}
                            onChange={e => {
                              const val = e.target.value
                              setHeadlines(prev => {
                                const clone = [...prev]
                                clone[idx] = val
                                return clone
                              })
                            }}
                            placeholder={`العنوان الرئيسي ${idx + 1}...`}
                            className={cn(
                              "w-full pl-12 pr-4 py-2.5 rounded-xl bg-background border text-sm font-tajawal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40",
                              headline.length > 30 ? "border-red-500" : "border-border"
                            )}
                          />
                          <span className={cn(
                            "absolute left-3 top-3 text-[10px] font-inter font-bold",
                            headline.length > 30 ? "text-red-500" : "text-muted-foreground"
                          )}>
                            {headline.length}/30
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Descriptions */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold font-tajawal text-foreground">الأوصاف (حد أقصى 90 حرف لكل وصف) *</label>
                      {descriptions.map((desc, idx) => (
                        <div key={idx} className="relative">
                          <textarea
                            value={desc}
                            rows={2}
                            onChange={e => {
                              const val = e.target.value
                              setDescriptions(prev => {
                                const clone = [...prev]
                                clone[idx] = val
                                return clone
                              })
                            }}
                            placeholder={`الوصف الإعلاني ${idx + 1}...`}
                            className={cn(
                              "w-full pl-12 pr-4 py-2.5 rounded-xl bg-background border text-sm font-tajawal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none",
                              desc.length > 90 ? "border-red-500" : "border-border"
                            )}
                          />
                          <span className={cn(
                            "absolute left-3 bottom-2 text-[10px] font-inter font-bold",
                            desc.length > 90 ? "text-red-500" : "text-muted-foreground"
                          )}>
                            {desc.length}/90
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Live Preview Column */}
              <div className="bg-muted/30 border border-border rounded-2xl p-5 space-y-4 flex flex-col justify-between min-h-[350px]">
                {/* 1. YOUTUBE VIDEO AD LIVE PREVIEW */}
                {selectedType === "video" ? (
                  <div className="space-y-3 h-full flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold font-cairo text-foreground flex items-center gap-1.5 border-b border-border/50 pb-2 mb-3">
                        <Video className="w-3.5 h-3.5 text-red-500" /> معاينة الإعلان على YouTube
                      </span>

                      {/* Video Player Box */}
                      <div className="w-full aspect-video rounded-xl overflow-hidden bg-black border border-border relative flex items-center justify-center shadow-lg">
                        {(() => {
                          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                          const match = videoUrl.match(regExp);
                          const videoId = (match && match[2].length === 11) ? match[2] : null;

                          if (videoId) {
                            return (
                              <iframe
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="YouTube Video Preview"
                              />
                            )
                          }

                          return (
                            <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 text-muted-foreground">
                              <Video className="w-10 h-10 text-muted-foreground/50 animate-pulse" />
                              <p className="text-xs font-tajawal max-w-[200px]">يرجى إدخال رابط فيديو YouTube صالح لعرض المعاينة المباشرة.</p>
                            </div>
                          )
                        })()}

                        {/* YouTube Player Controls Overlay (Fake) */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex flex-col gap-2 pointer-events-none">
                          <div className="flex items-center justify-between text-[11px] text-white font-tajawal">
                            {/* Ad info / sponsored */}
                            <div className="flex items-center gap-2">
                              <span className="bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold text-[9px]">Sponsored</span>
                              <span className="truncate max-w-[120px] font-medium">{finalUrl ? finalUrl.replace(/^https?:\/\//, "") : "mybusiness.com"}</span>
                            </div>

                            {/* Skip ad button (interactive) */}
                            <div className="pointer-events-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  if (skipTimer === 0) setSkipTimer(5)
                                }}
                                className="bg-black/75 hover:bg-black text-white px-3 py-1.5 rounded-lg border border-white/20 text-xs font-bold font-tajawal flex items-center gap-1 transition-all"
                              >
                                {skipTimer > 0 ? (
                                  <span>تخطي في {skipTimer}...</span>
                                ) : (
                                  <span className="flex items-center gap-1">تخطي الإعلان ⏩</span>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-card border border-border rounded-xl flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold font-inter text-sm">YT</div>
                        <div>
                          <p className="text-xs font-bold text-foreground font-tajawal">شكل إعلان يوتيوب المدمج</p>
                          <p className="text-[10px] text-muted-foreground font-tajawal">يظهر للمستخدمين أثناء مشاهدة الفيديوهات</p>
                        </div>
                      </div>
                      <a
                        href={finalUrl.startsWith("http") ? finalUrl : "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold font-tajawal hover:bg-primary/95 transition-all shadow shadow-primary/10"
                      >
                        {videoButtonText}
                      </a>
                    </div>
                  </div>
                ) : selectedType === "shopping" ? (
                  /* 2. GOOGLE SHOPPING AD LIVE PREVIEW */
                  <div className="space-y-3 h-full flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold font-cairo text-foreground flex items-center gap-1.5 border-b border-border/50 pb-2 mb-4">
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-500" /> معاينة كارت التسوق (Shopping Card)
                      </span>

                      {/* Google Shopping ad card container */}
                      <div className="bg-card border border-border hover:border-primary/20 rounded-2xl overflow-hidden max-w-[210px] mx-auto shadow-md transition-all duration-200">
                        {/* Sponsored label */}
                        <div className="p-2 pb-0 flex justify-between items-center text-[10px] text-muted-foreground font-tajawal">
                          <span>إعلان • Sponsored</span>
                        </div>

                        {/* Image */}
                        <div className="w-full aspect-square bg-muted/30 flex items-center justify-center overflow-hidden border-b border-border/40 relative">
                          {productImage ? (
                            <img src={productImage} alt="Product ad" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
                              <ShoppingBag className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
                              <span className="text-[10px] font-tajawal mt-1">رفع صورة لعرضها</span>
                            </div>
                          )}
                          <span className="absolute bottom-2 right-2 bg-emerald-500 text-white font-tajawal font-bold text-[9px] px-2 py-0.5 rounded-full shadow-sm">
                            شحن مجاني
                          </span>
                        </div>

                        {/* Details */}
                        <div className="p-3 space-y-1 text-right">
                          <h4 className="text-xs font-bold font-tajawal text-foreground leading-snug truncate">
                            {productTitle || "عنوان المنتج الترويجي يظهر هنا"}
                          </h4>
                          
                          {/* Rating */}
                          <div className="flex items-center justify-start gap-1 text-[10px] text-amber-500">
                            <span>⭐⭐⭐⭐⭐</span>
                            <span className="text-muted-foreground text-[9px] font-inter">(٩٤)</span>
                          </div>

                          <div className="flex items-baseline justify-between mt-1.5 pt-1.5 border-t border-border/40">
                            <span className="text-xs font-tajawal text-muted-foreground font-semibold truncate max-w-[100px]">
                              {finalUrl ? finalUrl.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "mybusiness.sa"}
                            </span>
                            <span className="text-sm font-bold font-inter text-emerald-500">
                              {productPrice.toLocaleString()} {productCurrency}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground font-tajawal leading-relaxed bg-muted/40 p-2.5 rounded-xl border border-border/40 text-center">
                      💡 تظهر إعلانات التسوق مباشرة في شريط بحث جوجل وتبويب التسوق لجذب العملاء الجاهزين للشراء فوراً.
                    </div>
                  </div>
                ) : (
                  /* 3. DEFAULT TEXT SEARCH PREVIEW */
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                        <span className="text-xs font-bold font-cairo text-foreground flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-primary" /> معاينة الإعلان على محرك البحث
                        </span>
                        <div className="flex bg-muted rounded-lg p-0.5">
                          <button
                            onClick={() => setPreviewDevice("mobile")}
                            className={cn("text-[10px] px-2.5 py-1 rounded-md font-tajawal transition-all", previewDevice === "mobile" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground")}
                          >
                            جوال
                          </button>
                          <button
                            onClick={() => setPreviewDevice("desktop")}
                            className={cn("text-[10px] px-2.5 py-1 rounded-md font-tajawal transition-all", previewDevice === "desktop" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground")}
                          >
                            كمبيوتر
                          </button>
                        </div>
                      </div>

                      {/* Google Ad Simulator UI */}
                      <div className={cn(
                        "bg-card border border-border p-4 rounded-xl space-y-1.5 shadow-sm text-right",
                        previewDevice === "mobile" ? "max-w-[320px] mx-auto" : "w-full"
                      )}>
                        {/* Header line */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-inter">
                          <span className="font-bold text-[10px] bg-muted px-1 py-0.5 rounded border border-border">إعلان sponsored</span>
                          <span className="truncate max-w-[200px]">{finalUrl || "https://mybusiness.sa"}</span>
                        </div>

                        {/* Headline */}
                        <h3 className="text-blue-700 font-medium font-tajawal text-sm hover:underline leading-snug cursor-pointer">
                          {headlines.filter(h => h.trim() !== "").join(" | ") || "عنوانك الإعلاني المميز يظهر هنا"}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-foreground/80 font-tajawal leading-relaxed">
                          {descriptions.filter(d => d.trim() !== "").join(" ") || "أوصاف الإعلان ونصوصه الجذابة والترويجية تظهر في هذا المكان."}
                        </p>
                      </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground font-tajawal leading-relaxed">
                      💡 *نصيحة:* تعبئة 3 عناوين رئيسية ووصفين إعلانيين تضمن حصول إعلانك على أعلى تقييم أداء (Ad Strength) لدى خوارزميات جوجل.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Launch */}
        {step === 4 && (
          <div className="space-y-6">
            {!launched ? (
              <>
                <div>
                  <h2 className="text-lg font-bold font-cairo text-foreground mb-1">مراجعة وإطلاق الحملة</h2>
                  <p className="text-sm font-tajawal text-muted-foreground">تحقق من تفاصيل حملتك قبل الإطلاق</p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "نوع الحملة", value: campaignTypes.find(t => t.id === selectedType)?.label || selectedType },
                    { label: "اسم الحملة", value: formValues.name },
                    { label: "هدف الحملة", value: goalTypes.find(g => g.id === formValues.goal)?.label || formValues.goal },
                    { label: "الميزانية اليومية", value: `${formValues.budget} ${formValues.currency}` },
                    { label: "استراتيجية المزايدة", value: bidStrategies.find(b => b.id === formValues.bidStrategy)?.label || formValues.bidStrategy },
                    { label: "تاريخ البدء", value: formValues.startDate },
                    { label: "المناطق المستهدفة", value: selectedLocations.join("، ") },
                    { label: "الكلمات المفتاحية", value: `${keywords.length} كلمة` },
                    ...(selectedType === "video" ? [
                      { label: "رابط فيديو YouTube", value: videoUrl },
                      { label: "رابط الانتقال الموجه", value: finalUrl },
                      { label: "نص زر الإجراء", value: videoButtonText },
                    ] : selectedType === "shopping" ? [
                      { label: "اسم المنتج", value: productTitle },
                      { label: "السعر", value: `${productPrice} ${productCurrency}` },
                      { label: "صورة المنتج", value: productImage.startsWith("data:") ? "تم رفع صورة بنجاح" : productImage },
                      { label: "رابط صفحة المنتج", value: finalUrl },
                    ] : [
                      { label: "روابط الإعلان", value: finalUrl },
                      { label: "العناوين الرئيسية", value: headlines.filter(h => h.trim() !== "").join(" | ") },
                      { label: "الأوصاف الإعلانية", value: descriptions.filter(d => d.trim() !== "").join(" | ") },
                    ])
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2.5 border-b border-border/50">
                      <span className="text-sm font-semibold font-tajawal text-foreground">{label}</span>
                      <span className="text-sm font-tajawal text-muted-foreground text-left max-w-[240px] truncate">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Estimate */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <h3 className="text-sm font-bold font-cairo text-primary mb-3">التقدير المتوقع شهرياً</h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: "النقرات المتوقعة", value: Math.round(formValues.budget / 1.8 * 30).toLocaleString() },
                      { label: "مرات الظهور", value: Math.round(formValues.budget / 1.8 * 30 * 15).toLocaleString() },
                      { label: "التحويلات المتوقعة", value: Math.round(formValues.budget / 1.8 * 30 * 0.03).toLocaleString() },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div className="text-lg font-bold font-inter text-foreground">{value}</div>
                        <div className="text-xs font-tajawal text-muted-foreground">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-tajawal">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleLaunch}
                  disabled={launching}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-primary text-white font-bold font-cairo text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-70"
                >
                  {launching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جاري إطلاق الحملة...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      <span>إطلاق الحملة الآن</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Check className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold font-cairo text-foreground">تم إطلاق الحملة بنجاح! 🎉</h2>
                <p className="text-sm font-tajawal text-muted-foreground">سيتم نقلك إلى صفحة الحملات خلال ثوانٍ...</p>
                <div className="w-full max-w-xs bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-pulse w-full" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {!launched && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => step > 0 && setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold font-tajawal text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </button>

          {step < 4 ? (
            <button
              onClick={nextStep}
              disabled={!canNext()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold font-tajawal hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              التالي
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
