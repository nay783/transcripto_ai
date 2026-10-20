import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8FF65]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090C0A] disabled:pointer-events-none disabled:opacity-45 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#B8FF65] text-[#090C0A] font-semibold hover:bg-[#c6ff82] active:scale-[0.99]",
        secondary:
          "bg-[#172019] text-[#F5F8F4] border border-[#273329] hover:bg-[#1e2a21] hover:border-[#37473a]",
        outline:
          "bg-transparent text-[#F5F8F4] border border-[#273329] hover:bg-[#111812] hover:border-[#B8FF65]/40",
        ghost:
          "bg-transparent text-[#A6B4A7] hover:text-[#F5F8F4] hover:bg-[#111812]",
        danger:
          "bg-[#291414] text-[#FCA5A5] border border-[#522222] hover:bg-[#381A1A]",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-md px-3.5 text-xs",
        lg: "h-12 rounded-lg px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
