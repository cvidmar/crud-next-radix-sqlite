/**
 * Project Database Operations
 *
 * This file contains all database operations for projects.
 * This pattern is called the "Repository Pattern" - it abstracts database
 * operations into reusable functions.
 *
 * Benefits:
 * - Centralized data access logic
 * - Easy to test
 * - Type-safe with TypeScript
 * - Can be called from Server Actions or Server Components
 */

import { db } from './index';
import type { Project, CreateProjectInput, UpdateProjectInput, ProjectWithBoolean } from './schema';

/**
 * Convert SQLite integer boolean to JavaScript boolean
 */
function convertToBoolean(project: Project): ProjectWithBoolean {
  return {
    ...project,
    isPublic: project.isPublic === 1,
  };
}

/**
 * Get all projects
 *
 * @returns Array of all projects, ordered by most recently updated first
 */
export function getAllProjects(): ProjectWithBoolean[] {
  const stmt = db.prepare(`
    SELECT * FROM projects
    ORDER BY updatedAt DESC
  `);

  const projects = stmt.all() as Project[];
  return projects.map(convertToBoolean);
}

/**
 * Get a single project by ID
 *
 * @param id - The project ID
 * @returns The project or null if not found
 */
export function getProjectById(id: number): ProjectWithBoolean | null {
  const stmt = db.prepare(`
    SELECT * FROM projects
    WHERE id = ?
  `);

  const project = stmt.get(id) as Project | undefined;
  return project ? convertToBoolean(project) : null;
}

/**
 * Create a new project
 *
 * @param input - Project data (without id, createdAt, updatedAt)
 * @returns The newly created project
 */
export function createProject(input: CreateProjectInput): ProjectWithBoolean {
  const stmt = db.prepare(`
    INSERT INTO projects (name, description, category, isPublic)
    VALUES (?, ?, ?, ?)
  `);

  // Convert boolean to SQLite integer (0 or 1)
  const result = stmt.run(
    input.name,
    input.description,
    input.category,
    input.isPublic ? 1 : 0
  );

  // Get the newly created project
  const newProject = getProjectById(result.lastInsertRowid as number);

  if (!newProject) {
    throw new Error('Failed to create project');
  }

  return newProject;
}

/**
 * Update an existing project
 *
 * This uses dynamic SQL generation to only update provided fields.
 * In production, you might use a query builder to make this cleaner.
 *
 * @param input - Project update data
 * @returns The updated project or null if not found
 */
export function updateProject(input: UpdateProjectInput): ProjectWithBoolean | null {
  // Build dynamic UPDATE query based on provided fields
  const updates: string[] = [];
  const values: any[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }

  if (input.description !== undefined) {
    updates.push('description = ?');
    values.push(input.description);
  }

  if (input.category !== undefined) {
    updates.push('category = ?');
    values.push(input.category);
  }

  if (input.isPublic !== undefined) {
    updates.push('isPublic = ?');
    values.push(input.isPublic ? 1 : 0);
  }

  // Always update the updatedAt timestamp
  updates.push("updatedAt = datetime('now')");

  // No updates to make
  if (updates.length === 0) {
    return getProjectById(input.id);
  }

  // Add ID to the end of values array
  values.push(input.id);

  const stmt = db.prepare(`
    UPDATE projects
    SET ${updates.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);

  return getProjectById(input.id);
}

/**
 * Delete a project
 *
 * @param id - The project ID to delete
 * @returns True if deleted, false if not found
 */
export function deleteProject(id: number): boolean {
  const stmt = db.prepare(`
    DELETE FROM projects
    WHERE id = ?
  `);

  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Search projects by name or description
 *
 * @param query - Search query string
 * @returns Array of matching projects
 */
export function searchProjects(query: string): ProjectWithBoolean[] {
  const stmt = db.prepare(`
    SELECT * FROM projects
    WHERE name LIKE ? OR description LIKE ?
    ORDER BY updatedAt DESC
  `);

  const searchTerm = `%${query}%`;
  const projects = stmt.all(searchTerm, searchTerm) as Project[];
  return projects.map(convertToBoolean);
}

/**
 * Get projects by category
 *
 * @param category - The category to filter by
 * @returns Array of projects in that category
 */
export function getProjectsByCategory(
  category: Project['category']
): ProjectWithBoolean[] {
  const stmt = db.prepare(`
    SELECT * FROM projects
    WHERE category = ?
    ORDER BY updatedAt DESC
  `);

  const projects = stmt.all(category) as Project[];
  return projects.map(convertToBoolean);
}
