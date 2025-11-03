"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme, isLoaded } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      disabled={!isLoaded}
      className="relative"
    >
      <SunMedium
        className={cn(
          "h-5 w-5 transition-all", 
          theme === "dark" ? "scale-0 opacity-0" : "scale-100 opacity-100",
        )}
      />
      <MoonStar
        className={cn(
          "absolute h-5 w-5 transition-all", 
          theme === "dark" ? "scale-100 opacity-100" : "scale-0 opacity-0",
        )}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
