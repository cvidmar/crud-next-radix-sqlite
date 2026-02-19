/**
 * Database Connection and Initialization
 *
 * This module sets up our PostgreSQL connection using postgres.js.
 * postgres.js uses a connection pool under the hood — connections are
 * created lazily on the first query and reused automatically.
 *
 * Key Learning Points:
 * - Connection pool: postgres.js manages a pool of connections (default max: 10)
 * - Lazy connections: No connection is opened until the first query runs
 * - Tagged templates: Queries use sql`...` template literals for safe parameterization
 * - Environment variables: Connection string comes from DATABASE_URL
 */

import postgres from 'postgres';

/**
 * Create the database connection pool
 *
 * The postgres() function returns a sql template tag that also acts as
 * the connection pool. All queries go through this single instance.
 */
const sql = postgres(process.env.DATABASE_URL!, {
  // Automatically convert snake_case columns to camelCase JS properties
  // (e.g., is_public → isPublic, created_at → createdAt)
  transform: postgres.camel,

  // Log queries in development for learning and debugging
  debug: process.env.NODE_ENV === 'development'
    ? (_connection, query) => console.log(query)
    : undefined,
});

/**
 * Initialize database schema
 *
 * Creates tables if they don't exist and seeds initial data.
 * In production, you'd use a migration tool (like Drizzle Kit or node-pg-migrate).
 */
async function initializeDatabase() {
  // Create projects table with PostgreSQL types
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('infrastructure', 'product', 'marketing', 'internal')),
      is_public BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Create an index on category for faster queries
  await sql`
    CREATE INDEX IF NOT EXISTS idx_projects_category
    ON projects(category)
  `;

  // Seed data if the table is empty
  const [{ count }] = await sql<[{ count: number }]>`
    SELECT COUNT(*)::int AS count FROM projects
  `;

  if (count === 0) {
    const projects = [
      {
        name: 'Project Alpha',
        description: 'Next-generation frontend infrastructure project designed to scale with multi-tenant architectures and Radix UI design systems.',
        category: 'infrastructure',
        is_public: true,
      },
      {
        name: 'Beta Launch',
        description: 'Product development initiative focused on delivering core features for our upcoming beta release.',
        category: 'product',
        is_public: false,
      },
      {
        name: 'Internal Research',
        description: 'Research and development project exploring new technologies and architectural patterns.',
        category: 'internal',
        is_public: false,
      },
    ];

    // Insert all seed rows
    for (const project of projects) {
      await sql`
        INSERT INTO projects (name, description, category, is_public)
        VALUES (${project.name}, ${project.description}, ${project.category}, ${project.is_public})
      `;
    }

    console.log('✅ Database seeded with initial projects');
  }
}

/**
 * Initialization promise
 *
 * Since initializeDatabase() is async but module loading is synchronous,
 * we store the promise so that repository functions can await it before
 * running queries. This prevents a race condition where a page request
 * arrives before the CREATE TABLE has finished.
 */
const initialized = initializeDatabase().catch((err) => {
  console.error('❌ Database initialization failed:', err.message);
});

/**
 * Export the sql instance and the initialization promise.
 *
 * In Next.js, these will be imported in Server Components and Server Actions.
 * Never import this in Client Components — it won't work (and shouldn't).
 */
export { sql, initialized };
