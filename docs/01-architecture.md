# Architecture Overview

This document explains the high-level architecture of this Next.js CRUD application and the rationale behind key architectural decisions.

## Tech Stack

- **Next.js 16**: React framework with App Router
- **React 19**: Latest React with Server Components and Server Actions
- **TypeScript 5**: Type-safe development
- **Tailwind CSS v4**: Utility-first styling
- **postgres.js**: PostgreSQL client with connection pooling
- **Radix UI**: Unstyled, accessible component primitives
- **Zod v4**: Runtime validation and type inference

## Architecture Patterns

### 1. Server Components First

This application uses **Server Components by default**. This is the recommended pattern in modern Next.js applications.

**Benefits:**
- Direct database access without API routes
- Automatic code splitting
- Better performance (less JavaScript sent to client)
- Simpler data fetching

**Example:**
```typescript
// app/(dashboard)/page.tsx
export default async function DashboardPage() {
  // Direct database call in a Server Component
  const projects = getAllProjects();
  return <ProjectList projects={projects} />;
}
```

Components only become Client Components when they need:
- Interactivity (onClick, onChange, etc.)
- Browser APIs
- React hooks (useState, useEffect, etc.)

### 2. Server Actions for Mutations

Instead of API routes, we use **Server Actions** for data mutations (create, update, delete).

**Why Server Actions?**
- Type-safe: Arguments and return types are checked at compile time
- No need to define API routes
- Works without JavaScript (progressive enhancement)
- Automatic request deduplication
- Integrated with React 19's useActionState hook

**Example:**
```typescript
// lib/actions/projects.ts
'use server';

export async function createProject(formData: FormData) {
  // Validate, create, redirect
}
```

### 3. Hybrid Components Pattern

Our forms demonstrate the **hybrid pattern**: Server Components rendering Client Components.

```
Server Component (page.tsx)
  ├─ fetches data from database
  ├─ passes Server Action as prop
  └─ renders Client Component (ProjectForm)
       └─ uses hooks for interactivity
       └─ calls Server Action on submit
```

This gives us:
- Server-side data fetching
- Client-side interactivity
- Type-safe communication between layers

### 4. Repository Pattern for Database

All database operations are centralized in **repository functions** (`lib/db/projects.ts`).

**Benefits:**
- Single source of truth for queries
- Easy to test
- Can swap database implementation without changing app code
- Type-safe with TypeScript interfaces

### 5. Component Organization

We follow a clear component hierarchy:

```
components/
  ui/              # Generic UI primitives (Button, Input, etc.)
  dashboard/       # Application-specific components
```

**UI components** are generic and reusable across any project.
**Dashboard components** contain business logic specific to this app.

## Data Flow

### Reading Data (Server Components)
```
User requests page
  → Next.js renders Server Component
  → Component calls repository function
  → Repository queries SQLite
  → Data returned to component
  → HTML rendered on server
  → Sent to browser
```

### Writing Data (Server Actions)
```
User submits form
  → Form data sent to Server Action
  → Zod validates input
  → Repository function mutates database
  → revalidatePath() clears cache
  → redirect() sends user to new page
```

## Why This Architecture?

This architecture is designed to teach **production-ready patterns** that you'll see in real-world applications:

1. **Performance**: Server Components reduce JavaScript bundle size
2. **Security**: Database credentials never exposed to client
3. **Type Safety**: TypeScript + Zod catch errors early
4. **Developer Experience**: Less boilerplate than traditional REST APIs
5. **Progressive Enhancement**: Works even without JavaScript enabled
6. **Scalability**: Repository pattern makes it easy to add caching, logging, etc.

## What's Missing (Intentionally)

To keep the focus on core patterns, we've omitted:

- Authentication (would add complexity)
- Testing (out of scope for this example)
- API routes (Server Actions are sufficient)
- Complex state management (React 19 handles it)
- ORM (raw SQL teaches fundamentals)

These can be added later as you scale the application.
