# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds the Next.js App Router pages, layouts, and route groups (primary UI entry points).
- `components/` contains reusable UI primitives in `components/ui/` and app-specific pieces in `components/dashboard/`.
- `lib/` includes the data layer (`lib/db/`), Server Actions (`lib/actions/`), and Zod validations (`lib/validations/`).
- `data/` stores the SQLite database (`data/app.db`), created on first run.
- `docs/` provides architectural and feature documentation; start with `docs/README.md`.
- `public/` is for static assets.

## Build, Test, and Development Commands
Use pnpm when possible (a `pnpm-lock.yaml` is present), but npm works.

```bash
pnpm dev      # Start the local dev server (http://localhost:3000)
pnpm build    # Build for production
pnpm start    # Run the production server
pnpm lint     # Run ESLint checks
```

## Coding Style & Naming Conventions
- TypeScript with strict mode; prefer the `@/` alias for root imports (e.g., `@/lib/db`).
- Use App Router conventions: Server Components by default, add `'use client'` only when needed.
- Tailwind CSS v4 is the styling standard; keep utility class usage consistent with existing components.
- Follow existing file naming: `kebab-case.tsx` for components, `page.tsx`/`layout.tsx` for routes.

## Testing Guidelines
- This repo intentionally omits tests (per project scope). If you add tests, document the framework and include how to run them in this file.
- Keep any new test files colocated with their feature area and use clear names like `project-form.test.tsx`.

## Commit & Pull Request Guidelines
- Commit messages in history are short, imperative, and descriptive (e.g., “Add responsive layout…”). Follow the same style.
- PRs should explain the user-facing behavior change, include screenshots for UI updates, and link relevant issues/docs when applicable.

## Configuration & Data Notes
- The SQLite database (`data/app.db`) is auto-created and seeded on first run; don’t commit it.
- ESLint config lives in `eslint.config.mjs`; Tailwind/PostCSS in `postcss.config.mjs`.

## Agent-Specific Instructions
- Do not run install commands (e.g., `pnpm install`, `pnpm dlx ... install`, `npm install`, `brew install`) without asking for explicit approval first.
- When using browser automation, always run `pnpm dlx agent-browser <PARAMS>` instead of `agent-browser <PARAMS>`. This is an explicit exception to the install-approval rule above; do not ask for approval before running `pnpm dlx agent-browser <PARAMS>` except for `pnpm dlx agent-browser install`: never run `pnpm dlx agent-browser install`.
- Stop the dev server at the end of every testing session.

## Testing

### Test Plan

See `docs/TEST_PLAN.md` for a comprehensive list of use cases to test, including:
- All CRUD operations (Create, Read, Update, Delete projects)
- Form validation scenarios
- Edge cases (invalid IDs, 404 handling)
- UI/UX considerations (responsive, dark mode, loading states)
- Priority levels (P0-P3) for what to test based on change type
- Regression checklist for common issues

### Browser Automation

**Important**: Always run tests in headless mode (the default). Only use `--headed` flag when explicitly requested by the user.

Use `agent-browser` for web automation. Run `pnpm dlx  agent-browser --help` for all commands.

Core workflow:
1. `pnpm dlx agent-browser open <url>` - Navigate to page
2. `pnpm dlx agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `pnpm dlx agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes
5. Stop the dev server at the end of every testing session.

### Quick Smoke Test

After any significant change:
```bash
pnpm build    # Should complete without errors
pnpm dev      # Start dev server, then test manually or with agent-browser
``` 