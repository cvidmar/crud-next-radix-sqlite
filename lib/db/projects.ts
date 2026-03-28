/**
 * Project Database Operations
 *
 * This file contains all database operations for projects using the
 * Repository Pattern. All queries use postgres.js tagged template literals,
 * which automatically parameterize values to prevent SQL injection.
 *
 * Key differences from the SQLite version:
 * - All functions are async (PostgreSQL is non-blocking)
 * - No boolean conversion needed (PostgreSQL has native BOOLEAN type)
 * - Tagged templates replace prepared statements for parameterization
 * - snake_case columns are auto-converted to camelCase by the driver
 */

import { sql, initialized } from './index';
import type { Project, CreateProjectInput, UpdateProjectInput } from './schema';

/**
 * Get all projects
 *
 * @returns Array of all projects, ordered by most recently updated first
 */
export async function getAllProjects(): Promise<Project[]> {
  await initialized;
  return sql<Project[]>`
    SELECT * FROM projects
    ORDER BY updated_at DESC
  `;
}

/**
 * Get a single project by ID
 *
 * @param id - The project ID
 * @returns The project or null if not found
 */
export async function getProjectById(id: number): Promise<Project | null> {
  await initialized;
  const [project] = await sql<Project[]>`
    SELECT * FROM projects
    WHERE id = ${id}
  `;

  return project ?? null;
}

/**
 * Create a new project
 *
 * PostgreSQL's RETURNING clause lets us get the inserted row in a single query,
 * unlike SQLite where we needed a separate SELECT after INSERT.
 *
 * @param input - Project data (without id, createdAt, updatedAt)
 * @returns The newly created project
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  await initialized;
  const [project] = await sql<Project[]>`
    INSERT INTO projects (name, description, category, is_public)
    VALUES (${input.name}, ${input.description}, ${input.category}, ${input.isPublic})
    RETURNING *
  `;

  return project;
}

/**
 * Update an existing project
 *
 * Uses dynamic SQL generation to only update provided fields.
 * postgres.js supports dynamic column updates via the sql() helper.
 *
 * @param input - Project update data
 * @returns The updated project or null if not found
 */
export async function updateProject(input: UpdateProjectInput): Promise<Project | null> {
  await initialized;
  // Build a plain object with only the fields that were provided
  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.category !== undefined) updates.category = input.category;
  if (input.isPublic !== undefined) updates.is_public = input.isPublic;

  // Always update the timestamp
  updates.updated_at = sql`NOW()`;

  // No real updates to make (only timestamp)
  if (Object.keys(updates).length === 1) {
    return getProjectById(input.id);
  }

  const [project] = await sql<Project[]>`
    UPDATE projects
    SET ${sql(updates, ...Object.keys(updates))}
    WHERE id = ${input.id}
    RETURNING *
  `;

  return project ?? null;
}

/**
 * Delete a project
 *
 * @param id - The project ID to delete
 * @returns True if deleted, false if not found
 */
export async function deleteProject(id: number): Promise<boolean> {
  await initialized;
  const result = await sql`
    DELETE FROM projects
    WHERE id = ${id}
  `;

  return result.count > 0;
}

/**
 * Search projects by name or description
 *
 * PostgreSQL's ILIKE provides case-insensitive matching (unlike SQLite's LIKE
 * which is case-insensitive only for ASCII by default).
 *
 * @param query - Search query string
 * @returns Array of matching projects
 */
export async function searchProjects(query: string): Promise<Project[]> {
  await initialized;
  const searchTerm = `%${query}%`;

  return sql<Project[]>`
    SELECT * FROM projects
    WHERE name ILIKE ${searchTerm} OR description ILIKE ${searchTerm}
    ORDER BY updated_at DESC
  `;
}

/**
 * Get projects by category
 *
 * @param category - The category to filter by
 * @returns Array of projects in that category
 */
export async function getProjectsByCategory(
  category: Project['category']
): Promise<Project[]> {
  await initialized;
  return sql<Project[]>`
    SELECT * FROM projects
    WHERE category = ${category}
    ORDER BY updated_at DESC
  `;
}
