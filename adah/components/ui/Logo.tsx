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
    <svg
      viewBox="40 20 146 146"
      className={className}
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blue shape (Right leg, Left leg top, and Apex - Main Arch) */}
      <path
        d="M 68 145 C 68 100 80 45 109 45 C 138 45 132 100 132 145"
        stroke="#75b5e9"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Green Arrow Stem */}
      <path
        d="M 117 83 L 145 55"
        stroke="#86d7ab"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Green Arrow Head (Chevron pointing up-right) */}
      <path
        d="M 165 35 L 130 40 L 145 55 L 160 70 Z"
        fill="#86d7ab"
        stroke="#86d7ab"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Green shape (Left leg bottom & crossing ribbon) */}
      <path
        d="M 68 145 C 68 120 74 95 105 95 C 123 95 133 108 146 118"
        stroke="#86d7ab"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
