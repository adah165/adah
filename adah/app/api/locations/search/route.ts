import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { getWorkspaceIdForUser } from "@/lib/workspace"
import { GoogleAdsApi } from "google-ads-api"

// Mapping of common Arabic queries to English terms to facilitate GAQL searches
const arabicToEnglishMap: Record<string, string> = {
  "السعودية": "Saudi Arabia",
  "المملكة العربية السعودية": "Saudi Arabia",
  "الرياض": "Riyadh",
  "جدة": "Jeddah",
  "الدمام": "Dammam",
  "مكة": "Mecca",
  "مكه": "Mecca",
  "المدينة": "Medina",
  "المدينة المنورة": "Medina",
  "الخبر": "Khobar",
  "الجبيل": "Jubail",
  "القصيم": "Qassim",
  "بريدة": "Buraidah",
  "تبوك": "Tabuk",
  "أبها": "Abha",
  "الطائف": "Taif",
  "حائل": "Hail",
  "جازان": "Jazan",
  "نجران": "Najran",
  "الباحة": "Baha",
  "عرعر": "Arar",
  "سكاكا": "Sakaka",
  "الأحساء": "Al Ahsa",
  "القطيف": "Qatif",
  "ينبع": "Yanbu",
  "الإمارات": "United Arab Emirates",
  "دبي": "Dubai",
  "أبوظبي": "Abu Dhabi",
  "أبو ظبي": "Abu Dhabi",
  "الشارقة": "Sharjah",
  "عجمان": "Ajman",
  "رأس الخيمة": "Ras Al Khaimah",
  "الفجيرة": "Fujairah",
  "أم القيوين": "Umm Al Quwain",
  "مصر": "Egypt",
  "القاهرة": "Cairo",
  "الإسكندرية": "Alexandria",
  "الجيزة": "Giza",
  "شبرا الخيمة": "Shubra El-Kheima",
  "بورسعيد": "Port Said",
  "السويس": "Suez",
  "المنصورة": "Mansoura",
  "طنطا": "Tanta",
  "أسيوط": "Asyut",
  "الفيوم": "Fayoum",
  "الزقازيق": "Zagazig",
  "الإسماعيلية": "Ismailia",
  "أسوان": "Aswan",
  "الكويت": "Kuwait",
  "قطر": "Qatar",
  "الدوحة": "Doha",
  "البحرين": "Bahrain",
  "المنامة": "Manama",
  "عمان": "Oman",
  "مسقط": "Muscat",
  "الأردن": "Jordan",
  "العراق": "Iraq",
  "بغداد": "Baghdad",
  "البصرة": "Basra",
  "الموصل": "Mosul",
  "أربيل": "Erbil",
  "لبنان": "Lebanon",
  "بيروت": "Beirut",
  "طرابلس": "Tripoli",
}

// Fallback high-fidelity local database representing Middle Eastern targets
const fallbackDb = [
  { id: "1", name: "المملكة العربية السعودية", type: "دولة" },
  { id: "2", name: "الرياض، السعودية", type: "مدينة" },
  { id: "3", name: "جدة، السعودية", type: "مدينة" },
  { id: "4", name: "المنطقة الشرقية، السعودية", type: "منطقة" },
  { id: "5", name: "الإمارات العربية المتحدة", type: "دولة" },
  { id: "6", name: "دبي، الإمارات", type: "مدينة" },
  { id: "7", name: "أبوظبي، الإمارات", type: "مدينة" },
  { id: "8", name: "مصر", type: "دولة" },
  { id: "9", name: "القاهرة، مصر", type: "مدينة" },
  { id: "10", name: "الإسكندرية، مصر", type: "مدينة" },
  { id: "11", name: "الكويت", type: "دولة" },
  { id: "12", name: "الكويت، مدينة الكويت", type: "مدينة" },
  { id: "13", name: "الدوحة، قطر", type: "مدينة" },
  { id: "14", name: "المنامة، البحرين", type: "مدينة" },
  { id: "15", name: "مسقط، عمان", type: "مدينة" },
  { id: "16", name: "عمان، الأردن", type: "مدينة" },
  { id: "17", name: "بيروت، لبنان", type: "مدينة" },
  { id: "18", name: "بغداد، العراق", type: "مدينة" },
  { id: "19", name: "الدمام، السعودية", type: "مدينة" },
  { id: "20", name: "مكة المكرمة، السعودية", type: "مدينة" },
  { id: "21", name: "المدينة المنورة، السعودية", type: "مدينة" },
  { id: "22", name: "الخبر، السعودية", type: "مدينة" },
  { id: "23", name: "الشارقة، الإمارات", type: "مدينة" },
  { id: "24", name: "الجيزة، مصر", type: "مدينة" },
  { id: "25", name: "بورسعيد، مصر", type: "مدينة" }
]

function translateTargetType(type: string): string {
  switch (type?.toLowerCase()) {
    case "country": return "دولة"
    case "city": return "مدينة"
    case "state":
    case "province":
    case "region": return "منطقة"
    default: return type || "موقع جغرافي"
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""

    if (!query.trim()) {
      return NextResponse.json(fallbackDb.slice(0, 5))
    }

    // Attempt to lookup Google Ads Connected Account
    const workspaceId = await getWorkspaceIdForUser(session.user.email)
    const googleAccount = workspaceId
      ? await prisma.googleAdsAccount.findFirst({ where: { workspaceId } })
      : null

    if (googleAccount && googleAccount.accessToken && googleAccount.refreshToken && googleAccount.customerId !== "123-456-7890") {
      try {
        console.log(`Connecting to Google Ads API for location query: "${query}"`)
        const client = new GoogleAdsApi({
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
        })

        const formattedCustomerId = googleAccount.customerId.replace(/-/g, "")
        const customer = client.Customer({
          customer_id: formattedCustomerId,
          refresh_token: googleAccount.refreshToken,
        })

        // Translate Arabic search terms to English if matching keyword exists
        let mappedQuery = query.trim()
        const matchedEnglish = arabicToEnglishMap[mappedQuery]
        if (matchedEnglish) {
          mappedQuery = matchedEnglish
        }

        const gaql = `
          SELECT 
            geo_target_constant.id, 
            geo_target_constant.name, 
            geo_target_constant.canonical_name, 
            geo_target_constant.target_type 
          FROM geo_target_constant 
          WHERE geo_target_constant.canonical_name LIKE '%${mappedQuery}%' 
            AND geo_target_constant.status = 'ENABLED' 
          LIMIT 10
        `

        const rows = await customer.query(gaql)

        if (rows && rows.length > 0) {
          const mappedRows = rows.map((row: any) => ({
            id: String(row.geo_target_constant.id),
            name: row.geo_target_constant.canonical_name || row.geo_target_constant.name,
            type: translateTargetType(row.geo_target_constant.target_type)
          }))
          return NextResponse.json(mappedRows)
        }
      } catch (apiError: any) {
        console.error("Failed to fetch locations from Google Ads API. Falling back to local search. Error:", apiError?.message || apiError)
      }
    }

    // Static Local Search Fallback
    const filtered = fallbackDb.filter(loc =>
      loc.name.toLowerCase().includes(query.toLowerCase()) ||
      loc.type.toLowerCase().includes(query.toLowerCase())
    )

    return NextResponse.json(filtered)
  } catch (error: any) {
    console.error("Geotarget search error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
