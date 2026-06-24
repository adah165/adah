"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Megaphone, BarChart3, ShieldAlert, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"
import { Logo } from "@/components/ui/Logo"

const sidebarItems = [
  {
    title: "لوحة التحكم",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "الحملات الإعلانية",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    title: "التقارير والإحصائيات",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "حماية النقرات (AI)",
    href: "/fraud",
    icon: ShieldAlert,
  },
  {
    title: "إعدادات الحساب",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed top-0 right-0 z-40 w-64 h-screen transition-transform -translate-x-full border-l border-border bg-card md:translate-x-0 print:hidden">
      <div className="h-full px-4 py-6 flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <Logo variant="icon" size={38} className="shrink-0" />
            <div>
              <span className="text-xl font-bold font-cairo text-foreground block leading-tight">أداة</span>
              <span className="text-xs block text-muted-foreground font-tajawal mt-0.5">إدارة ذكية للإعلانات</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium font-tajawal transition-all duration-200 group relative",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  <span>{item.title}</span>
                  {isActive && (
                    <span className="absolute left-2 w-1.5 h-6 rounded-full bg-secondary-foreground" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium font-tajawal text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-200"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
