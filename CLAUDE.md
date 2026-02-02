# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a sample Next.js 16 project with TypeScript, designed as a simple CRUD application with Radix UI components and SQLite database integration. The project uses the App Router architecture and Tailwind CSS v4 for styling. This project is not for production but just for learning purposes, it's aimed at developers who want to get familiar with this tech stack.

During development, focus is on creating clear, understandable code for learning the stack. For this reason, comments are written in an explicit way wherever they are useful for a human developer to understand the architecture and coding technique.


## Development Commands

### Running the Application
```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint checks
```

### Package Manager
This project uses `pnpm` (evidenced by pnpm-lock.yaml).

## Architecture

### Tech Stack
- **Framework**: Next.js 16.1.6 (App Router)
- **React**: 19.2.3 with React DOM 19.2.3
- **TypeScript**: v5 with strict mode enabled
- **Styling**: Tailwind CSS v4 with PostCSS plugin
- **Fonts**: Geist Sans and Geist Mono (via next/font)
- **Database**: SQLite with better-sqlite3 12.6.2
- **UI Components**: Radix UI primitives (@radix-ui/react-dialog, select, switch)
- **Validation**: Zod v4 (4.3.6)
- **Utilities**: class-variance-authority, clsx, tailwind-merge

### Directory Structure
```
app/
  layout.tsx                # Root layout with font configuration and metadata
  page.tsx                  # Placeholder (redirected by route group)
  globals.css               # Global styles with Tailwind imports and CSS variables
  (dashboard)/              # Route group (doesn't add /dashboard to URL)
    layout.tsx              # Dashboard layout with sidebar
    page.tsx                # Project list (main page at /)
    projects/
      new/page.tsx          # Create project form
      [id]/page.tsx         # View project details
      [id]/edit/page.tsx    # Edit project form
lib/
  db/
    index.ts                # Database connection and initialization
    schema.ts               # TypeScript types for database tables
    projects.ts             # Project repository (CRUD operations)
  actions/
    projects.ts             # Server Actions for mutations
  validations/
    project.ts              # Zod validation schemas
  utils.ts                  # Utility functions (cn, formatDate, etc.)
components/
  ui/                       # Generic, reusable UI components
    button.tsx              # Button with variants (CVA)
    input.tsx               # Text input
    textarea.tsx            # Multi-line text input
    label.tsx               # Form labels
    select.tsx              # Dropdown (Radix UI)
    switch.tsx              # Toggle (Radix UI)
    dialog.tsx              # Modal (Radix UI)
  dashboard/                # Application-specific components
    project-form.tsx        # Reusable form for create/edit
    delete-project-button.tsx # Delete with confirmation dialog
docs/                       # Extensive documentation
  README.md                 # Documentation overview and reading guide
  01-architecture.md        # High-level architecture and patterns
  02-database.md            # Database design and repository pattern
  03-routing-and-rendering.md # App Router and Server/Client Components
  04-components-and-styling.md # Component architecture and Tailwind
  05-forms-and-validation.md # Server Actions, useActionState, Zod
data/
  app.db                    # SQLite database (auto-created, gitignored)
```

### Key Configurations

**TypeScript** (tsconfig.json):
- Path alias: `@/*` maps to root directory
- Target: ES2017
- Strict mode enabled
- JSX: react-jsx

**ESLint** (eslint.config.mjs):
- Uses Next.js core-web-vitals and TypeScript configs
- Custom ignore patterns for `.next/`, `out/`, `build/`, `next-env.d.ts`

**Tailwind v4** (postcss.config.mjs):
- Uses `@tailwindcss/postcss` plugin
- CSS variables defined in globals.css for theming (`--background`, `--foreground`)
- Dark mode support via `prefers-color-scheme`
- Custom theme tokens configured in @theme inline directive

### Design System Notes

Two sample HTML files exist in the root directory (`sample-ui-base.html` and `sample-ui-edit.html`) that demonstrate the intended UI design patterns:
- **Color Scheme**: Primary blue (#135bec), with light/dark mode support
- **Design Language**: Clean, modern interface with Radix-inspired component styling
- **Components**: Sidebar navigation, form inputs, buttons, toggles, breadcrumbs
- **Typography**: Inter font family
- **Icons**: Material Symbols Outlined
- **Border Radius**: "radix" custom radius (0.5rem)

These HTML files serve as reference implementations for the planned CRUD interface and should guide component development in the Next.js app.

### Styling Approach
- Dark mode implemented via CSS custom properties and `prefers-color-scheme`
- Tailwind utility classes for component styling
- Global CSS variables for consistent theming:
  - `--background` and `--foreground` toggle between light/dark
  - Font variables inject Geist fonts into Tailwind theme

## Important Development Notes

### App Router Conventions
- This uses Next.js App Router (not Pages Router)
- Server Components by default - add `'use client'` for client-side interactivity
- Metadata exported from layout.tsx for SEO

### Path Imports
Always use the `@/` alias for imports from the root directory:
```typescript
import Component from '@/app/components/Component'
```

### Font Configuration
Fonts are configured in layout.tsx and applied via CSS variables. Do not modify the Geist font setup unless explicitly requested.

### Component Development
When building React components:
- Reference the sample HTML files for design patterns
- Use Radix UI primitives for accessible components
- Follow the established color scheme and spacing patterns
- Maintain dark mode compatibility

### Database

The application uses **SQLite with better-sqlite3** for data persistence:

- **Location**: `data/app.db` (auto-created on first run, gitignored)
- **Initialization**: Automatic schema creation and seeding in `lib/db/index.ts`
- **Repository Pattern**: All database operations centralized in `lib/db/projects.ts`
- **Server Components**: Direct database access (no API routes needed)
- **Server Actions**: Mutations handled via Server Actions with revalidation

**Key patterns:**
- Prepared statements for security and performance
- Type conversion (SQLite integers → JS booleans)
- Transaction support for atomic operations
- See `docs/02-database.md` for details

### Server Components & Server Actions

This application demonstrates modern Next.js patterns:

**Server Components (default):**
- Pages and layouts are Server Components by default
- Can directly access database (no API needed)
- Async/await data fetching
- Zero JavaScript to client for these components

**Client Components (`'use client'`):**
- Used for interactivity (forms, dialogs, etc.)
- Access hooks (useState, useActionState, etc.)
- Can call Server Actions

**Server Actions:**
- Functions marked with `'use server'`
- Called from Client Components
- Handle form submissions, mutations
- Integrated with React 19's `useActionState`
- See `docs/03-routing-and-rendering.md` and `docs/05-forms-and-validation.md`

### Form Handling

Forms use the modern **Server Actions + useActionState** pattern:

1. Client Component renders form with `useActionState(action, null)`
2. Form submission sends FormData to Server Action
3. Server Action validates with Zod
4. On success: database mutation + `revalidatePath()` + `redirect()`
5. On error: return validation errors to form
6. Form displays errors and loading states

**Benefits:**
- Type-safe (TypeScript + Zod)
- Progressive enhancement (works without JS)
- No API routes needed
- Automatic request deduplication

### Library and API specs and docs

Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:
1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes

- Stop the dev server at the end of every testing session.
