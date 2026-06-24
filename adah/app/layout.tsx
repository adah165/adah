import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/Providers"
import { Cairo, Tajawal, Inter } from "next/font/google"

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-cairo",
})

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-tajawal",
})

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "أداة (ADAH) | منصة إدارة إعلانات جوجل الذكية وحمايتها من الاحتيال",
  description: "منصة عربية ذكية ومبسطة لإطلاق حملات Google Ads ومكافحة النقرات الوهمية باستخدام الذكاء الاصطناعي.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full scroll-smooth" suppressHydrationWarning>
      <body className={`${cairo.variable} ${tajawal.variable} ${inter.variable} min-h-full flex flex-col font-sans antialiased bg-background text-foreground`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
