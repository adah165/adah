"use client"

import { useEffect } from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  message: string
  type: "success" | "error" | "info"
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const Icon = type === "success" ? CheckCircle : type === "error" ? AlertCircle : Info

  return (
    <div
      className={cn(
        "fixed bottom-5 left-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-tajawal animate-in slide-in-from-bottom-5 duration-300",
        type === "success" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
        type === "error" ? "bg-red-500/10 text-red-500 border-red-500/20" :
        "bg-primary/10 text-primary border-primary/20"
      )}
      dir="rtl"
    >
      <Icon className="w-4 h-4 shrink-0" />
      <div className="font-semibold">{message}</div>
      <button onClick={onClose} className="hover:opacity-70 transition-opacity p-0.5 rounded mr-1">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
