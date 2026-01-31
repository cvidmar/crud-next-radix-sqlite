/**
 * Button Component
 *
 * A reusable button component with multiple variants and sizes.
 * Uses class-variance-authority (CVA) for managing variants - a common pattern
 * in modern React applications.
 *
 * Learn more about CVA: https://cva.style/docs
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button variants using CVA
 *
 * CVA allows us to define component variants in a type-safe way.
 * Each variant can have multiple options, and they can be combined.
 */
const buttonVariants = cva(
  // Base classes applied to all buttons
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90 shadow-sm active:scale-[0.98]',
        outline:
          'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors',
        ghost: 'hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

/**
 * Button component
 *
 * Usage:
 * <Button>Click me</Button>
 * <Button variant="outline" size="sm">Small button</Button>
 * <Button variant="destructive">Delete</Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
