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

    const { keyword } = await request.json()
    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 })
    }

    // Find campaigns in this workspace
    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId }
    })

    let updatedCount = 0
    for (const c of campaigns) {
      if (c.keywords) {
        try {
          const list: string[] = JSON.parse(c.keywords)
          if (list.includes(keyword)) {
            const filtered = list.filter(k => k !== keyword)
            await prisma.campaign.update({
              where: { id: c.id },
              data: { keywords: JSON.stringify(filtered) }
            })
            updatedCount++
          }
        } catch (_) {}
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم إيقاف الكلمة المفتاحية '${keyword}' بنجاح في ${updatedCount} حملة.`,
      updatedCount
    })
  } catch (error: any) {
    console.error("Disable keyword error:", error)
    return NextResponse.json({ error: error.message || "Failed to disable keyword" }, { status: 500 })
  }
}
