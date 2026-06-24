import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { detectFraudLocally } from "@/lib/ai-fraud-detector"
import { excludeIpFromCampaign } from "@/lib/google-ads"

// In-memory cache to track click history (Key: "campaignId:ip" -> Timestamps[])
const globalForClickCache = global as unknown as { clickCache: Map<string, string[]> }
const clickCache = globalForClickCache.clickCache || new Map<string, string[]>()
if (process.env.NODE_ENV !== "production") {
  globalForClickCache.clickCache = clickCache
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ip, userAgent, device, campaignId } = body

    if (!ip || !campaignId) {
      return NextResponse.json({ error: "Missing required fields (ip, campaignId)" }, { status: 400 })
    }

    // 1. Fetch the campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        workspace: {
          include: {
            googleAccounts: true
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    const workspaceId = campaign.workspaceId

    // 2. Track click in memory cache
    const now = new Date()
    const key = `${campaignId}:${ip}`
    const timestamps = clickCache.get(key) || []
    timestamps.push(now.toISOString())

    // Keep timestamps from the last 15 minutes
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000
    const cleanTimestamps = timestamps.filter(ts => new Date(ts).getTime() > fifteenMinutesAgo)
    clickCache.set(key, cleanTimestamps)

    // Check if User-Agent is a Bot
    const ua = (userAgent || "").toLowerCase()
    const isBot = ua.includes("bot") || ua.includes("crawler") || ua.includes("spider") || ua.includes("headless") || ua.includes("scraper")
    const calculatedDevice = isBot ? "bot" : device || "desktop"

    // 3. Evaluate fraud using heuristic rules
    const clickData = {
      ip,
      clickCount: cleanTimestamps.length,
      timestamps: cleanTimestamps,
      device: calculatedDevice,
      conversionRate: 0,
      location: isBot ? "مجهول — مركز بيانات" : "الرياض، المملكة العربية السعودية"
    }

    // Average CPC is estimated at 1.8 SAR
    const fraudResults = detectFraudLocally([clickData], 3, 5, 1.8)

    let isFraud = false
    let fraudReason = ""
    let confidence = 0
    let recommendedAction = "ignore"

    if (fraudResults.length > 0) {
      const result = fraudResults[0]
      if (result.recommendedAction === "block" || result.recommendedAction === "review") {
        isFraud = true
        fraudReason = result.reason
        confidence = result.confidence
        recommendedAction = result.recommendedAction
      }
    }

    if (isFraud) {
      console.log(`[Fraud Detected] IP: ${ip} on campaign: ${campaign.name}. Reason: ${fraudReason}`)
      
      const dbAction = recommendedAction === "block" ? "blocked" : "reviewed"
      const estimatedLoss = cleanTimestamps.length * 1.8

      // Check if a log already exists for this IP in the last 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      const existingLog = await prisma.fraudLog.findFirst({
        where: {
          ipAddress: ip,
          campaignId,
          detectedAt: {
            gte: thirtyMinutesAgo
          }
        }
      })

      if (existingLog) {
        // Update existing log click count
        await prisma.fraudLog.update({
          where: { id: existingLog.id },
          data: {
            clickCount: cleanTimestamps.length,
            estimatedLoss: estimatedLoss,
            action: dbAction
          }
        })
      } else {
        // Create new log
        await prisma.fraudLog.create({
          data: {
            ipAddress: ip,
            clickCount: cleanTimestamps.length,
            reason: fraudReason,
            confidence: confidence,
            action: dbAction,
            estimatedLoss: estimatedLoss,
            campaignId,
            workspaceId
          }
        })
      }

      // If recommended action is "block", automatically trigger Google Ads IP exclusion
      if (recommendedAction === "block") {
        const googleAccount = campaign.workspace.googleAccounts[0]
        if (googleAccount && googleAccount.accessToken && googleAccount.refreshToken) {
          console.log(`Attempting automated Google Ads IP exclusion for IP ${ip} on campaign ${campaign.googleCampaignId}`)
          await excludeIpFromCampaign(
            googleAccount.accessToken,
            googleAccount.refreshToken,
            googleAccount.customerId,
            campaign.googleCampaignId,
            ip
          )
        } else {
          console.log(`No active Google Ads account linked for workspace ${workspaceId}. Automated IP exclusion skipped (logged to DB).`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      clickCount: cleanTimestamps.length,
      isFraud,
      confidence,
      recommendedAction,
      reason: fraudReason
    })
  } catch (error: any) {
    console.error("Click tracking error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
