import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getWorkspaceIdForUser } from "@/lib/workspace"

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

    // Find the Ramadan campaign (googleCampaignId: "c_ramadan_2024" or name contains "رمضان")
    const campaign = await prisma.campaign.findFirst({
      where: {
        workspaceId,
        OR: [
          { googleCampaignId: "c_ramadan_2024" },
          { name: { contains: "رمضان" } }
        ]
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Calculate new budget (+15%)
    const newBudget = Math.round(campaign.budget * 1.15)

    // Update in database
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaign.id },
      data: { budget: newBudget }
    })

    return NextResponse.json({
      success: true,
      newBudget,
      campaignId: campaign.id,
      message: `تمت زيادة ميزانية حملة رمضان إلى ${newBudget} بنجاح.`
    })
  } catch (error: any) {
    console.error("Apply budget recommendation error:", error)
    return NextResponse.json({ error: error.message || "Failed to update budget" }, { status: 500 })
  }
}
