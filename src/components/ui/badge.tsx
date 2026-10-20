import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-[#B8FF65]/30 bg-[#B8FF65]/10 text-[#B8FF65]",
        secondary:
          "border-[#273329] bg-[#172019] text-[#A6B4A7]",
        outline:
          "border-[#273329] bg-transparent text-[#F5F8F4]",
        danger:
          "border-[#7F1D1D] bg-[#291414] text-[#FCA5A5]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
