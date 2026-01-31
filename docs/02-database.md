# Database Design and Patterns

This document explains how the database layer works and why we made specific design decisions.

## Database Choice: SQLite with better-sqlite3

We use **SQLite** with the **better-sqlite3** library for several reasons:

### Why SQLite?
- **Zero configuration**: No separate database server needed
- **Portable**: Single file database (perfect for learning)
- **Fast**: In-process, no network overhead
- **Production-ready**: Used by many real applications
- **SQL standard**: Skills transfer to PostgreSQL, MySQL, etc.

### Why better-sqlite3?
- **Synchronous API**: Simpler to understand than async
- **Fast**: One of the fastest SQLite libraries for Node.js
- **Type-safe**: Works well with TypeScript
- **Maintained**: Active development and good documentation

## Schema Design

### Projects Table

```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('infrastructure', 'product', 'marketing', 'internal')),
  isPublic INTEGER NOT NULL DEFAULT 0 CHECK(isPublic IN (0, 1)),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Design Decisions:**

1. **INTEGER PRIMARY KEY AUTOINCREMENT**:
   - Auto-generates unique IDs
   - Common pattern in all databases

2. **CHECK Constraints**:
   - Enforces valid categories at the database level
   - Prevents invalid data even if validation is bypassed
   - `isPublic` limited to 0 or 1 (SQLite's boolean)

3. **NOT NULL**:
   - Makes required fields explicit
   - Prevents null pointer issues

4. **TEXT for Dates**:
   - SQLite stores dates as ISO strings
   - Easy to read in database tools
   - Converts to JavaScript Date objects easily

5. **Index on Category**:
   - Speeds up filtering by category
   - Small overhead on writes, big gains on reads

## Repository Pattern

Instead of writing SQL everywhere, we centralize database operations in **repository functions**.

### Example: getProjectById

```typescript
export function getProjectById(id: number): ProjectWithBoolean | null {
  const stmt = db.prepare(`
    SELECT * FROM projects
    WHERE id = ?
  `);

  const project = stmt.get(id) as Project | undefined;
  return project ? convertToBoolean(project) : null;
}
```

### Key Patterns:

1. **Prepared Statements**:
   - `db.prepare()` compiles SQL once, reuses it
   - Prevents SQL injection
   - Better performance

2. **Parameterized Queries**:
   - `?` placeholders prevent injection
   - Never concatenate user input into SQL

3. **Type Conversion**:
   - `convertToBoolean()` converts SQLite integers to JS booleans
   - Makes data easier to work with in React

4. **Null Handling**:
   - Return `null` when not found
   - Makes it clear when data doesn't exist

## Boolean Handling

SQLite doesn't have a native boolean type. We handle this with:

```typescript
// Database schema uses INTEGER (0 or 1)
interface Project {
  isPublic: number;
}

// Application uses boolean
interface ProjectWithBoolean {
  isPublic: boolean;
}

// Conversion function
function convertToBoolean(project: Project): ProjectWithBoolean {
  return {
    ...project,
    isPublic: project.isPublic === 1,
  };
}
```

**Why this pattern?**
- SQLite layer stays true to SQLite types
- Application layer uses idiomatic JavaScript
- Type system enforces correct usage

## Transactions

For multiple related operations, we use transactions:

```typescript
const insertMany = db.transaction((projects) => {
  for (const project of projects) {
    insert.run(project.name, project.description, ...);
  }
});

insertMany(projects); // Atomic: all or nothing
```

**Benefits:**
- Atomic operations (all succeed or all fail)
- Better performance (single disk write)
- Data consistency

## Database Initialization

The database is initialized on module load:

```typescript
// lib/db/index.ts
const db = new Database(dbPath);

// Run initialization
initializeDatabase();

export { db };
```

**Why this approach?**
- Module is cached by Node.js (runs once)
- Database is ready when first imported
- Simple migration strategy for learning

**Production Note**: In real apps, you'd use a proper migration system like:
- Drizzle Kit
- node-migrate
- Custom migration scripts

## Seed Data

We automatically seed the database if it's empty:

```typescript
const count = db.prepare('SELECT COUNT(*) as count FROM projects').get();

if (count.count === 0) {
  // Insert seed data
}
```

This gives us sample data to work with immediately.

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

For this learning project, raw SQL is more educational.

## Error Handling

Database errors are handled at the repository layer:

```typescript
export function createProject(input: CreateProjectInput): ProjectWithBoolean {
  try {
    const result = stmt.run(...);
    return getProjectById(result.lastInsertRowid);
  } catch (error) {
    // Let it propagate - Server Actions will catch it
    throw error;
  }
}
```

We don't wrap errors in repositories because:
- Server Actions handle errors centrally
- Simpler code
- Error details preserved

## Database File Location

```
data/
  app.db  # SQLite database file
```

This directory is gitignored. Each developer gets their own database file.

**Production Note**: In production, you'd use:
- PostgreSQL/MySQL for multi-user access
- Proper backups
- Connection pooling
- Read replicas for scaling
