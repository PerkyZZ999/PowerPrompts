/**
 * Button component with neon effects and variants.
 */

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center font-medium transition-all duration-200",
          "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
          
          // Variant styles
          {
            "bg-primary text-background hover:bg-primary/90 shadow-neon-sm hover:shadow-neon-md active:scale-95":
              variant === "primary",
            "glass hover:bg-elevated border border-zinc-600 text-zinc-200 hover:text-white active:scale-95":
              variant === "secondary",
            "hover:bg-zinc-800/50 text-zinc-300 hover:text-white":
              variant === "ghost",
          },
          
          // Size styles
          {
            "px-3 py-1.5 text-sm rounded-lg": size === "sm",
            "px-4 py-2 text-base rounded-xl": size === "md",
            "px-6 py-3 text-lg rounded-xl": size === "lg",
          },
          
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

