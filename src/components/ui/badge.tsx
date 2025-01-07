import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        gray: "border-transparent bg-gray-50 text-gray-600 dark:text-gray-400 dark:bg-gray-900/20 ring-1 ring-inset ring-gray-500/10 dark:ring-gray-600/50",
        red: "border-transparent bg-red-50 text-red-700 dark:text-red-400 dark:bg-red-900/20 ring-1 ring-inset ring-red-600/10 dark:ring-red-600/30",
        yellow: "border-transparent bg-yellow-50 text-yellow-800 dark:text-yellow-400 dark:bg-yellow-900/20 ring-1 ring-inset ring-yellow-600/20 dark:ring-yellow-600/30",
        green: "border-transparent bg-green-50 text-green-700 dark:text-green-400 dark:bg-green-900/20 ring-1 ring-inset ring-green-600/20 dark:ring-green-600/30",
        blue: "border-transparent bg-blue-50 text-blue-700 dark:text-blue-400 dark:bg-blue-900/20 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-600/30",
        indigo: "border-transparent bg-indigo-50 text-indigo-700 dark:text-indigo-400 dark:bg-indigo-900/20 ring-1 ring-inset ring-indigo-700/10 dark:ring-indigo-600/30",
        purple: "border-transparent bg-purple-50 text-purple-700 dark:text-purple-400 dark:bg-purple-900/20 ring-1 ring-inset ring-purple-700/10 dark:ring-purple-600/30",
        pink: "border-transparent bg-pink-50 text-pink-700 dark:text-pink-400 dark:bg-pink-900/20 ring-1 ring-inset ring-pink-700/10 dark:ring-pink-600/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
