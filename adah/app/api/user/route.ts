import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import crypto from "crypto"

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    // Explicitly destructure only the allowed fields to avoid any relation conflicts
    const { name, jobTitle, image, password } = body
    const email = session.user.email

    // Find if user exists in the database
    let user = await prisma.user.findUnique({
      where: { email }
    })

    const hashedPassword = password ? crypto.createHash("sha256").update(password).digest("hex") : undefined

    if (!user) {
      // Create user if they don't exist yet (e.g. demo session first write)
      user = await prisma.user.create({
        data: {
          email,
          name: name || "سارة الأحمد",
          jobTitle: jobTitle || "مدير التسويق",
          image: image || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
          password: hashedPassword
        }
      })
    } else {
      // Update by resolved user ID with explicitly mapped fields
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name !== undefined ? name : user.name,
          jobTitle: jobTitle !== undefined ? jobTitle : user.jobTitle,
          image: image !== undefined ? image : user.image,
          ...(hashedPassword && { password: hashedPassword })
        }
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        jobTitle: user.jobTitle
      }
    })
  } catch (error: any) {
    console.error("PUT /api/user error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
