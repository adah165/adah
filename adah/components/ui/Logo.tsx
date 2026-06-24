"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "icon" | "full" | "horizontal"
  size?: number
  className?: string
  textClassName?: string
  lang?: "ar" | "en"
}

export function LogoIcon({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="أداة"
      className={className}
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
    />
  )
}

export function Logo({
  variant = "full",
  size = 40,
  className,
  textClassName,
  lang = "ar"
}: LogoProps) {
  if (variant === "icon") {
    return <LogoIcon className={className} size={size} />
  }

  if (variant === "horizontal") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <LogoIcon size={size} />
        <span className={cn("font-bold text-foreground transition-colors duration-200", textClassName)}>
          {lang === "ar" ? "أداة" : "Adah"}
        </span>
      </div>
    )
  }

  // default 'full' (vertical layout, matching the login center design)
  return (
    <div className={cn("flex flex-col items-center justify-center text-center gap-4", className)}>
      <LogoIcon size={size} />
      <span
        className={cn(
          "font-bold text-foreground transition-colors duration-200 tracking-wide",
          lang === "ar" ? "font-cairo text-3xl" : "font-sans text-3xl",
          textClassName
        )}
      >
        {lang === "ar" ? "أداة" : "Adah"}
      </span>
    </div>
  )
}
