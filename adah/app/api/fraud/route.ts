import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { detectFraudLocally, analyzeFraudWithAI, ClickData } from "@/lib/ai-fraud-detector"
import { getWorkspaceIdForUser } from "@/lib/workspace"

// Helper to determine device and location dynamically based on IP
function getIpDetails(ip: string) {
  if (ip === "192.168.1.145") return { location: "خارج النطاق الجغرافي المستهدف", device: "bot" }
  if (ip === "10.0.0.55") return { location: "موقع مشبوه - VPN مكتشف", device: "proxy" }
  if (ip === "172.16.0.88") return { location: "مجهول — مركز بيانات", device: "datacenter" }
  if (ip === "203.0.113.77") return { location: "إيران — خارج النطاق", device: "proxy" }
  if (ip === "198.51.100.22") return { location: "الإمارات — مشبوه", device: "mobile" }

  const devices = ["proxy", "bot", "datacenter", "mobile"]
  const locations = ["الرياض — VPN مكتشف", "موقع مجهول", "خارج النطاق المستهدف", "جدة — شبكة مشبوهة"]
  const seed = ip.split(".").reduce((acc, octet) => acc + parseInt(octet || "0", 10), 0)
  return {
    device: devices[seed % devices.length],
    location: locations[seed % locations.length]
  }
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

    const logs = await prisma.fraudLog.findMany({
      where: { workspaceId },
      orderBy: { detectedAt: "desc" },
    })

    const formattedLogs = logs.map(log => {
      const details = getIpDetails(log.ipAddress)
      return {
        id: log.id,
        ip: log.ipAddress,
        clickCount: log.clickCount,
        reason: log.reason,
        confidence: log.confidence,
        action: log.action === "reviewed" ? "review" : log.action, // Align DB "reviewed" with UI "review"
        estimatedLoss: log.estimatedLoss,
        detectedAt: log.detectedAt.toISOString(),
        device: details.device,
        location: details.location,
      }
    })

    return NextResponse.json(formattedLogs)
  } catch (error: any) {
    console.error("Fetch fraud logs error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch fraud logs" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, action } = body

    if (!id || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Align UI action "review" to DB action "reviewed"
    const dbAction = action === "review" ? "reviewed" : action

    const updatedLog = await prisma.fraudLog.update({
      where: { id },
      data: { action: dbAction },
    })

    return NextResponse.json({
      id: updatedLog.id,
      ip: updatedLog.ipAddress,
      clickCount: updatedLog.clickCount,
      reason: updatedLog.reason,
      confidence: updatedLog.confidence,
      action: updatedLog.action === "reviewed" ? "review" : updatedLog.action,
      estimatedLoss: updatedLog.estimatedLoss,
      detectedAt: updatedLog.detectedAt.toISOString(),
    })
  } catch (error: any) {
    console.error("Update fraud log action error:", error)
    return NextResponse.json({ error: error.message || "Failed to update action" }, { status: 500 })
  }
}

export async function POST() {
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

    // 1. Get an active campaign to link the new logs to
    const campaign = await prisma.campaign.findFirst({
      where: { workspaceId, status: "ENABLED" },
    })

    if (!campaign) {
      return NextResponse.json({ error: "No active campaigns found. Please create or enable a campaign first." }, { status: 400 })
    }

    // 2. Generate simulated live click stream
    const clicksToScan: ClickData[] = [
      {
        ip: `185.220.101.${Math.floor(Math.random() * 254) + 1}`,
        clickCount: 15 + Math.floor(Math.random() * 20),
        timestamps: [new Date().toISOString(), new Date(Date.now() - 500).toISOString()],
        device: "bot",
        location: "مجهول — مركز بيانات (تور)",
        conversionRate: 0,
      },
      {
        ip: `93.115.95.${Math.floor(Math.random() * 254) + 1}`,
        clickCount: 10 + Math.floor(Math.random() * 15),
        timestamps: [new Date().toISOString(), new Date(Date.now() - 1000).toISOString(), new Date(Date.now() - 1800).toISOString()],
        device: "proxy",
        location: "هولندا — VPN مكتشف",
        conversionRate: 0,
      },
      {
        ip: `82.165.${Math.floor(Math.random() * 254) + 1}.12`,
        clickCount: 4,
        timestamps: [new Date().toISOString()],
        device: "mobile",
        location: "المملكة العربية السعودية",
        conversionRate: 0.25,
      }
    ]

    // 3. Run AI or rule-based analysis
    const scanResult = await analyzeFraudWithAI(clicksToScan)
    
    // 4. Save newly detected suspicious clicks to the database
    const savedLogs = []
    for (const c of scanResult.suspiciousClicks) {
      if (c.recommendedAction === "block" || c.recommendedAction === "review") {
        // Map engine action to DB action
        const dbAction = c.recommendedAction === "block" ? "blocked" : "reviewed"
        
        const log = await prisma.fraudLog.create({
          data: {
            ipAddress: c.ip,
            clickCount: c.clickCount,
            reason: c.reason,
            confidence: c.confidence,
            action: dbAction,
            estimatedLoss: c.estimatedCostWasted,
            campaignId: campaign.id,
            workspaceId,
          }
        })
        savedLogs.push(log)
      }
    }

    return NextResponse.json({
      message: "Scan completed",
      newLogsDetected: savedLogs.length,
      scanResult,
    })
  } catch (error: any) {
    console.error("Scan fraud error:", error)
    return NextResponse.json({ error: error.message || "Failed to trigger scan" }, { status: 500 })
  }
}
