# Routing and Rendering Patterns

This document explains how Next.js App Router handles routing and rendering in this application.

## App Router Fundamentals

Next.js uses a **file-system based router**. The file structure in `app/` determines your routes.

### Our Route Structure

```
app/
  layout.tsx                    # Root layout (all pages)
  page.tsx                      # Homepage (not used, redirects)
  (dashboard)/                  # Route group (doesn't affect URL)
    layout.tsx                  # Dashboard layout (sidebar)
    page.tsx                    # /  (project list)
    projects/
      new/
        page.tsx                # /projects/new
      [id]/
        page.tsx                # /projects/123
        edit/
          page.tsx              # /projects/123/edit
```

## Route Groups: `(dashboard)`

The parentheses in `(dashboard)` create a **route group**. This means:

- Folder doesn't appear in the URL
- Can have its own layout
- Useful for organizing related routes

**Without route group:**
- URL would be: `/dashboard/projects/123`

**With route group:**
- URL is: `/projects/123`
- Still gets the dashboard layout (sidebar, header)

### Why use route groups?

```typescript
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />      {/* Persists across all dashboard pages */}
      <main>{children}</main>
    </div>
  );
}
```

All pages in `(dashboard)/` automatically get the sidebar, without "dashboard" in the URL.

## Dynamic Routes: `[id]`

Folders with `[brackets]` are **dynamic segments**.

```
app/(dashboard)/projects/[id]/page.tsx
```

This matches any URL like:
- `/projects/1`
- `/projects/42`
- `/projects/abc123`

### Accessing Route Parameters

In Next.js 16, params are async:

```typescript
export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;  // Must await in Next.js 16
  const projectId = parseInt(id, 10);

  const project = getProjectById(projectId);
  // ...
}
```

**Type Safety:**

```typescript
interface PageProps {
  params: Promise<{
    id: string;  // Always a string, even if number in URL
  }>;
}
```

## Server vs Client Components

### Server Components (Default)

Files **without** `'use client'` are Server Components:

```typescript
// app/(dashboard)/page.tsx
export default async function DashboardPage() {
  const projects = getAllProjects();  // Direct DB access
  return <div>...</div>;
}
```

**Characteristics:**
- Run only on the server
- Can `async/await` directly
- Can access database, file system, etc.
- Don't add JavaScript to bundle
- Can't use hooks or event handlers

### Client Components

Files **with** `'use client'` are Client Components:

```typescript
// components/dashboard/project-form.tsx
'use client';

export function ProjectForm({ action }) {
  const [state, formAction, isPending] = useActionState(action, null);
  // ...
}
```

**Characteristics:**
- Run on server **and** client
- Can use hooks (useState, useEffect, etc.)
- Can have event handlers
- Add JavaScript to bundle
- Can't directly access server resources

### The Hybrid Pattern

Most pages follow this pattern:

```
┌─────────────────────────────────────┐
│ Server Component (page.tsx)        │
│  - Fetches data                    │
│  - Creates Server Action           │
│  └─ Renders Client Component       │
│      - Uses hooks                  │
│      - Handles interactivity       │
│      - Calls Server Action         │
└─────────────────────────────────────┘
```

**Example:**

```typescript
// Server Component
export default async function NewProjectPage() {
  return <ProjectForm action={createProject} />;  // Pass Server Action
}

// Client Component
'use client';
export function ProjectForm({ action }) {
  const [state, formAction] = useActionState(action, null);
  return <form action={formAction}>...</form>;
}
```

## Rendering Strategies

### Static Rendering (Default)

Pages without dynamic data are **pre-rendered at build time**:

```typescript
export default function AboutPage() {
  return <div>Static content</div>;
}
```

Built once, served to all users instantly.

### Dynamic Rendering

Pages become dynamic when they use:
- Database queries
- Cookies/headers
- Dynamic functions (searchParams, etc.)

```typescript
export default async function DashboardPage() {
  const projects = getAllProjects();  // Makes it dynamic
  return <ProjectList projects={projects} />;
}
```

Each request runs the component on the server.

### Partial Pre-rendering (Future)

Next.js is moving toward **Partial Pre-rendering**, where:
- Static parts are pre-rendered
- Dynamic parts stream in

This is automatic in future versions.

## Layouts and Nested Routes

Layouts **wrap their children** and **persist across navigation**:

```typescript
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div>
      <Sidebar />    {/* Doesn't re-render on navigation */}
      {children}     {/* This changes */}
    </div>
  );
}
```

When navigating from `/projects/1` to `/projects/2`:
- Sidebar stays mounted (keeps state)
- Only `children` changes

## Loading and Error States

Next.js supports special files for loading and errors:

```
app/(dashboard)/
  loading.tsx      # Shown while page loads
  error.tsx        # Shown when page errors
  not-found.tsx    # Shown for 404s
```

We use `notFound()` helper instead:

```typescript
import { notFound } from 'next/navigation';

export default async function ProjectPage({ params }) {
  const project = getProjectById(id);

  if (!project) {
    notFound();  // Triggers 404 page
  }

  return <div>...</div>;
}
```

## Navigation

### Client-Side Navigation

Use `<Link>` for navigation:

```typescript
import Link from 'next/link';

<Link href="/projects/new">
  <Button>New Project</Button>
</Link>
```

This does client-side navigation (no full page reload).

### Programmatic Navigation

Use `redirect()` in Server Actions:

```typescript
'use server';

export async function createProject(formData) {
  const project = dbCreateProject(data);
  redirect(`/projects/${project.id}`);  // Navigate after create
}
```

## Cache Revalidation

After mutations, revalidate affected pages:

```typescript
'use server';

export async function updateProject(id, formData) {
  dbUpdateProject({ id, ...data });

  revalidatePath('/');              // Revalidate list page
  revalidatePath(`/projects/${id}`); // Revalidate detail page

  redirect(`/projects/${id}`);
}
```

This ensures users see fresh data without manual refresh.

## Summary: When to Use What

| Scenario | Pattern |
|----------|---------|
| Page needs data | Server Component with async/await |
| Page needs interactivity | Client Component with 'use client' |
| Form submission | Server Action + useActionState |
| Navigation | `<Link>` or `redirect()` |
| Show 404 | `notFound()` helper |
| Persist UI across pages | Layout component |
| Group routes | Route group `(name)` |
| Dynamic route | `[param]` folder |
