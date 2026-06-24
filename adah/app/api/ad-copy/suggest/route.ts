import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { campaignName, goal, description } = await request.json()
    const apiKey = process.env.OPENAI_API_KEY
    const cleanName = campaignName || "مشروعك"
    const cleanDesc = description || ""

    // 1. Query OpenAI if real API key exists
    if (apiKey && !apiKey.startsWith("mock-")) {
      const { OpenAI } = await import("openai")
      const openai = new OpenAI({ apiKey })

      const prompt = `
        You are a Google Ads copywriter. Write 3 Headlines (max 30 characters each) and 2 Descriptions (max 90 characters each) in Arabic for a campaign named "${cleanName}" with the marketing goal "${goal}".
        Use this business description for context: "${cleanDesc}".
        Return a JSON response strictly in this format:
        {
          "headlines": ["Headline 1", "Headline 2", "Headline 3"],
          "descriptions": ["Description 1", "Description 2"]
        }
      `

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      })

      const raw = JSON.parse(response.choices[0].message.content!)
      return NextResponse.json(raw)
    }

    // 2. Fallback Heuristics: Goal-tailored dynamic templates
    let headlines: string[] = []
    let descriptions: string[] = []

    switch (goal?.toLowerCase()) {
      case "sales":
        headlines = [
          `تسوق عروض ${cleanName}`,
          "خصومات تصل إلى ٥٠%",
          "أفضل جودة وأسرع توصيل"
        ]
        descriptions = [
          `احصل على أفضل المنتجات والخصومات الحصرية من ${cleanName}. اطلب الآن واستفد من التوصيل السريع!`,
          "وفر الكثير مع عروضنا المميزة. جودة عالية وضمان على جميع المنتجات. اطلب اليوم قبل نفاد الكمية."
        ]
        break

      case "leads":
        headlines = [
          "احصل على استشارة مجانية",
          "سجل بياناتك اليوم معنا",
          `أفضل الحلول لـ ${cleanName}`
        ]
        descriptions = [
          `سجل بياناتك اليوم للحصول على عروض مخصصة من ${cleanName}. فريقنا جاهز لخدمتك على مدار الساعة.`,
          "انضم لأكثر من ١٠ آلاف عميل سعيد واستفد من خدماتنا المتميزة. املأ النموذج الآن وسنتواصل معك."
        ]
        break

      case "traffic":
        headlines = [
          "تصفح موقعنا اليوم",
          "اقرأ المزيد وتعرف علينا",
          `اكتشف منصة ${cleanName}`
        ]
        descriptions = [
          `اكتشف آخر المقالات، النصائح، والحلول المبتكرة على موقع ${cleanName}. اضغط هنا لزيارة منصتنا.`,
          `دليلك الشامل لمعرفة المزيد عن خدمات ${cleanName}. تصفح موقعنا الآن وتعرف على كافة التفاصيل.`
        ]
        break

      case "brand":
      default:
        headlines = [
          `منصة ${cleanName} الرائدة`,
          "حلول مبتكرة لعملك اليوم",
          "جرب خدماتنا ووفر الكثير"
        ]
        descriptions = [
          `نحن نساعدك على تحقيق أهدافك بأسرع وقت وأقل تكلفة. انضم لأكثر من ١٠ آلاف عميل سعيد اليوم.`,
          `احصل على أفضل الخدمات المصممة خصيصاً لتناسب احتياجات مشروعك من ${cleanName}. تواصل معنا الآن.`
        ]
        break
    }

    // Enforce Google Ads maximum character limit lengths (30 for headlines, 90 for descriptions)
    headlines = headlines.map(h => h.slice(0, 30))
    descriptions = descriptions.map(d => d.slice(0, 90))

    return NextResponse.json({ headlines, descriptions })
  } catch (error: any) {
    console.error("Ad copy suggestion error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
