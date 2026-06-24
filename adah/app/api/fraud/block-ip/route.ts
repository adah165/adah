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

    const { ipAddress } = await request.json()
    if (!ipAddress) {
      return NextResponse.json({ error: "IP address is required" }, { status: 400 })
    }

    // Update fraud logs action to 'blocked' for this IP under the workspace
    const result = await prisma.fraudLog.updateMany({
      where: { ipAddress, workspaceId },
      data: { action: "blocked" }
    })

    return NextResponse.json({ 
      success: true, 
      count: result.count,
      message: `تم حظر العنوان ${ipAddress} بنجاح.` 
    })
  } catch (error: any) {
    console.error("Block IP error:", error)
    return NextResponse.json({ error: error.message || "Failed to block IP" }, { status: 500 })
  }
}
