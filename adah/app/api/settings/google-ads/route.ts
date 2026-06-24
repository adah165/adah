import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getWorkspaceIdForUser } from "@/lib/workspace"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const email = session.user.email
    const workspaceId = await getWorkspaceIdForUser(email)

    if (!workspaceId) {
      return NextResponse.json({ connected: false, error: "Workspace not found" })
    }

    const account = await prisma.googleAdsAccount.findFirst({
      where: { workspaceId }
    })

    if (account && account.accessToken && account.refreshToken) {
      return NextResponse.json({
        connected: true,
        name: account.name,
        customerId: account.customerId
      })
    }

    return NextResponse.json({ connected: false })
  } catch (error: any) {
    console.error("GET /api/settings/google-ads error:", error)
    return NextResponse.json({ connected: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE() {
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

    // First, delete fraud logs associated with the workspace to avoid FK issues with Campaign
    await prisma.fraudLog.deleteMany({
      where: { workspaceId }
    })

    // Next, delete campaigns associated with the workspace to avoid FK issues with GoogleAdsAccount
    await prisma.campaign.deleteMany({
      where: { workspaceId }
    })

    // Finally, delete google ads account under this workspace
    await prisma.googleAdsAccount.deleteMany({
      where: { workspaceId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("DELETE /api/settings/google-ads error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
