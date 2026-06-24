import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { fetchLiveCampaigns, createLiveCampaign } from "@/lib/google-ads"
import { getWorkspaceIdForUser } from "@/lib/workspace"

// Map default campaigns to their exact mock performance stats for UI parity
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

    // Check if Google Ads Account is connected
    const googleAccount = await prisma.googleAdsAccount.findFirst({
      where: { workspaceId }
    })

    if (googleAccount && googleAccount.accessToken && googleAccount.refreshToken) {
      try {
        console.log(`Attempting to fetch live Google Ads campaigns for customer: ${googleAccount.customerId}`)
        const liveCampaigns = await fetchLiveCampaigns(
          googleAccount.accessToken,
          googleAccount.refreshToken,
          googleAccount.customerId
        )

        if (liveCampaigns && liveCampaigns.length > 0) {
          console.log(`Successfully fetched ${liveCampaigns.length} live campaigns from Google Ads API.`)
          
          // Sync live campaigns to the database so we have local records for logs/referencing
          for (const lc of liveCampaigns) {
            const existing = await prisma.campaign.findFirst({
              where: {
                OR: [
                  { googleCampaignId: lc.id },
                  { name: lc.name }
                ]
              }
            })

            if (!existing) {
              await prisma.campaign.create({
                data: {
                  googleCampaignId: lc.id,
                  name: lc.name,
                  status: lc.status,
                  budget: lc.budget,
                  startDate: new Date(lc.startDate),
                  endDate: lc.endDate ? new Date(lc.endDate) : null,
                  campaignType: lc.type,
                  workspaceId,
                  googleAccountId: googleAccount.id,
                  bidStrategy: "maximize_clicks",
                  targetLocations: JSON.stringify(["المملكة العربية السعودية"]),
                  keywords: JSON.stringify([]),
                  headlines: JSON.stringify(["", "", ""]),
                  descriptions: JSON.stringify(["", ""]),
                  finalUrl: "https://mybusiness.sa",
                }
              })
            } else {
              await prisma.campaign.update({
                where: { id: existing.id },
                data: {
                  status: lc.status,
                  budget: lc.budget,
                }
              })
            }
          }

          // Return the live campaigns directly for the UI
          return NextResponse.json(liveCampaigns)
        }
      } catch (apiError: any) {
        console.error("Failed to query live Google Ads API. Falling back to DB/Mock data. Error:", apiError?.message || apiError)
      }
    }

    // Fallback: Fetch campaigns from DB and attach mock performance stats
    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    })

    const formattedCampaigns = campaigns.map((campaign) => {
      const stats = mockCampaignStats[campaign.id] || {
        clicks: Math.floor(Math.random() * 1000) + 100,
        impressions: Math.floor(Math.random() * 20000) + 2000,
        ctr: parseFloat((Math.random() * 5 + 1).toFixed(2)),
        cpc: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
        conversions: Math.floor(Math.random() * 50) + 5,
        spend: Math.floor(Math.random() * 2000) + 200,
      }

      let locationsArray: string[] = []
      let keywordsArray: string[] = []
      let headlinesArray: string[] = ["", "", ""]
      let descriptionsArray: string[] = ["", ""]

      try {
        if (campaign.targetLocations) locationsArray = JSON.parse(campaign.targetLocations)
      } catch (_) {}
      try {
        if (campaign.keywords) keywordsArray = JSON.parse(campaign.keywords)
      } catch (_) {}
      try {
        if (campaign.headlines) headlinesArray = JSON.parse(campaign.headlines)
      } catch (_) {}
      try {
        if (campaign.descriptions) descriptionsArray = JSON.parse(campaign.descriptions)
      } catch (_) {}

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        type: campaign.campaignType,
        budget: campaign.budget,
        budgetType: campaign.budgetType,
        clicks: stats.clicks,
        impressions: stats.impressions,
        ctr: stats.ctr,
        cpc: stats.cpc,
        conversions: stats.conversions,
        spend: stats.spend,
        startDate: campaign.startDate.toISOString().split("T")[0],
        endDate: campaign.endDate ? campaign.endDate.toISOString().split("T")[0] : null,
        bidStrategy: campaign.bidStrategy || "maximize_clicks",
        targetLocations: locationsArray,
        keywords: keywordsArray,
        headlines: headlinesArray,
        descriptions: descriptionsArray,
        finalUrl: campaign.finalUrl || "",
      }
    })

    return NextResponse.json(formattedCampaigns)

  } catch (error: any) {
    console.error("Fetch campaigns error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch campaigns" }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const body = await request.json()
    const { name, budget, type, startDate, endDate, status, bidStrategy, locations, keywords, headlines, descriptions, finalUrl } = body

    if (!name || !budget || !type || !startDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Find a Google Ads account associated with this workspace
    const googleAccount = await prisma.googleAdsAccount.findFirst({
      where: { workspaceId },
    })

    if (!googleAccount) {
      return NextResponse.json({ error: "Google ads account not connected" }, { status: 404 })
    }

    // Call Google Ads API to create the campaign synchronously
    let googleCampaignId = "c_gads_" + Math.random().toString(36).substring(2, 9)
    try {
      googleCampaignId = await createLiveCampaign(
        googleAccount.accessToken,
        googleAccount.refreshToken,
        googleAccount.customerId,
        {
          name,
          budget: parseFloat(budget),
          type,
          startDate,
        }
      )
    } catch (apiError: any) {
      console.error("Google Ads API Campaign Creation Failed:", apiError?.message || apiError)
      return NextResponse.json({ 
        error: `فشل إنشاء الحملة في Google Ads: ${apiError?.message || "خطأ في الاتصال بالـ API"}` 
      }, { status: 400 })
    }

    const newCampaign = await prisma.campaign.create({
      data: {
        name,
        budget: parseFloat(budget),
        campaignType: type,
        status: status || "ENABLED",
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        googleCampaignId,
        workspaceId,
        googleAccountId: googleAccount.id,
        bidStrategy: bidStrategy || "maximize_clicks",
        targetLocations: locations ? JSON.stringify(locations) : JSON.stringify(["المملكة العربية السعودية"]),
        keywords: keywords ? JSON.stringify(keywords) : JSON.stringify([]),
        headlines: headlines ? JSON.stringify(headlines) : JSON.stringify(["", "", ""]),
        descriptions: descriptions ? JSON.stringify(descriptions) : JSON.stringify(["", ""]),
        finalUrl: finalUrl || "https://mybusiness.sa",
      },
    })

    return NextResponse.json(newCampaign, { status: 201 })
  } catch (error: any) {
    console.error("Create campaign error:", error)
    return NextResponse.json({ error: error.message || "Failed to create campaign" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
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

    const body = await request.json()
    const { id, name, budget, status, bidStrategy, locations, keywords, headlines, descriptions, finalUrl } = body

    if (!id || !name || budget === undefined || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify campaign belongs to workspace
    const campaign = await prisma.campaign.findUnique({
      where: { id }
    })

    if (!campaign || campaign.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Campaign not found or not in workspace" }, { status: 404 })
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        name,
        budget: parseFloat(budget),
        status,
        bidStrategy: bidStrategy || undefined,
        targetLocations: locations ? JSON.stringify(locations) : undefined,
        keywords: keywords ? JSON.stringify(keywords) : undefined,
        headlines: headlines ? JSON.stringify(headlines) : undefined,
        descriptions: descriptions ? JSON.stringify(descriptions) : undefined,
        finalUrl: finalUrl || undefined,
      }
    })

    return NextResponse.json(updatedCampaign)
  } catch (error: any) {
    console.error("Update campaign error:", error)
    return NextResponse.json({ error: error.message || "Failed to update campaign" }, { status: 500 })
  }
}

