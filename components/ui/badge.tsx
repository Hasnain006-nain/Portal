import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-sm",
        outline:
          "text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm",
        success:
          "bg-green-500 text-white hover:bg-green-500/80 shadow-sm dark:bg-green-600 dark:hover:bg-green-600/80",
        warning:
          "bg-yellow-500 text-white hover:bg-yellow-500/80 shadow-sm dark:bg-yellow-600 dark:hover:bg-yellow-600/80",
        info:
          "bg-blue-500 text-white hover:bg-blue-500/80 shadow-sm dark:bg-blue-600 dark:hover:bg-blue-600/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
