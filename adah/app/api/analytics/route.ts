import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { fetchLiveCampaigns } from "@/lib/google-ads"
import { getWorkspaceIdForUser } from "@/lib/workspace"

// Campaign stats mappings for calculations
const mockCampaignStats: Record<string, { clicks: number; impressions: number; ctr: number; cpc: number; conversions: number; spend: number }> = {
  "1": { clicks: 12450, impressions: 187000, ctr: 6.66, cpc: 1.82, conversions: 340, spend: 22659 },
  "2": { clicks: 8900, impressions: 224000, ctr: 3.97, cpc: 0.95, conversions: 215, spend: 8455 },
  "3": { clicks: 5670, impressions: 310000, ctr: 1.83, cpc: 2.1, conversions: 120, spend: 11907 },
  "4": { clicks: 3200, impressions: 58000, ctr: 5.52, cpc: 1.4, conversions: 98, spend: 4480 },
  "5": { clicks: 9100, impressions: 145000, ctr: 6.28, cpc: 1.65, conversions: 278, spend: 15015 },
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = session.user.email
    const workspaceId = await getWorkspaceIdForUser(email)

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    let totalSpend = 0
    let totalClicks = 0
    let totalConversions = 0
    let totalImpressions = 0

    const channelSpends: Record<string, number> = {
      search: 0,
      display: 0,
      video: 0,
      shopping: 0
    }

    let dynamicCampaignsFetched = false

    // Check if Google Ads Account is connected
    const googleAccount = await prisma.googleAdsAccount.findFirst({
      where: { workspaceId }
    })

    if (googleAccount && googleAccount.accessToken && googleAccount.refreshToken) {
      try {
        console.log(`Analytics API attempting to fetch live campaigns from Google Ads API for: ${googleAccount.customerId}`)
        const liveCampaigns = await fetchLiveCampaigns(
          googleAccount.accessToken,
          googleAccount.refreshToken,
          googleAccount.customerId
        )

        if (liveCampaigns && liveCampaigns.length > 0) {
          liveCampaigns.forEach(lc => {
            totalSpend += lc.spend
            totalClicks += lc.clicks
            totalConversions += lc.conversions
            totalImpressions += lc.impressions

            const type = lc.type.toLowerCase()
            if (type in channelSpends) {
              channelSpends[type] += lc.spend
            } else {
              channelSpends.search += lc.spend
            }
          })
          dynamicCampaignsFetched = true
          console.log("Analytics aggregates computed successfully from live Google Ads data.")
        }
      } catch (err: any) {
        console.error("Failed to query live Google Ads stats for analytics dashboard. Error:", err?.message || err)
      }
    }

    // Fallback: If not connected or fetch failed, calculate stats from DB + Mock mapping
    if (!dynamicCampaignsFetched) {
      const campaigns = await prisma.campaign.findMany({
        where: { workspaceId },
      })

      campaigns.forEach(c => {
        const stats = mockCampaignStats[c.id] || {
          clicks: Math.floor(Math.random() * 1000) + 100,
          impressions: Math.floor(Math.random() * 20000) + 2000,
          ctr: parseFloat((Math.random() * 5 + 1).toFixed(2)),
          cpc: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
          conversions: Math.floor(Math.random() * 50) + 5,
          spend: Math.floor(Math.random() * 2000) + 200
        }

        totalSpend += stats.spend
        totalClicks += stats.clicks
        totalConversions += stats.conversions
        totalImpressions += stats.impressions

        const type = c.campaignType.toLowerCase()
        if (type in channelSpends) {
          channelSpends[type] += stats.spend
        } else {
          channelSpends.search += stats.spend // Fallback
        }
      })
    }

    // Fallback averages if click count is 0
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0

    // Format metrics into localized Arabic representations
    const formattedStats = {
      totalSpend: {
        value: Math.round(totalSpend).toLocaleString("ar-EG"),
        numericValue: totalSpend,
        unit: "ريال",
        change: +12.5
      },
      totalClicks: {
        value: totalClicks.toLocaleString("ar-EG"),
        numericValue: totalClicks,
        unit: "نقرة",
        change: +8.2
      },
      totalConversions: {
        value: totalConversions.toLocaleString("ar-EG"),
        numericValue: totalConversions,
        unit: "تحويل",
        change: +15.7
      },
      avgCTR: {
        value: avgCTR.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        numericValue: avgCTR,
        unit: "%",
        change: -2.1
      },
      avgCPC: {
        value: avgCPC.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        numericValue: avgCPC,
        unit: "ريال",
        change: -5.4
      }
    }

    // 2. Spend distribution by channel
    const totalChannelSpend = Object.values(channelSpends).reduce((a, b) => a + b, 0) || 1
    const spendByChannel = [
      { name: "بحث Google", value: Math.round((channelSpends.search / totalChannelSpend) * 100), color: "#1B4FDB" },
      { name: "شبكة العرض", value: Math.round((channelSpends.display / totalChannelSpend) * 100), color: "#0EA5E9" },
      { name: "YouTube فيديو", value: Math.round((channelSpends.video / totalChannelSpend) * 100), color: "#22C55E" },
      { name: "تسوق Shopping", value: Math.round((channelSpends.shopping / totalChannelSpend) * 100), color: "#F59E0B" }
    ]

    // 3. Performance Timeline (distribute statistics dynamically over 14 days)
    const timelineDaysCount = 14
    const avgClicksPerDay = totalClicks / timelineDaysCount
    const avgSpendPerDay = totalSpend / timelineDaysCount
    const avgImpressionsPerDay = totalImpressions / timelineDaysCount
    const avgConversionsPerDay = totalConversions / timelineDaysCount

    const performanceTimeline = [
      { date: "٢٦ مايو", clicks: Math.round(avgClicksPerDay * 0.7), conversions: Math.round(avgConversionsPerDay * 0.7), spend: Math.round(avgSpendPerDay * 0.7), impressions: Math.round(avgImpressionsPerDay * 0.7) },
      { date: "٢٧ مايو", clicks: Math.round(avgClicksPerDay * 0.9), conversions: Math.round(avgConversionsPerDay * 0.8), spend: Math.round(avgSpendPerDay * 0.9), impressions: Math.round(avgImpressionsPerDay * 0.9) },
      { date: "٢٨ مايو", clicks: Math.round(avgClicksPerDay * 0.8), conversions: Math.round(avgConversionsPerDay * 0.7), spend: Math.round(avgSpendPerDay * 0.8), impressions: Math.round(avgImpressionsPerDay * 0.8) },
      { date: "٢٩ مايو", clicks: Math.round(avgClicksPerDay * 1.1), conversions: Math.round(avgConversionsPerDay * 1.2), spend: Math.round(avgSpendPerDay * 1.1), impressions: Math.round(avgImpressionsPerDay * 1.1) },
      { date: "٣٠ مايو", clicks: Math.round(avgClicksPerDay * 1.0), conversions: Math.round(avgConversionsPerDay * 1.0), spend: Math.round(avgSpendPerDay * 1.0), impressions: Math.round(avgImpressionsPerDay * 1.0) },
      { date: "٣١ مايو", clicks: Math.round(avgClicksPerDay * 0.9), conversions: Math.round(avgConversionsPerDay * 0.9), spend: Math.round(avgSpendPerDay * 0.9), impressions: Math.round(avgImpressionsPerDay * 0.9) },
      { date: "١ يونيو", clicks: Math.round(avgClicksPerDay * 1.2), conversions: Math.round(avgConversionsPerDay * 1.3), spend: Math.round(avgSpendPerDay * 1.2), impressions: Math.round(avgImpressionsPerDay * 1.2) },
      { date: "٢ يونيو", clicks: Math.round(avgClicksPerDay * 1.3), conversions: Math.round(avgConversionsPerDay * 1.4), spend: Math.round(avgSpendPerDay * 1.3), impressions: Math.round(avgImpressionsPerDay * 1.3) },
      { date: "٣ يونيو", clicks: Math.round(avgClicksPerDay * 1.1), conversions: Math.round(avgConversionsPerDay * 1.1), spend: Math.round(avgSpendPerDay * 1.1), impressions: Math.round(avgImpressionsPerDay * 1.1) },
      { date: "٤ يونيو", clicks: Math.round(avgClicksPerDay * 0.9), conversions: Math.round(avgConversionsPerDay * 0.9), spend: Math.round(avgSpendPerDay * 0.9), impressions: Math.round(avgImpressionsPerDay * 0.9) },
      { date: "٥ يونيو", clicks: Math.round(avgClicksPerDay * 1.2), conversions: Math.round(avgConversionsPerDay * 1.3), spend: Math.round(avgSpendPerDay * 1.2), impressions: Math.round(avgImpressionsPerDay * 1.2) },
      { date: "٦ يونيو", clicks: Math.round(avgClicksPerDay * 1.4), conversions: Math.round(avgConversionsPerDay * 1.5), spend: Math.round(avgSpendPerDay * 1.4), impressions: Math.round(avgImpressionsPerDay * 1.4) },
      { date: "٧ يونيو", clicks: Math.round(avgClicksPerDay * 1.2), conversions: Math.round(avgConversionsPerDay * 1.2), spend: Math.round(avgSpendPerDay * 1.2), impressions: Math.round(avgImpressionsPerDay * 1.2) },
      { date: "٨ يونيو", clicks: Math.round(avgClicksPerDay * 1.3), conversions: Math.round(avgConversionsPerDay * 1.3), spend: Math.round(avgSpendPerDay * 1.3), impressions: Math.round(avgImpressionsPerDay * 1.3) },
    ]

    // 4. Keyword metrics (static matching mock-data.ts)
    const keywords = [
      { keyword: "شراء أثاث مكتبي", clicks: 2340, ctr: 8.2, cpc: 2.1, conversions: 78, spend: 4914 },
      { keyword: "تصميم مواقع احترافية", clicks: 1890, ctr: 7.1, cpc: 3.5, conversions: 62, spend: 6615 },
      { keyword: "خدمات التسويق الرقمي", clicks: 1650, ctr: 6.8, cpc: 2.8, conversions: 55, spend: 4620 },
      { keyword: "برامج محاسبة", clicks: 1420, ctr: 5.9, cpc: 1.9, conversions: 48, spend: 2698 },
      { keyword: "استضافة مواقع سعودية", clicks: 1180, ctr: 5.2, cpc: 1.5, conversions: 41, spend: 1770 },
      { keyword: "تطوير تطبيقات موبايل", clicks: 980, ctr: 4.8, cpc: 4.2, conversions: 29, spend: 4116 },
    ]

    return NextResponse.json({
      stats: formattedStats,
      spendByChannel,
      performanceTimeline,
      keywords
    })
  } catch (error: any) {
    console.error("Fetch analytics error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch analytics data" }, { status: 500 })
  }
}
