# Database Design and Patterns

This document explains how the database layer works and why we made specific design decisions.

## Database Choice: PostgreSQL with postgres.js

We use **PostgreSQL** with the **postgres.js** library for several reasons:

### Why PostgreSQL?
- **Industry standard**: The most popular open-source relational database
- **Rich type system**: Native BOOLEAN, TIMESTAMPTZ, JSONB, arrays, and more
- **SQL standard**: Full SQL compliance with powerful extensions (CTEs, window functions, ILIKE)
- **Production-ready**: Scales from development to massive production workloads
- **Docker-friendly**: Easy to run locally in a container

### Why postgres.js?
- **Tagged templates**: Uses `sql\`...\`` for safe, readable parameterized queries
- **Connection pool**: Automatically manages a pool of connections (lazy, up to 10 by default)
- **Transform support**: `postgres.camel` auto-converts snake_case columns to camelCase JS
- **No native bindings**: Pure JavaScript — works everywhere without compilation
- **Fast**: One of the fastest PostgreSQL drivers for Node.js

### Local Setup with Docker

PostgreSQL runs in a Docker container defined in `docker-compose.yml`:

```bash
docker compose up -d      # Start PostgreSQL in the background
docker compose down        # Stop PostgreSQL (data persists in volume)
docker compose down -v     # Stop and delete all data (fresh start)
```

Connection string is stored in `.env.local` (gitignored):
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ts_fs_dev
```

## Schema Design

### Projects Table

```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('infrastructure', 'product', 'marketing', 'internal')),
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Design Decisions:**

1. **SERIAL PRIMARY KEY**:
   - Auto-generates unique integer IDs
   - PostgreSQL equivalent of AUTOINCREMENT

2. **CHECK Constraints**:
   - Enforces valid categories at the database level
   - Prevents invalid data even if application validation is bypassed

3. **BOOLEAN type**:
   - PostgreSQL has a native BOOLEAN — no integer-to-boolean conversion needed
   - Maps directly to JavaScript `true`/`false`

4. **TIMESTAMPTZ for Dates**:
   - Stores timestamps with timezone information
   - postgres.js returns these as JavaScript `Date` objects automatically
   - `NOW()` generates the current timestamp

5. **snake_case Column Names**:
   - PostgreSQL convention for column names
   - The `transform: postgres.camel` option in the driver automatically converts
     these to camelCase in JavaScript (e.g., `is_public` → `isPublic`)

6. **Index on Category**:
   - Speeds up filtering by category
   - Small overhead on writes, big gains on reads

## Repository Pattern

Instead of writing SQL everywhere, we centralize database operations in **repository functions**.

### Example: getProjectById

```typescript
export async function getProjectById(id: number): Promise<Project | null> {
  const [project] = await sql<Project[]>`
    SELECT * FROM projects
    WHERE id = ${id}
  `;

  return project ?? null;
}
```

### Key Patterns:

1. **Tagged Template Literals**:
   - `sql\`SELECT * FROM projects WHERE id = ${id}\``
   - Values are automatically parameterized (prevents SQL injection)
   - Looks like string interpolation but is actually safe

2. **Async/Await**:
   - All repository functions are `async` (PostgreSQL is non-blocking)
   - Callers must `await` the result

3. **RETURNING Clause**:
   - `INSERT ... RETURNING *` gets the new row in one query
   - No need for a separate SELECT after INSERT (unlike SQLite)

4. **Null Handling**:
   - Destructure the first element: `const [project] = await sql\`...\``
   - Return `null` when not found using nullish coalescing

## Transactions

For multiple related operations, we use `sql.begin()`:

```typescript
await sql.begin(async (tx) => {
  for (const project of projects) {
    await tx`
      INSERT INTO projects (name, description, category, is_public)
      VALUES (${project.name}, ${project.description}, ${project.category}, ${project.isPublic})
    `;
  }
});
```

**Benefits:**
- Atomic operations (all succeed or all fail)
- The `tx` parameter is a scoped sql instance bound to the transaction
- Connection is automatically returned to the pool when done

## Database Initialization

The database is initialized asynchronously on module load:

```typescript
// lib/db/index.ts
const sql = postgres(process.env.DATABASE_URL!, {
  transform: postgres.camel,
});

initializeDatabase().catch((err) => {
  console.error('Database initialization failed:', err.message);
});

export { sql };
```

**Why this approach?**
- Module is cached by Node.js (runs once)
- `.catch()` prevents unhandled rejections if DB isn't running
- Individual queries will fail with clear errors if initialization failed

**Production Note**: In real apps, you'd use a proper migration system like:
- Drizzle Kit
- node-pg-migrate
- Custom migration scripts

## Seed Data

We automatically seed the database if it's empty:

```typescript
const [{ count }] = await sql<[{ count: number }]>`
  SELECT COUNT(*)::int AS count FROM projects
`;

if (count === 0) {
  // Insert seed data in a transaction
}
```

This gives us sample data to work with immediately. The `::int` cast converts PostgreSQL's `bigint` COUNT result to a JavaScript number.

## What About ORMs?

We intentionally **don't use an ORM** (like Prisma or Drizzle) because:

1. **Learning**: Raw SQL teaches database fundamentals
2. **Simplicity**: No extra abstraction layer to learn
3. **Transparency**: You see exactly what queries run
4. **Control**: Full control over query optimization

**When to use an ORM:**
- Larger teams (consistent query patterns)
- Complex relationships
- Multi-database support needed
- Automatic migrations preferred

For this learning project, raw SQL with postgres.js is more educational.

## Error Handling

Database errors propagate naturally to Server Actions:

```typescript
export async function createProject(input: CreateProjectInput): Promise<Project> {
  const [project] = await sql<Project[]>`
    INSERT INTO projects (name, description, category, is_public)
    VALUES (${input.name}, ${input.description}, ${input.category}, ${input.isPublic})
    RETURNING *
  `;

  return project;
}
```

We don't wrap errors in repositories because:
- Server Actions handle errors centrally
- Simpler code
- Error details preserved
- postgres.js provides descriptive error messages
