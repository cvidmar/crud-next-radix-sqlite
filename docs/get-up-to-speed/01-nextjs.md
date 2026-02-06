# Next.js (v16 era) - A Practical Developer Tutorial

This is a concise, up-to-date Next.js "v16-era" tutorial. It focuses on what actually matters now: App Router, Server vs Client Components, data fetching and caching, Server Actions, layouts, and streaming. It's written for someone who already knows React + TypeScript and skips legacy concepts.

> Version note: As of early 2026, the stable Next.js line is still the App Router architecture introduced in v13 and evolved through v14-v15. This tutorial covers the current, stable mental model and APIs you need as a React + TypeScript developer. If v16 introduces incremental changes, they build on these same foundations.

## What Next.js Is (in one sentence)

Next.js is a full-stack React framework that gives you routing, data fetching, server rendering, caching, and deployment primitives out of the box.

Think of it as React + opinionated backend + build system + runtime model.

But if you're here, you probably already know all this. Read on.

## The Big Shift You Must Understand

If you used older Next.js (<=12):

- `pages/` router (legacy)
- `getServerSideProps`, `getStaticProps` (legacy)

Modern Next.js is built around:

- App Router (`app/` directory)
- React Server Components by default
- Async server functions instead of data-fetching APIs

Everything else flows from this.

## App Router Basics

### File-Based Routing

```text
app/
  layout.tsx
  page.tsx
  dashboard/
    page.tsx
    settings/
      page.tsx
```

- `page.tsx` -> a route
- folders -> URL segments
- nested folders -> nested routes

### Layouts (Persistent UI)

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

Layouts:

- persist across navigation
- do not re-render unless their props change
- are ideal for navbars, shells, auth wrappers

### Route Groups

```text
app/
  (auth)/
    login/
      page.tsx
  (marketing)/
    page.tsx
```

- Parentheses don't affect the URL
- Used for organization and layout separation

## Server vs Client Components (Critical Concept)

Default: Server Components

```tsx
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

Server Components:

- run on the server
- can access databases, secrets, filesystem
- reduce JS sent to the browser
- are async by default

### Client Components

```tsx
"use client";

export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

Client Components:

- required for hooks, state, effects, event handlers
- opt-in via `"use client"`
- can import Server Components, not the other way around

Rule of thumb: keep as much as possible on the server.

## Data Fetching Model

`fetch` is framework-aware:

```ts
await fetch("https://api.example.com/posts");
```

Next.js adds:

- request deduplication
- caching
- revalidation
- streaming

## Caching and Revalidation

```ts
fetch(url, { cache: "force-cache" }); // static
fetch(url, { cache: "no-store" }); // dynamic
fetch(url, { next: { revalidate: 60 } });
```

You control when data is cached and when it updates.

This replaces `getStaticProps` / `getServerSideProps`.

## Streaming and Suspense

```tsx
<Suspense fallback={<Loading />}>
  <Posts />
</Suspense>
```

- Pages stream HTML progressively
- Critical UI appears first
- Data loads incrementally

## Mutations: Server Actions

This is the modern way to handle forms and mutations.

```ts
export async function createPost(formData: FormData) {
  "use server";
  // write to DB
}
```

```tsx
<form action={createPost}>
  <input name="title" />
  <button type="submit">Save</button>
</form>
```

Benefits:

- no API route required
- type-safe
- runs on the server
- integrates with caching and revalidation

## Routing Extras

### Dynamic Routes

```text
app/posts/[slug]/page.tsx
```

```tsx
export default function Page({ params }) {
  return params.slug;
}
```

### Parallel Routes

```text
app/dashboard/@analytics/page.tsx
app/dashboard/@activity/page.tsx
```

- multiple slots rendered in parallel
- useful for complex dashboards

### Intercepting Routes

Used for modals that map to URLs without full navigation.

## Metadata and SEO

```ts
export const metadata = {
  title: "My Page",
  description: "SEO friendly",
};
```

Or dynamic:

```ts
export async function generateMetadata({ params }) {}
```

- fully server-side
- replaces `next/head`

## Styling Options

All work well:

- CSS Modules
- Global CSS
- Tailwind CSS (very common)
- CSS-in-JS (with Client Components)

App Router has no styling lock-in.

## Environment and Runtime

- Node.js runtime (default)
- Edge runtime (low latency, limited APIs)

```ts
export const runtime = "edge";
```

Choose per route.

## Deployment Model

First-class support:

- Vercel (native)
- Node servers
- Docker
- Serverless

Next.js is not frontend-only. It's a backend framework that renders React.

## What You Should Focus On First

If you already know React + TS:

1. App Router mental model
2. Server vs Client Components
3. Data fetching and caching rules
4. Server Actions
5. Layouts and streaming

Everything else is incremental.

## Common Mental Model (Helpful)

- Pages are async server functions
- Client Components are islands of interactivity
- `fetch` is a cache API, not just HTTP
- Navigation is server-driven by default

## When NOT to Use Next.js

- You want a purely static SPA with no backend concerns
- You already have a strong, separate backend and want full control
- You don't want opinionated routing/rendering

## Final Take

Modern Next.js is closer to Rails for React than a React add-on.

If you embrace:

- server-first thinking
- async rendering
- framework-managed data lifecycles

...it becomes very productive.
