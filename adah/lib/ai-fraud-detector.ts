// AI-powered fraud detection logic for ADAH platform

export interface ClickData {
  ip: string
  clickCount: number
  timestamps: string[]
  location?: string
  device?: string
  conversionRate?: number
}

export interface FraudResult {
  ip: string
  clickCount: number
  reason: string
  confidence: number
  recommendedAction: "block" | "review" | "ignore"
  estimatedCostWasted: number
}

export interface FraudAnalysisResponse {
  suspiciousClicks: FraudResult[]
  totalFraudulentClicks: number
  estimatedMoneyWasted: number
  moneySavedByBlocking: number
}

const FRAUD_DETECTION_PROMPT = `
You are a click fraud detection AI for an Arabic Google Ads management platform called ADAH.
Analyze the following click data and identify suspicious patterns.

Click data: {clickData}

Flag as suspicious if:
1. Same IP clicks more than {threshold} times within {timeWindow} minutes
2. Click comes from an IP in an excluded/untargeted geographic region
3. Click-to-conversion rate for an IP is 0% with 5+ clicks
4. Clicks happen at inhuman speeds (< 2 seconds between clicks from same IP)
5. IP is associated with known data center/proxy ranges

Return a JSON response in Arabic:
{
  "suspicious_clicks": [
    {
      "ip": "x.x.x.x",
      "click_count": number,
      "reason": "Arabic reason description",
      "confidence": 0-100,
      "recommended_action": "block" | "review" | "ignore",
      "estimated_cost_wasted": number
    }
  ],
  "total_fraudulent_clicks": number,
  "estimated_money_wasted": number,
  "money_saved_by_blocking": number
}
`

/**
 * Rule-based local fraud detection (fast, no API call).
 * Falls back to AI analysis for borderline cases.
 */
export function detectFraudLocally(
  clicks: ClickData[],
  threshold = 10,
  timeWindowMinutes = 30,
  avgCPC = 1.8
): FraudResult[] {
  const results: FraudResult[] = []

  for (const click of clicks) {
    let confidence = 0
    let reasons: string[] = []

    // Rule 1: Too many clicks from same IP
    if (click.clickCount > threshold) {
      confidence += 40
      reasons.push("نقرات متكررة تجاوزت الحد المسموح")
    }

    // Rule 2: Zero conversion rate with many clicks
    if (click.conversionRate === 0 && click.clickCount >= 5) {
      confidence += 30
      reasons.push("نسبة تحويل صفر مع عدد نقرات مرتفع")
    }

    // Rule 3: Known bad device types
    if (click.device === "bot" || click.device === "datacenter") {
      confidence += 25
      reasons.push("جهاز مصنف كـ BOT أو مركز بيانات مشبوه")
    }

    // Rule 4: Suspicious location
    if (click.location && (click.location.includes("VPN") || click.location.includes("مجهول") || click.location.includes("خارج"))) {
      confidence += 20
      reasons.push("موقع جغرافي خارج النطاق المستهدف أو VPN مكتشف")
    }

    // Rule 5: Inhuman click speed (timestamps < 2s apart)
    if (click.timestamps && click.timestamps.length >= 2) {
      const speedViolations = click.timestamps.slice(1).filter((ts, i) => {
        const diff = new Date(ts).getTime() - new Date(click.timestamps[i]).getTime()
        return diff < 2000
      })
      if (speedViolations.length > 0) {
        confidence += 35
        reasons.push("سرعة النقر غير طبيعية — أقل من ثانيتين بين كل نقرة")
      }
    }

    if (confidence > 0) {
      const clampedConfidence = Math.min(confidence, 100)
      results.push({
        ip: click.ip,
        clickCount: click.clickCount,
        reason: reasons.join(" | "),
        confidence: clampedConfidence,
        recommendedAction: clampedConfidence > 85 ? "block" : clampedConfidence > 60 ? "review" : "ignore",
        estimatedCostWasted: click.clickCount * avgCPC,
      })
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence)
}

/**
 * AI-powered fraud analysis via OpenAI API (production mode).
 * In development with mock key, returns locally computed results.
 */
export async function analyzeFraudWithAI(
  clickData: ClickData[],
  threshold = 10,
  timeWindow = 30
): Promise<FraudAnalysisResponse> {
  const apiKey = process.env.OPENAI_API_KEY

  // Use local rule engine if no real API key configured
  if (!apiKey || apiKey.startsWith("mock-")) {
    const suspicious = detectFraudLocally(clickData, threshold, timeWindow)
    const totalFraud = suspicious.reduce((a, r) => a + r.clickCount, 0)
    const totalLoss = suspicious.reduce((a, r) => a + r.estimatedCostWasted, 0)
    const blocked = suspicious.filter(r => r.recommendedAction === "block")
    return {
      suspiciousClicks: suspicious,
      totalFraudulentClicks: totalFraud,
      estimatedMoneyWasted: totalLoss,
      moneySavedByBlocking: blocked.reduce((a, r) => a + r.estimatedCostWasted, 0),
    }
  }

  // Production: call OpenAI GPT-4o
  const { OpenAI } = await import("openai")
  const openai = new OpenAI({ apiKey })

  const prompt = FRAUD_DETECTION_PROMPT
    .replace("{clickData}", JSON.stringify(clickData))
    .replace("{threshold}", String(threshold))
    .replace("{timeWindow}", String(timeWindow))

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a click fraud detection expert. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  })

  const raw = JSON.parse(response.choices[0].message.content!)
  return {
    suspiciousClicks: (raw.suspicious_clicks || []).map((c: any) => ({
      ip: c.ip,
      clickCount: c.click_count,
      reason: c.reason,
      confidence: c.confidence,
      recommendedAction: c.recommended_action,
      estimatedCostWasted: c.estimated_cost_wasted,
    })),
    totalFraudulentClicks: raw.total_fraudulent_clicks || 0,
    estimatedMoneyWasted: raw.estimated_money_wasted || 0,
    moneySavedByBlocking: raw.money_saved_by_blocking || 0,
  }
}
