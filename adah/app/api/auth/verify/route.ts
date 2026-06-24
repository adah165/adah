import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ error: "البريد الإلكتروني ورمز التحقق مطلوبان" }, { status: 400 })
    }

    // 1. Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })
    }

    // 2. Check if user is already verified
    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: "البريد الإلكتروني مفعل بالفعل" })
    }

    // 3. Validate OTP code and expiry
    if (!user.otpCode || user.otpCode !== otp) {
      return NextResponse.json({ error: "رمز التحقق غير صحيح" }, { status: 400 })
    }

    if (!user.otpExpires || new Date() > user.otpExpires) {
      return NextResponse.json({ error: "رمز التحقق منتهي الصلاحية" }, { status: 400 })
    }

    // 4. Update user emailVerified status and clear OTP
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
        otpCode: null,
        otpExpires: null,
      },
    })

    return NextResponse.json({ success: true, message: "تم تفعيل البريد الإلكتروني بنجاح" })
  } catch (error: any) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: error.message || "حدث خطأ أثناء تفعيل الحساب" }, { status: 500 })
  }
}
export async function PUT(request: Request) {
  // Allow resending the code
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "البريد الإلكتروني مطلوب" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })
    }

    // Generate new OTP
    const otpCode = String(Math.floor(100000 + Math.random() * 900000))
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.user.update({
      where: { email },
      data: {
        otpCode,
        otpExpires,
      },
    })

    // Send OTP
    const resendKey = process.env.RESEND_API_KEY || "mock-key"
    const isMockKey = resendKey.startsWith("re_mock") || resendKey.startsWith("mock")

    if (isMockKey) {
      console.log("\n==================================================")
      console.log(`[VERIFICATION EMAIL SIMULATION - RESEND]`)
      console.log(`To: ${email}`)
      console.log(`Subject: رمز التحقق الجديد الخاص بك — منصة أداة`)
      console.log(`OTP Code: ${otpCode}`)
      console.log("==================================================\n")
    } else {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "Acme <onboarding@resend.dev>",
            to: email,
            subject: "رمز التحقق الجديد الخاص بك — منصة أداة",
            html: `
              <div style="direction: rtl; text-align: right; font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
                <h2 style="color: #1B4FDB; font-size: 20px; margin-bottom: 10px;">مرحباً ${user.name || ''}،</h2>
                <p style="font-size: 14px; color: #4a5568; line-height: 1.6;">تم توليد رمز تحقق جديد بناءً على طلبك. رمز التحقق الخاص بك هو:</p>
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
      } catch (err) {
        console.error("Resending email verification failed:", err)
      }
    }

    return NextResponse.json({ success: true, message: "تم إعادة إرسال رمز التحقق بنجاح" })
  } catch (error: any) {
    console.error("Resend OTP error:", error)
    return NextResponse.json({ error: error.message || "حدث خطأ أثناء إعادة إرسال الرمز" }, { status: 500 })
  }
}
