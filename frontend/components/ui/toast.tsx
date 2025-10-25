/**
 * Toast notification component with animations.
 */

"use client";

import { useEffect } from "react";
import { useToastStore, Toast as ToastType } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

/**
 * Get icon for toast type.
 */
function getIcon(type: ToastType["type"]) {
  switch (type) {
    case "success":
      return CheckCircle2;
    case "error":
      return XCircle;
    case "warning":
      return AlertTriangle;
    case "info":
      return Info;
  }
}

/**
 * Get color classes for toast type.
 */
function getColorClasses(type: ToastType["type"]) {
  switch (type) {
    case "success":
      return {
        bg: "bg-primary/10",
        border: "border-primary/30",
        icon: "text-primary",
        title: "text-primary",
      };
    case "error":
      return {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        icon: "text-red-400",
        title: "text-red-400",
      };
    case "warning":
      return {
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        icon: "text-yellow-400",
        title: "text-yellow-400",
      };
    case "info":
      return {
        bg: "bg-white/10",
        border: "border-white/30",
        icon: "text-white",
        title: "text-white",
      };
  }
}

/**
 * Individual toast notification.
 */
function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useToastStore((state) => state.removeToast);
  const Icon = getIcon(toast.type);
  const colors = getColorClasses(toast.type);

  return (
    <div
      className={cn(
        "glass-elevated rounded-lg p-4 shadow-neon-md border-2 backdrop-blur-xl",
        "animate-in slide-in-from-right-full duration-300",
        "min-w-[320px] max-w-[420px]",
        colors.bg,
        colors.border,
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", colors.icon)} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={cn("text-sm font-semibold mb-1", colors.title)}>
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-xs text-zinc-400 leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => removeToast(toast.id)}
          className="flex-shrink-0 p-1 hover:bg-elevated rounded transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4 text-zinc-500 hover:text-white" />
        </button>
      </div>
    </div>
  );
}

/**
 * Toast container component.
 */
export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  );
}
