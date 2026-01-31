# Components and Styling

This document explains how components are organized and styled in this application.

## Component Architecture

We follow a **two-tier component structure**:

```
components/
  ui/              # Generic, reusable UI primitives
  dashboard/       # Application-specific components
```

### UI Components (`components/ui/`)

These are **generic, reusable components** that could work in any project:

- `button.tsx` - Button with variants
- `input.tsx` - Text input
- `textarea.tsx` - Multi-line text input
- `label.tsx` - Form labels
- `select.tsx` - Dropdown select
- `switch.tsx` - Toggle switch
- `dialog.tsx` - Modal dialog

**Characteristics:**
- No business logic
- Highly configurable via props
- Styled with Tailwind
- Based on Radix UI primitives (where applicable)

### Dashboard Components (`components/dashboard/`)

These are **application-specific components** with business logic:

- `project-form.tsx` - Form for creating/editing projects
- `delete-project-button.tsx` - Delete confirmation dialog

**Characteristics:**
- Contain business logic
- May connect to Server Actions
- Built using UI components

## Styling Approach: Tailwind CSS v4

We use **Tailwind CSS v4** with utility-first styling.

### Why Tailwind?

1. **Rapid Development**: Style directly in JSX
2. **Consistency**: Design system built-in
3. **No CSS Files**: Less context switching
4. **Tree-Shakable**: Unused styles removed automatically
5. **Dark Mode**: Built-in support

### Tailwind v4 Setup

```css
/* app/globals.css */
@import "tailwindcss";

@theme inline {
  --color-primary: var(--primary);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

Tailwind v4 uses `@theme inline` instead of a separate config file.

### The `cn()` Utility

We use a helper function to merge Tailwind classes:

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  condition && 'conditional-class',
  className  // Allow override
)} />
```

**What it does:**
- Combines multiple class strings
- Handles conditional classes
- Resolves conflicts (e.g., `px-2` + `px-4` = `px-4`)

**Implementation:**

```typescript
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- `clsx`: Handles conditional classes
- `twMerge`: Resolves Tailwind conflicts

## Component Patterns

### 1. Variant-Based Components

We use **class-variance-authority (CVA)** for components with variants:

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'base-classes',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white',
        outline: 'border border-slate-200',
        ghost: 'hover:bg-slate-50',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

**Usage:**

```typescript
<Button variant="outline" size="sm">Click me</Button>
```

**Benefits:**
- Type-safe variants
- Easy to extend
- Clear intent
- Autocomplete in IDE

### 2. forwardRef Pattern

All UI components use `forwardRef` to allow parent access to DOM elements:

```typescript
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn('base-classes', className)}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
```

**Why?**
- Parents can access the underlying DOM node
- Needed for form libraries
- Enables focus management
- Standard React pattern

### 3. Composition over Configuration

Components are designed to be **composed**:

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button>Action</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Instead of:

```tsx
<Dialog
  title="Title"
  description="Description"
  onConfirm={...}
  confirmText="Action"
/>
```

**Why composition?**
- More flexible
- Better for complex UIs
- TypeScript friendly
- Can customize any part

## Radix UI Integration

We wrap **Radix UI primitives** with our styling:

### Why Radix UI?

1. **Accessibility**: ARIA attributes, keyboard navigation, screen reader support
2. **Unstyled**: Full control over appearance
3. **Composable**: Piece together complex components
4. **Production-Ready**: Battle-tested
5. **Maintained**: Active development

### Example: Select Component

```typescript
'use client';

import * as SelectPrimitive from '@radix-ui/react-select';

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<...>(({ className, ... }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn('base-classes', className)}
    {...props}
  />
));
```

**Pattern:**
1. Import Radix primitive
2. Wrap with forwardRef
3. Add our Tailwind classes
4. Export styled component

### When to Use Radix vs Native HTML

| Use Case | Solution |
|----------|----------|
| Simple input | Native HTML `<input>` |
| Simple button | Native HTML `<button>` |
| Dropdown select | Radix UI `<Select>` (better a11y) |
| Modal dialog | Radix UI `<Dialog>` (focus trap, etc.) |
| Toggle switch | Radix UI `<Switch>` (a11y, animations) |

## Dark Mode

Dark mode is handled via **CSS custom properties**:

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

Then in Tailwind:

```tsx
<div className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-white">
  {/* Automatically adapts to dark mode */}
</div>
```

## Responsive Design

Tailwind's responsive prefixes:

```tsx
<div className="
  grid
  grid-cols-1        // Mobile: 1 column
  md:grid-cols-2     // Tablet: 2 columns
  lg:grid-cols-3     // Desktop: 3 columns
">
```

Breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## Form Styling

Forms follow a consistent pattern:

```tsx
<div className="space-y-2">
  <Label htmlFor="name">Field Label</Label>
  <Input id="name" name="name" />
  {error && <p className="text-sm text-red-600">{error}</p>}
</div>
```

**Layout pattern:**
- `space-y-2`: Vertical spacing between label/input/error
- Consistent error message styling
- IDs match labels for accessibility

## Icon Strategy

We use **inline SVG icons**:

```tsx
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
</svg>
```

**Why not icon libraries?**
- No extra dependency
- Full control over styling
- Tree-shakable (only icons you use)
- Works with `currentColor`

**When to use icon libraries:**
- Need hundreds of icons
- Consistency across large team
- Using a design system

## Reusability vs Abstraction

We balance **reusability** with **over-abstraction**:

### Good: Reusable Component

```typescript
// Generic, configurable
<Button variant="outline" size="sm">
  Click me
</Button>
```

### Bad: Over-Abstraction

```typescript
// Too specific, not reusable
<ProjectCardWithDeleteButtonAndEditLink project={project} />
```

**Rule of Thumb:** If a component is used in 2+ places, extract it. If it's only used once, inline it.

## Conclusion

Our component architecture prioritizes:
1. **Reusability**: Generic UI components
2. **Composability**: Radix UI primitives
3. **Type Safety**: TypeScript + CVA
4. **Accessibility**: Radix UI + semantic HTML
5. **Performance**: Minimal JavaScript, tree-shaking
6. **Developer Experience**: Tailwind utilities, autocomplete
