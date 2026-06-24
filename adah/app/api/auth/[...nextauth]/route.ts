import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { GoogleAdsApi } from "google-ads-api"
import crypto from "crypto"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-secret",
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/adwords',
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email", placeholder: "user@example.com" },
        password: { label: "كلمة المرور", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Demo User Bypass
        if (credentials.email === "demo@adah.sa" && credentials.password === "password123") {
          return {
            id: "1",
            name: "سارة الأحمد",
            email: "demo@adah.sa",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
            emailVerified: new Date(),
            jobTitle: "مدير التسويق",
          }
        }

        // Real Database Check
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          return null
        }

        const hashedPassword = crypto.createHash("sha256").update(credentials.password).digest("hex")

        if (user.password !== hashedPassword) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          emailVerified: user.emailVerified,
          jobTitle: user.jobTitle,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          // Find or create the user in the database
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { workspaces: true }
          })
          
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                image: user.image,
                emailVerified: new Date(), // Google logins are pre-verified
              },
              include: { workspaces: true }
            })
          } else if (!dbUser.emailVerified) {
            // Google logins auto verify the email
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { emailVerified: new Date() }
            })
          }
          
          // Find or create a workspace
          let workspaceId: string
          if (dbUser.workspaces.length > 0) {
            workspaceId = dbUser.workspaces[0].workspaceId
          } else {
            const existingWorkspace = await prisma.workspace.findFirst()
            if (existingWorkspace) {
              workspaceId = existingWorkspace.id
              await prisma.workspaceMember.create({
                data: {
                  userId: dbUser.id,
                  workspaceId: workspaceId,
                  role: "ADMIN"
                }
              })
            } else {
              const newWorkspace = await prisma.workspace.create({
                data: { name: `${user.name || 'User'}'s Workspace` }
              })
              workspaceId = newWorkspace.id
              await prisma.workspaceMember.create({
                data: {
                  userId: dbUser.id,
                  workspaceId: workspaceId,
                  role: "ADMIN"
                }
              })
            }
          }
          
          // Create or update GoogleAdsAccount
          let customerId = process.env.GOOGLE_ADS_CUSTOMER_ID || "123-456-7890"

          if (account.refresh_token) {
            try {
              const api = new GoogleAdsApi({
                client_id: process.env.GOOGLE_CLIENT_ID || "",
                client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
                developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
              })
              const customers = await api.listAccessibleCustomers(account.refresh_token)
              if (customers && customers.length > 0) {
                // Parse the first customer ID (e.g. 'customers/1234567890')
                customerId = customers[0].split("/")[1]
                console.log("NextAuth dynamically resolved customerId from google account:", customerId)
              }
            } catch (err: any) {
              console.error("Failed to list accessible customers during login:", err?.message || err)
            }
          }

          const existingAccount = await prisma.googleAdsAccount.findFirst({
            where: { workspaceId }
          })
          
          if (existingAccount) {
            await prisma.googleAdsAccount.update({
              where: { id: existingAccount.id },
              data: {
                accessToken: account.access_token || "",
                refreshToken: account.refresh_token || existingAccount.refreshToken,
                customerId: customerId,
                name: user.name ? `${user.name} Google Ads` : "Google Ads Account"
              }
            })
          } else {
            await prisma.googleAdsAccount.create({
              data: {
                customerId: customerId,
                name: user.name ? `${user.name} Google Ads` : "Google Ads Account",
                accessToken: account.access_token || "",
                refreshToken: account.refresh_token || "",
                workspaceId
              }
            })
          }
        } catch (error) {
          console.error("Error saving Google Ads account in signIn callback:", error)
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.emailVerified = (user as any).emailVerified
        token.jobTitle = (user as any).jobTitle
      }
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name
        if (session.image !== undefined) token.image = session.image
        if (session.jobTitle !== undefined) token.jobTitle = session.jobTitle
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).emailVerified = token.emailVerified as string | null;
        (session.user as any).jobTitle = token.jobTitle as string | null;
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "adah-super-secret-key-1234",
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

