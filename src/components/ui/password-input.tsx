"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends React.ComponentPropsWithoutRef<"input"> {
  wrapperClassName?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, wrapperClassName, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    const toggleVisible = () => {
      setVisible((prev) => !prev);
    };

    const Icon = visible ? EyeOff : Eye;
    const ariaLabel = visible ? "Hide password" : "Show password";

    return (
      <div className={cn("relative", wrapperClassName)}>
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={toggleVisible}
          aria-label={ariaLabel}
          aria-pressed={visible}
          className="absolute inset-y-0 right-2 flex items-center justify-center rounded-full text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:text-foreground"
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={visible ? "visible" : "hidden"}
              initial={{ opacity: 0, scale: 0.8, y: 2 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -2 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="flex items-center justify-center"
            >
              <Icon className="h-4 w-4 transition-transform duration-150 hover:scale-105 active:scale-95" />
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

