# Documentation

Welcome to the documentation for this Next.js CRUD sample application. These documents are designed to help you understand not just **what** the code does, but **why** it's structured this way.

## Purpose

This application is a **learning resource** for developers who:
- Know TypeScript and React basics
- Want to learn Next.js App Router patterns
- Want to understand production-ready architectures
- Are preparing to build real-world applications

## Reading Order

We recommend reading the documentation in this order:

### 1. [Architecture Overview](./01-architecture.md)
Start here to understand the big picture. This explains:
- Why we chose this tech stack
- High-level architectural patterns
- How data flows through the application
- What's intentionally missing (and why)

### 2. [Database Design and Patterns](./02-database.md)
Learn about the data layer:
- Why SQLite and better-sqlite3
- Schema design decisions
- Repository pattern implementation
- Boolean handling and type conversions
- When to use (and not use) an ORM

### 3. [Routing and Rendering](./03-routing-and-rendering.md)
Understand how Next.js handles pages:
- File-system routing
- Server vs Client Components
- The hybrid rendering pattern
- Dynamic routes and route groups
- Cache revalidation strategies

### 4. [Components and Styling](./04-components-and-styling.md)
Explore the component architecture:
- Two-tier component structure
- Radix UI integration
- Tailwind CSS v4 patterns
- Variant-based components with CVA
- Dark mode implementation

### 5. [Forms and Validation](./05-forms-and-validation.md)
Master forms in Next.js:
- Server Actions pattern
- useActionState hook (React 19)
- Zod validation
- Progressive enhancement
- Error handling across layers

## How to Use This Documentation

### For Learning

Read each document sequentially. They build on each other and reference concepts from previous documents.

### For Reference

Use the table of contents in each document to jump to specific topics. Each section is self-contained enough to be useful on its own.

### For Building

Apply these patterns to your own projects. The documentation explains not just how to implement features, but when and why to use each pattern.

## Key Concepts Across Documents

Certain concepts appear throughout the documentation:

- **Server Components**: Default in Next.js, run only on server
- **Client Components**: Marked with 'use client', run on both server and client
- **Server Actions**: Functions that run on the server, called from forms or client code
- **Repository Pattern**: Centralized database operations
- **Type Safety**: TypeScript + Zod for compile-time and runtime safety
- **Progressive Enhancement**: Works without JavaScript

## Beyond This Documentation

Once you understand these concepts, you're ready to:

1. **Add features**: Users, authentication, file uploads, etc.
2. **Scale up**: PostgreSQL, caching, API routes
3. **Add testing**: Vitest, Playwright, integration tests
4. **Deploy**: Vercel, Railway, or your own infrastructure

## Questions While Reading?

As you read, ask yourself:

- Why did they choose this approach?
- What are the trade-offs?
- How would this work in a larger application?
- What would I need to change for production?

The documentation tries to answer these questions, but if something's unclear, that's feedback for improving these docs!

## Contributing

This is a learning resource. If you find:
- Unclear explanations
- Missing concepts
- Better ways to explain something
- Errors or outdated information

Consider these opportunities to deepen your own understanding by researching the topic further.

## Next Steps

Start with [01-architecture.md](./01-architecture.md) and work your way through!
