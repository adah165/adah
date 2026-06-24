import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // 1. Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: "demo@adah.sa" },
    })

    if (user) {
      return NextResponse.json({ message: "Database already seeded", seeded: false })
    }

    // 2. Create default user
    user = await prisma.user.create({
      data: {
        name: "سارة الأحمد",
        email: "demo@adah.sa",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
      },
    })

    // 3. Create default workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: "مساحة عمل سارة الرئيسية",
      },
    })

    // 4. Create workspace membership
    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: "ADMIN",
      },
    })

    // 5. Create default Google Ads Account connection
    const googleAccount = await prisma.googleAdsAccount.create({
      data: {
        customerId: process.env.GOOGLE_ADS_CUSTOMER_ID || "123-456-7890",
        name: "حساب الشركة الرئيسي",
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        workspaceId: workspace.id,
      },
    })

    // 6. Create default campaigns
    const campaign1 = await prisma.campaign.create({
      data: {
        id: "1",
        googleCampaignId: "c_ramadan_2024",
        name: "حملة رمضان الكريم ٢٠٢٤",
        status: "ENABLED",
        budget: 5000,
        budgetType: "DAILY",
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-04-15"),
        campaignType: "search",
        workspaceId: workspace.id,
        googleAccountId: googleAccount.id,
      },
    })

    const campaign2 = await prisma.campaign.create({
      data: {
        id: "2",
        googleCampaignId: "c_summer_2024",
        name: "حملة المنتجات الصيفية ٢٠٢٤",
        status: "PAUSED",
        budget: 3000,
        budgetType: "DAILY",
        startDate: new Date("2024-06-01"),
        endDate: new Date("2024-08-31"),
        campaignType: "display",
        workspaceId: workspace.id,
        googleAccountId: googleAccount.id,
      },
    })

    const campaign3 = await prisma.campaign.create({
      data: {
        id: "3",
        googleCampaignId: "c_app_launch",
        name: "إطلاق التطبيق الجديد",
        status: "ENABLED",
        budget: 8000,
        budgetType: "DAILY",
        startDate: new Date("2024-05-15"),
        campaignType: "video",
        workspaceId: workspace.id,
        googleAccountId: googleAccount.id,
      },
    })

    const campaign4 = await prisma.campaign.create({
      data: {
        id: "4",
        googleCampaignId: "c_national_day",
        name: "تخفيضات العيد الوطني",
        status: "REMOVED",
        budget: 2000,
        budgetType: "DAILY",
        startDate: new Date("2023-09-20"),
        endDate: new Date("2023-09-25"),
        campaignType: "shopping",
        workspaceId: workspace.id,
        googleAccountId: googleAccount.id,
      },
    })

    const campaign5 = await prisma.campaign.create({
      data: {
        id: "5",
        googleCampaignId: "c_geo_riyadh",
        name: "الاستهداف الجغرافي - الرياض",
        status: "ENABLED",
        budget: 4500,
        budgetType: "DAILY",
        startDate: new Date("2024-04-01"),
        campaignType: "search",
        workspaceId: workspace.id,
        googleAccountId: googleAccount.id,
      },
    })

    // 7. Create default Click Fraud logs
    await prisma.fraudLog.createMany({
      data: [
        {
          id: "f1",
          ipAddress: "192.168.1.145",
          clickCount: 45,
          reason: "نقرات آلية متكررة خلال فترة قصيرة",
          confidence: 97,
          action: "blocked",
          estimatedLoss: 819,
          campaignId: campaign1.id,
          workspaceId: workspace.id,
          detectedAt: new Date("2024-06-22T08:12:33Z"),
        },
        {
          id: "f2",
          ipAddress: "10.0.0.55",
          clickCount: 23,
          reason: "نسبة التحويل صفر مع عدد نقرات مرتفع",
          confidence: 88,
          action: "reviewed",
          estimatedLoss: 431,
          campaignId: campaign1.id,
          workspaceId: workspace.id,
          detectedAt: new Date("2024-06-22T09:44:11Z"),
        },
        {
          id: "f3",
          ipAddress: "172.16.0.88",
          clickCount: 18,
          reason: "سرعة النقر أقل من ثانيتين بين كل نقرة",
          confidence: 91,
          action: "blocked",
          estimatedLoss: 347,
          campaignId: campaign2.id,
          workspaceId: workspace.id,
          detectedAt: new Date("2024-06-22T10:22:05Z"),
        },
        {
          id: "f4",
          ipAddress: "203.0.113.77",
          clickCount: 12,
          reason: "IP مدرج في قائمة البروكسيات المعروفة",
          confidence: 79,
          action: "reviewed",
          workspaceId: workspace.id,
          campaignId: campaign3.id,
          estimatedLoss: 215,
          detectedAt: new Date("2024-06-22T11:05:40Z"),
        },
        {
          id: "f5",
          ipAddress: "198.51.100.22",
          clickCount: 8,
          reason: "نمط نقر متكرر بشكل غير طبيعي",
          confidence: 65,
          action: "ignored",
          workspaceId: workspace.id,
          campaignId: campaign3.id,
          estimatedLoss: 145,
          detectedAt: new Date("2024-06-22T12:30:55Z"),
        },
      ],
    })

    return NextResponse.json({ message: "Database successfully seeded", seeded: true })
  } catch (error: any) {
    console.error("Seeding error:", error)
    return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 })
  }
}
