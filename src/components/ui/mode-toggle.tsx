"use client"
 
import * as React from "react"
import { Moon, Sun, TvMinimal } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
 
import { Button } from "@/components/ui/button"
 
export function ModeToggle({ className }: { className?: string }) {
  const { setTheme, theme } = useTheme()

  // Function to cycle through themes: light -> dark -> system -> light
  const cycleTheme = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  return (
    <Button 
      variant="outline" 
      size="icon" 
      className={cn(className)}
      onClick={cycleTheme}
    >
      <Sun className={`h-[1.2rem] w-[1.2rem] transition-all ${
        theme === 'light' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
      }`} />
      <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${
        theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
      }`} />
      <TvMinimal className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${
        theme === 'system' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
      }`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
