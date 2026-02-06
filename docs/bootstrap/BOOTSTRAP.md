# Learning Readings Factory - Bootstrap Kit

This document provides everything needed to bootstrap the "Learning Readings Factory" production application. It is **fully self-contained** - all code snippets, component source code, and patterns are embedded directly in this document. No external repository access is required.

The patterns and components originate from a sample CRUD application and have been adapted for production requirements like authentication, multi-tenancy, file uploads, and async processing.

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Architecture Patterns](#2-architecture-patterns)
3. [Database Layer (Drizzle)](#3-database-layer-drizzle)
4. [Authentication (Google OAuth)](#4-authentication-google-oauth)
5. [UI Components](#5-ui-components)
6. [File Upload Pattern](#6-file-upload-pattern)
7. [Async Processing Pattern](#7-async-processing-pattern)
8. [i18n Setup](#8-i18n-setup)
9. [Implementation Order](#9-implementation-order)

---

## 1. Project Setup

### 1.1 Dependencies

```json
{
  "dependencies": {
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",

    "drizzle-orm": "^0.38.0",
    "better-sqlite3": "12.6.2",
    "@types/better-sqlite3": "^7.6.13",

    "arctic": "^3.5.0",

    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",

    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0",
    "zod": "^4.0.0",

    "next-intl": "^4.2.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "typescript": "^5",
    "drizzle-kit": "^0.30.0",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.6"
  }
}
```

### 1.2 Environment Variables Template

Create `.env.local`:

```bash
# Database
DATABASE_PATH=./data/app.db

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Session
SESSION_SECRET=generate-a-random-32-char-string

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=50

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 1.3 Directory Structure

```
app/
  (auth)/
    login/page.tsx              # Login page with Google button
    layout.tsx                  # Auth pages layout (no sidebar)
  (dashboard)/
    layout.tsx                  # Dashboard layout with sidebar + org context
    page.tsx                    # Org readings list
    readings/
      new/page.tsx              # Upload new reading
      [id]/page.tsx             # View reading + status
      [id]/edit/page.tsx        # Edit reading metadata
    settings/
      page.tsx                  # Org settings
      users/page.tsx            # User management
  api/
    auth/
      login/google/route.ts     # Initiate Google OAuth
      callback/google/route.ts  # OAuth callback
      logout/route.ts           # Clear session
    readings/
      [id]/status/route.ts      # Poll processing status
lib/
  db/
    index.ts                    # Drizzle instance
    schema.ts                   # Drizzle schema definitions
    migrate.ts                  # Migration runner
    repositories/
      users.ts
      orgs.ts
      org-users.ts
      readings.ts
  auth/
    session.ts                  # Session management
    middleware.ts               # Auth + org middleware
    google.ts                   # Arctic Google OAuth
  actions/
    readings.ts                 # Reading Server Actions
    settings.ts                 # Settings Server Actions
  validations/
    reading.ts                  # Zod schemas
    settings.ts
  utils.ts                      # cn(), formatDate, etc.
  i18n/
    config.ts                   # next-intl config
    request.ts                  # getRequestConfig
components/
  ui/                           # UI components (full source in Section 5)
  dashboard/
    sidebar.tsx                 # Adapted for new nav structure
    mobile-nav.tsx              # Adapted for new nav
    org-switcher.tsx            # Org selection dropdown
    reading-form.tsx            # Reading upload form
    reading-status.tsx          # Status display with polling
    user-table.tsx              # User management table
messages/
  en.json                       # English translations
  es.json                       # Spanish translations (example)
middleware.ts                   # Auth/org middleware
drizzle.config.ts               # Drizzle Kit config
data/
  app.db                        # SQLite database (gitignored)
uploads/                        # File uploads (gitignored)
```

### 1.4 Configuration Files

**drizzle.config.ts**
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_PATH || './data/app.db',
  },
} satisfies Config;
```

**middleware.ts**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ['/login', '/api/auth'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (!sessionCookie && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (sessionCookie && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 2. Architecture Patterns

### 2.1 Server Components vs Client Components Decision Tree

```
Is interactivity needed?
├── NO → Server Component (default)
│   ├── Database access: Direct queries
│   ├── Auth check: Check session directly
│   └── Data display: Render HTML on server
│
└── YES → Client Component ('use client')
    ├── Forms with validation feedback
    ├── Dialogs/modals
    ├── Dropdowns/selects
    ├── Polling/real-time updates
    └── File upload with progress
```

### 2.2 API Routes vs Server Actions

| Use Case | Choice | Reason |
|----------|--------|--------|
| Form submission | Server Action | Progressive enhancement, type-safe |
| File upload | Server Action | FormData handling built-in |
| Status polling | API Route | Need GET endpoint for client fetch |
| OAuth callback | API Route | External redirect target |
| Webhook receiver | API Route | External POST target |

### 2.3 Authorization Middleware Pattern

```typescript
// lib/auth/middleware.ts

import { getSession } from './session';
import { getOrgUser } from '@/lib/db/repositories/org-users';
import { redirect } from 'next/navigation';

/**
 * Verify user is authenticated
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

/**
 * Verify user belongs to the org from URL params
 */
export async function requireOrgAccess(orgId: string) {
  const session = await requireAuth();

  const orgUser = await getOrgUser(orgId, session.userId);
  if (!orgUser) {
    redirect('/'); // Or show 403
  }

  return { session, orgUser };
}

/**
 * Verify user is org admin
 */
export async function requireOrgAdmin(orgId: string) {
  const { session, orgUser } = await requireOrgAccess(orgId);

  if (orgUser.role !== 'admin') {
    redirect(`/orgs/${orgId}`); // Or show 403
  }

  return { session, orgUser };
}
```

**Usage in Server Components:**
```typescript
// app/(dashboard)/orgs/[orgId]/settings/page.tsx

import { requireOrgAdmin } from '@/lib/auth/middleware';

export default async function SettingsPage({
  params
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params;
  const { session, orgUser } = await requireOrgAdmin(orgId);

  // Now safely render admin content
  return <SettingsForm org={...} />;
}
```

### 2.4 File Storage Conventions

```
uploads/
  {orgId}/
    readings/
      {readingId}/
        original.pdf           # Original uploaded file
        processed/
          text.json            # Extracted text by page
          metadata.json        # Processing metadata
```

---

## 3. Database Layer (Drizzle)

### 3.1 Schema Definition

```typescript
// lib/db/schema.ts

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  googleId: text('google_id').unique(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// Organizations table
export const orgs = sqliteTable('orgs', {
  id: text('id').primaryKey(), // UUID
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  language: text('language').notNull().default('en'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// Org-User membership
export const orgUsers = sqliteTable('org_users', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['admin', 'member'] }).notNull().default('member'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// Readings table
export const readings = sqliteTable('readings', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  originalFilename: text('original_filename').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  status: text('status', {
    enum: ['queued', 'processing', 'completed', 'failed']
  }).notNull().default('queued'),
  processingError: text('processing_error'),
  processedAt: text('processed_at'),
  createdById: text('created_by_id').notNull().references(() => users.id),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Org = typeof orgs.$inferSelect;
export type NewOrg = typeof orgs.$inferInsert;
export type OrgUser = typeof orgUsers.$inferSelect;
export type Reading = typeof readings.$inferSelect;
export type NewReading = typeof readings.$inferInsert;
```

### 3.2 Database Instance

```typescript
// lib/db/index.ts

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'app.db');

// Ensure directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
```

### 3.3 Repository Pattern with Drizzle

```typescript
// lib/db/repositories/readings.ts

import { db } from '../index';
import { readings, type Reading, type NewReading } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getReadingsByOrg(orgId: string): Promise<Reading[]> {
  return db.select()
    .from(readings)
    .where(eq(readings.orgId, orgId))
    .orderBy(desc(readings.createdAt));
}

export async function getReadingById(id: string): Promise<Reading | undefined> {
  const results = await db.select()
    .from(readings)
    .where(eq(readings.id, id))
    .limit(1);
  return results[0];
}

export async function createReading(input: NewReading): Promise<Reading> {
  const results = await db.insert(readings)
    .values(input)
    .returning();
  return results[0];
}

export async function updateReadingStatus(
  id: string,
  status: Reading['status'],
  error?: string
): Promise<Reading | undefined> {
  const updates: Partial<Reading> = {
    status,
    updatedAt: new Date().toISOString(),
  };

  if (status === 'completed') {
    updates.processedAt = new Date().toISOString();
  }
  if (error) {
    updates.processingError = error;
  }

  const results = await db.update(readings)
    .set(updates)
    .where(eq(readings.id, id))
    .returning();
  return results[0];
}

export async function deleteReading(id: string): Promise<boolean> {
  const result = await db.delete(readings)
    .where(eq(readings.id, id));
  return result.changes > 0;
}
```

### 3.4 Migration Workflow

```bash
# Generate migration after schema change
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Open Drizzle Studio for debugging
npx drizzle-kit studio
```

### 3.5 Transaction Handling

```typescript
import { db } from '../index';

// For operations that need atomicity
export async function createOrgWithAdmin(
  orgData: NewOrg,
  adminUserId: string
): Promise<Org> {
  return db.transaction(async (tx) => {
    const [org] = await tx.insert(orgs).values(orgData).returning();

    await tx.insert(orgUsers).values({
      id: crypto.randomUUID(),
      orgId: org.id,
      userId: adminUserId,
      role: 'admin',
    });

    return org;
  });
}
```

---

## 4. Authentication (Google OAuth)

### 4.1 Arctic Setup

```typescript
// lib/auth/google.ts

import { Google } from 'arctic';

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI!
);
```

### 4.2 Session Management

```typescript
// lib/auth/session.ts

import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface Session {
  userId: string;
  email: string;
  name: string;
}

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies();

  // In production, use signed/encrypted tokens (jose, iron-session, etc.)
  // This is simplified for learning
  const sessionData = Buffer.from(JSON.stringify({ userId })).toString('base64');

  cookieStore.set(SESSION_COOKIE, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie) return null;

  try {
    const { userId } = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    );

    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return null;

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
```

### 4.3 OAuth Routes

```typescript
// app/api/auth/login/google/route.ts

import { NextResponse } from 'next/server';
import { google } from '@/lib/auth/google';
import { generateState, generateCodeVerifier } from 'arctic';
import { cookies } from 'next/headers';

export async function GET() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = google.createAuthorizationURL(state, codeVerifier, [
    'openid',
    'email',
    'profile',
  ]);

  const cookieStore = await cookies();

  cookieStore.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  cookieStore.set('google_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  });

  return NextResponse.redirect(url);
}
```

```typescript
// app/api/auth/callback/google/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { google } from '@/lib/auth/google';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createSession } from '@/lib/auth/session';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookieStore = await cookies();
  const storedState = cookieStore.get('google_oauth_state')?.value;
  const codeVerifier = cookieStore.get('google_code_verifier')?.value;

  if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);

    // Fetch user info from Google
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.accessToken()}` },
    });

    const googleUser = await response.json();

    // Find or create user
    let [user] = await db.select()
      .from(users)
      .where(eq(users.googleId, googleUser.id))
      .limit(1);

    if (!user) {
      // Check if email exists (link accounts)
      [user] = await db.select()
        .from(users)
        .where(eq(users.email, googleUser.email))
        .limit(1);

      if (user) {
        // Link Google ID to existing account
        await db.update(users)
          .set({ googleId: googleUser.id })
          .where(eq(users.id, user.id));
      } else {
        // Create new user
        const [newUser] = await db.insert(users)
          .values({
            id: crypto.randomUUID(),
            email: googleUser.email,
            name: googleUser.name,
            avatarUrl: googleUser.picture,
            googleId: googleUser.id,
          })
          .returning();
        user = newUser;
      }
    }

    await createSession(user.id);

    // Clean up OAuth cookies
    cookieStore.delete('google_oauth_state');
    cookieStore.delete('google_code_verifier');

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }
}
```

```typescript
// app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/session';

export async function POST() {
  await destroySession();
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL));
}
```

### 4.4 Login Page

```typescript
// app/(auth)/login/page.tsx

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Learning Readings Factory</h1>
          <p className="text-slate-500">Sign in to manage your readings</p>
        </div>

        <Button asChild className="w-full" size="lg">
          <Link href="/api/auth/login/google">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              {/* Google icon SVG */}
            </svg>
            Continue with Google
          </Link>
        </Button>
      </div>
    </div>
  );
}
```

---

## 5. UI Components

All UI components are included below with full source code. Create these files in your new project.

### 5.1 Button Component (components/ui/button.tsx)

```typescript
/**
 * Button Component
 *
 * A reusable button component with multiple variants and sizes.
 * Uses class-variance-authority (CVA) for managing variants.
 *
 * The `asChild` prop uses Radix UI's Slot component to merge props
 * onto a child element, enabling patterns like <Button asChild><Link>...</Link></Button>
 * without nesting interactive elements (which is invalid HTML).
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

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
 * <Button asChild><Link href="/path">Link styled as button</Link></Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### 5.2 Input Component (components/ui/input.tsx)

```typescript
/**
 * Input Component
 *
 * A styled text input component that matches our design system.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm ring-offset-white transition-colors',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-slate-500 dark:placeholder:text-slate-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
```

### 5.3 Textarea Component (components/ui/textarea.tsx)

```typescript
/**
 * Textarea Component
 *
 * A styled textarea component for multi-line text input.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[120px] w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm ring-offset-white',
          'placeholder:text-slate-500 dark:placeholder:text-slate-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
```

### 5.4 Label Component (components/ui/label.tsx)

```typescript
/**
 * Label Component
 *
 * A styled label component for form inputs.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        {...props}
      />
    );
  }
);
Label.displayName = 'Label';

export { Label };
```

### 5.5 Select Component (components/ui/select.tsx)

```typescript
/**
 * Select Component
 *
 * A custom select dropdown built with Radix UI primitives.
 */

'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/utils';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm ring-offset-white',
      'placeholder:text-slate-500',
      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <svg
        className="h-4 w-4 opacity-50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 shadow-md',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pl-8 pr-2 text-xs font-semibold', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
      'focus:bg-slate-100 dark:focus:bg-slate-800',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-slate-100 dark:bg-slate-800', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
```

### 5.6 Switch Component (components/ui/switch.tsx)

```typescript
/**
 * Switch Component
 *
 * A toggle switch built with Radix UI Switch primitive.
 */

'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
        'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
```

### 5.7 Dialog Component (components/ui/dialog.tsx)

```typescript
/**
 * Dialog Component
 *
 * A modal dialog built with Radix UI Dialog primitive.
 */

'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-950 p-6 shadow-lg duration-200',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        'rounded-lg',
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:pointer-events-none">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-slate-500 dark:text-slate-400', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
```

### 5.8 Mobile Navigation Component (components/dashboard/mobile-nav.tsx)

```typescript
'use client';

/**
 * Mobile Navigation Component
 *
 * Provides a hamburger menu button and slide-out drawer for mobile devices.
 */

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { Sidebar } from './sidebar';

interface MobileNavProps {
  user: { name: string };
  orgs: Array<{ id: string; name: string }>;
}

export function MobileNav({ user, orgs }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
          aria-label="Open navigation menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-background z-50 flex flex-col shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-300">
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="Close navigation menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </Dialog.Close>

          <Sidebar user={user} orgs={orgs} onNavigate={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### 5.9 Sidebar Component (components/dashboard/sidebar.tsx)

```typescript
/**
 * Sidebar Component
 *
 * Reusable sidebar content for desktop and mobile layouts.
 */

import Link from 'next/link';

interface SidebarProps {
  user: { name: string };
  orgs: Array<{ id: string; name: string }>;
  onNavigate?: () => void;
}

export function Sidebar({ user, orgs, onNavigate }: SidebarProps) {
  // Get initials from name
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Logo / Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="size-7 bg-primary rounded flex items-center justify-center text-white">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Readings Factory
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6">
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-3">
            Overview
          </div>
          <Link
            href="/"
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-900 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            Readings
          </Link>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-3">
            Organization
          </div>
          <Link
            href="/settings"
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </Link>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 px-2">
          <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{user.name}</p>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-[10px] text-slate-500 hover:text-primary transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
```

### 5.10 Utility Functions (lib/utils.ts)

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return formatDate(d);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

### 5.3 Global Styles (app/globals.css)

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
  --primary: #135bec;
}

/* Drawer/Dialog animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slide-in-from-left {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes slide-out-to-left {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}

/* Animation utility classes */
.animate-in {
  animation-duration: 200ms;
  animation-timing-function: ease-out;
  animation-fill-mode: both;
}

.animate-out {
  animation-duration: 150ms;
  animation-timing-function: ease-in;
  animation-fill-mode: both;
}

.fade-in-0 { animation-name: fade-in; }
.fade-out-0 { animation-name: fade-out; }
.slide-in-from-left { animation-name: slide-in-from-left; }
.slide-out-to-left { animation-name: slide-out-to-left; }

/* Spinner animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

### 5.4 Adapted Dashboard Layout

```typescript
// app/(dashboard)/layout.tsx

import { Sidebar } from '@/components/dashboard/sidebar';
import { MobileNav } from '@/components/dashboard/mobile-nav';
import { OrgSwitcher } from '@/components/dashboard/org-switcher';
import { getSession } from '@/lib/auth/session';
import { getUserOrgs } from '@/lib/db/repositories/org-users';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const orgs = await getUserOrgs(session.userId);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 dark:border-slate-700 flex-col bg-white dark:bg-background shrink-0">
        <Sidebar user={session} orgs={orgs} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 flex items-center justify-between px-4 bg-white dark:bg-background border-b border-slate-200 dark:border-slate-700 shrink-0">
          <MobileNav user={session} orgs={orgs} />
          <h1 className="text-sm font-semibold tracking-tight absolute left-1/2 -translate-x-1/2">
            Readings Factory
          </h1>
          <OrgSwitcher orgs={orgs} compact />
        </header>

        {/* Page Content */}
        <main className="flex-1 flex flex-col bg-slate-50/50 dark:bg-[#0c0c0e] overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 5.5 Form Pattern with useActionState

```typescript
// components/dashboard/reading-form.tsx

'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

interface ReadingFormProps {
  action: any;
  submitLabel?: string;
}

export function ReadingForm({ action, submitLabel = 'Upload' }: ReadingFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          type="text"
          placeholder="e.g. Chapter 5 - Introduction to Biology"
          required
        />
        {state?.errors?.title && (
          <p className="text-sm text-red-600">{state.errors.title[0]}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Brief description of this reading..."
        />
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label htmlFor="file">PDF File</Label>
        <Input
          id="file"
          name="file"
          type="file"
          accept=".pdf"
          required
        />
        {state?.errors?.file && (
          <p className="text-sm text-red-600">{state.errors.file[0]}</p>
        )}
      </div>

      {/* Error message */}
      {state?.message && !state?.success && (
        <div className="rounded-lg border border-red-200 bg-red-50/30 p-4">
          <p className="text-sm text-red-600">{state.message}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button asChild variant="ghost">
          <Link href="/">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Uploading...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
```

---

## 6. File Upload Pattern

### 6.1 Server Action for Upload

```typescript
// lib/actions/readings.ts

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { createReading } from '@/lib/db/repositories/readings';
import { createReadingSchema } from '@/lib/validations/reading';
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024);

export async function uploadReading(
  orgId: string,
  prevState: any,
  formData: FormData
) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Unauthorized' };
  }

  const file = formData.get('file') as File | null;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;

  // Validate
  const validation = createReadingSchema.safeParse({ title, description });
  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  if (!file || file.size === 0) {
    return {
      success: false,
      errors: { file: ['Please select a PDF file'] },
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      errors: { file: [`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`] },
    };
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return {
      success: false,
      errors: { file: ['Only PDF files are allowed'] },
    };
  }

  let readingId: string;

  try {
    readingId = crypto.randomUUID();

    // Create upload directory
    const uploadPath = path.join(UPLOAD_DIR, orgId, 'readings', readingId);
    await fs.mkdir(uploadPath, { recursive: true });

    // Save file
    const filePath = path.join(uploadPath, 'original.pdf');
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Create database record
    await createReading({
      id: readingId,
      orgId,
      title: validation.data.title,
      description: validation.data.description || null,
      originalFilename: file.name,
      filePath,
      fileSize: file.size,
      status: 'queued',
      createdById: session.userId,
    });

    // Trigger async processing (fire and forget)
    // In production, use a proper job queue
    triggerProcessing(readingId).catch(console.error);

    revalidatePath('/');
  } catch (error) {
    console.error('Upload failed:', error);
    return {
      success: false,
      message: 'Failed to upload reading. Please try again.',
    };
  }

  redirect(`/readings/${readingId}`);
}

async function triggerProcessing(readingId: string) {
  // Placeholder for async processing
  // In reality, this would queue a job
  console.log(`Queued processing for reading: ${readingId}`);
}
```

### 6.2 Validation Schema

```typescript
// lib/validations/reading.ts

import { z } from 'zod';

export const createReadingSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
});

export type CreateReadingInput = z.infer<typeof createReadingSchema>;
```

---

## 7. Async Processing Pattern

### 7.1 Status Polling API Route

```typescript
// app/api/readings/[id]/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getReadingById } from '@/lib/db/repositories/readings';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const reading = await getReadingById(id);

  if (!reading) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // TODO: Verify user has access to this reading's org

  return NextResponse.json({
    status: reading.status,
    error: reading.processingError,
    processedAt: reading.processedAt,
  });
}
```

### 7.2 Client-Side Polling Component

```typescript
// components/dashboard/reading-status.tsx

'use client';

import { useEffect, useState } from 'react';

interface ReadingStatusProps {
  readingId: string;
  initialStatus: string;
}

export function ReadingStatus({ readingId, initialStatus }: ReadingStatusProps) {
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'completed' || status === 'failed') {
      return; // Stop polling
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/readings/${readingId}/status`);
        const data = await response.json();

        setStatus(data.status);
        if (data.error) setError(data.error);

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [readingId, status]);

  const statusConfig = {
    queued: {
      label: 'Queued',
      color: 'bg-slate-100 text-slate-700',
      icon: '⏳',
    },
    processing: {
      label: 'Processing',
      color: 'bg-blue-100 text-blue-700',
      icon: '⚙️',
      showSpinner: true,
    },
    completed: {
      label: 'Completed',
      color: 'bg-green-100 text-green-700',
      icon: '✓',
    },
    failed: {
      label: 'Failed',
      color: 'bg-red-100 text-red-700',
      icon: '✗',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.queued;

  return (
    <div className="space-y-2">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}>
        {config.showSpinner ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        ) : (
          <span>{config.icon}</span>
        )}
        {config.label}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
```

### 7.3 Background Job Pattern (Placeholder)

```typescript
// lib/jobs/process-reading.ts

import { updateReadingStatus, getReadingById } from '@/lib/db/repositories/readings';

/**
 * In production, this would be:
 * - A separate worker process
 * - Using a job queue (BullMQ, Inngest, etc.)
 * - With proper retry logic
 *
 * For learning, we simulate with setTimeout
 */
export async function processReading(readingId: string) {
  const reading = await getReadingById(readingId);
  if (!reading) return;

  // Mark as processing
  await updateReadingStatus(readingId, 'processing');

  try {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 5000));

    // TODO: Actual processing logic
    // 1. Read PDF
    // 2. Extract text
    // 3. Save processed data

    await updateReadingStatus(readingId, 'completed');
  } catch (error) {
    await updateReadingStatus(
      readingId,
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
```

---

## 8. i18n Setup

### 8.1 next-intl Configuration

```typescript
// lib/i18n/config.ts

export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';
```

```typescript
// lib/i18n/request.ts

import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // Get locale from org settings or cookie
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'en';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

### 8.2 Translation Files

```json
// messages/en.json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading..."
  },
  "readings": {
    "title": "Readings",
    "upload": "Upload Reading",
    "status": {
      "queued": "Queued",
      "processing": "Processing",
      "completed": "Completed",
      "failed": "Failed"
    }
  },
  "settings": {
    "title": "Settings",
    "language": "Language"
  }
}
```

```json
// messages/es.json
{
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "loading": "Cargando..."
  },
  "readings": {
    "title": "Lecturas",
    "upload": "Subir Lectura",
    "status": {
      "queued": "En cola",
      "processing": "Procesando",
      "completed": "Completado",
      "failed": "Error"
    }
  },
  "settings": {
    "title": "Configuración",
    "language": "Idioma"
  }
}
```

### 8.3 Usage in Components

```typescript
// Server Component
import { getTranslations } from 'next-intl/server';

export default async function ReadingsPage() {
  const t = await getTranslations('readings');

  return (
    <h1>{t('title')}</h1>
  );
}
```

```typescript
// Client Component
'use client';

import { useTranslations } from 'next-intl';

export function UploadButton() {
  const t = useTranslations('readings');

  return (
    <Button>{t('upload')}</Button>
  );
}
```

---

## 9. Implementation Order

Follow these slices in order, verifying each before moving to the next:

### Slice 1: Foundation
- [ ] Initialize Next.js project with dependencies
- [ ] Set up Drizzle with SQLite
- [ ] Create base schema (users, orgs, orgUsers)
- [ ] Create UI components (from Section 5)
- [ ] Set up global styles

**Verification:** Run `pnpm dev`, see empty dashboard with styling

### Slice 2: Authentication
- [ ] Set up Arctic with Google OAuth
- [ ] Implement session management
- [ ] Create login/callback/logout routes
- [ ] Add auth middleware
- [ ] Create login page

**Verification:** Can log in with Google, session persists

### Slice 3: Multi-tenancy
- [ ] Add org switcher component
- [ ] Implement org-scoped routes
- [ ] Add authorization middleware
- [ ] Create org settings page

**Verification:** User sees only their orgs, can switch between them

### Slice 4: Readings CRUD
- [ ] Add readings table to schema
- [ ] Create readings repository
- [ ] Build upload form with Server Action
- [ ] Implement file storage
- [ ] Create readings list page

**Verification:** Can upload PDF, see it in list

### Slice 5: Async Processing
- [ ] Add status polling API route
- [ ] Create status component with polling
- [ ] Implement placeholder job processor
- [ ] Add status transitions

**Verification:** Upload shows queued → processing → completed

### Slice 6: Polish
- [ ] Add i18n with next-intl
- [ ] Implement org language settings
- [ ] Add user management for admins
- [ ] Error handling and edge cases

**Verification:** Can switch languages, manage org users

---

## Appendix: Quick Reference

### Server Action Pattern

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function myAction(prevState: any, formData: FormData) {
  // 1. Authenticate
  const session = await getSession();
  if (!session) return { success: false, message: 'Unauthorized' };

  // 2. Validate
  const validation = schema.safeParse(Object.fromEntries(formData));
  if (!validation.success) {
    return { success: false, errors: validation.error.flatten().fieldErrors };
  }

  // 3. Execute
  try {
    await doSomething(validation.data);
    revalidatePath('/');
  } catch (error) {
    return { success: false, message: 'Operation failed' };
  }

  // 4. Redirect (outside try/catch)
  redirect('/success');
}
```

### Drizzle Query Patterns

```typescript
// Select with filter
const results = await db.select()
  .from(table)
  .where(eq(table.column, value))
  .orderBy(desc(table.createdAt));

// Insert returning
const [inserted] = await db.insert(table)
  .values(data)
  .returning();

// Update with condition
await db.update(table)
  .set({ column: value })
  .where(eq(table.id, id));

// Delete
const result = await db.delete(table)
  .where(eq(table.id, id));
```

### Component Pattern Decision

| Need | Use |
|------|-----|
| Display data | Server Component |
| Form with feedback | Client Component + useActionState |
| Modal/dialog | Client Component |
| Dropdown/select | Client Component |
| Static navigation | Server Component |
| Interactive nav (mobile) | Client Component |
| Data fetching | Server Component (async) |
| Polling/websocket | Client Component |
| Link styled as button | `<Button asChild><Link>...</Link></Button>` |
