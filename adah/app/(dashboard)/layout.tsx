import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user || !session.user.email) {
    redirect("/login")
  }

  // Bypass verification only for the demo account
  if (session.user.email !== "demo@adah.sa") {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!dbUser || !dbUser.emailVerified) {
      redirect("/verify")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:mr-64 flex flex-col min-h-screen print:mr-0">
        <Header />
        <main className="flex-1 p-6 print:p-0">
          {children}
        </main>
      </div>
    </div>
  )
}
