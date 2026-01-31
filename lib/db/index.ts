/**
 * Database Connection and Initialization
 *
 * This module sets up our SQLite database connection using better-sqlite3.
 * Better-sqlite3 is synchronous and fast - perfect for server-side operations.
 *
 * Key Learning Points:
 * - Singleton pattern: We create one database instance and reuse it
 * - Module caching: Node.js caches modules, so this only runs once
 * - Migration strategy: Simple SQL-based migrations for learning
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name (needed for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path - stored in the project root
const dbPath = path.join(process.cwd(), 'data', 'app.db');

// Ensure the data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Create and configure the database instance
 *
 * Options explained:
 * - verbose: Logs all SQL queries (useful for learning, disable in production)
 * - fileMustExist: false - create the file if it doesn't exist
 */
const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
});

// Enable foreign keys (SQLite doesn't enable them by default)
db.pragma('foreign_keys = ON');

/**
 * Initialize database schema
 *
 * This creates our tables if they don't exist. In production, you'd use
 * a proper migration system (like node-migrate or Drizzle Kit).
 */
function initializeDatabase() {
  // Create projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('infrastructure', 'product', 'marketing', 'internal')),
      isPublic INTEGER NOT NULL DEFAULT 0 CHECK(isPublic IN (0, 1)),
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Create an index on category for faster queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_projects_category
    ON projects(category)
  `);

  // Seed data if the table is empty
  const count = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };

  if (count.count === 0) {
    const insert = db.prepare(`
      INSERT INTO projects (name, description, category, isPublic)
      VALUES (?, ?, ?, ?)
    `);

    const projects = [
      {
        name: 'Project Alpha',
        description: 'Next-generation frontend infrastructure project designed to scale with multi-tenant architectures and Radix UI design systems.',
        category: 'infrastructure',
        isPublic: 1,
      },
      {
        name: 'Beta Launch',
        description: 'Product development initiative focused on delivering core features for our upcoming beta release.',
        category: 'product',
        isPublic: 0,
      },
      {
        name: 'Internal Research',
        description: 'Research and development project exploring new technologies and architectural patterns.',
        category: 'internal',
        isPublic: 0,
      },
    ];

    // Use a transaction for better performance when inserting multiple rows
    const insertMany = db.transaction((projects) => {
      for (const project of projects) {
        insert.run(project.name, project.description, project.category, project.isPublic);
      }
    });

    insertMany(projects);
    console.log('✅ Database seeded with initial projects');
  }
}

// Initialize the database on module load
initializeDatabase();

/**
 * Export the database instance
 *
 * In Next.js, this will be imported in Server Components and Server Actions.
 * Never import this in Client Components - it won't work (and shouldn't work).
 */
export { db };
