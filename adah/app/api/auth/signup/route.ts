import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 })
    }

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "البريد الإلكتروني مسجل بالفعل" }, { status: 400 })
    }

    // 2. Hash password using SHA-256
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex")

    // 3. Generate 6-digit OTP code
    const otpCode = String(Math.floor(100000 + Math.random() * 900000))
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

    // 4. Create User in Database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        otpCode,
        otpExpires,
        emailVerified: null,
      },
    })

    // 5. Initialize Workspace & Member (ADMIN role)
    const workspace = await prisma.workspace.create({
      data: {
        name: `مساحة عمل ${name}`,
      },
    })

    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: "ADMIN",
      },
    })

    // 6. Send OTP Email using Resend API via fetch
    const resendKey = process.env.RESEND_API_KEY || "mock-key"
    const isMockKey = resendKey.startsWith("re_mock") || resendKey.startsWith("mock")

    if (isMockKey) {
      console.log("\n==================================================")
      console.log(`[VERIFICATION EMAIL SIMULATION]`)
      console.log(`To: ${email}`)
      console.log(`Subject: رمز التحقق الخاص بك — منصة أداة`)
      console.log(`OTP Code: ${otpCode}`)
      console.log("==================================================\n")
    } else {
      try {
        const mailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "Acme <onboarding@resend.dev>",
            to: email,
            subject: "رمز التحقق الخاص بك — منصة أداة",
            html: `
              <div style="direction: rtl; text-align: right; font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
                <h2 style="color: #1B4FDB; font-size: 20px; margin-bottom: 10px;">مرحباً ${name}،</h2>
                <p style="font-size: 14px; color: #4a5568; line-height: 1.6;">نشكرك على التسجيل في منصة أداة. رمز التحقق الخاص بحسابك هو:</p>
                <div style="text-align: center; margin: 25px 0;">
                  <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1B4FDB; background-color: #f7fafc; padding: 10px 25px; border-radius: 8px; border: 1px dashed #cbd5e0;">
                    ${otpCode}
                  </span>
                </div>
                <p style="font-size: 12px; color: #a0aec0;">هذا الرمز صالح لمدة 15 دقيقة فقط.</p>
              </div>
            `,
          }),
        })

        if (!mailRes.ok) {
          const mailError = await mailRes.text()
          console.error("Resend API failed to deliver email:", mailError)
        }
      } catch (err) {
        console.error("Failed to send verification email via Resend:", err)
      }
    }

    return NextResponse.json({ success: true, message: "تم إنشاء الحساب وإرسال كود التحقق" }, { status: 201 })
  } catch (error: any) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: error.message || "حدث خطأ أثناء التسجيل" }, { status: 500 })
  }
}
