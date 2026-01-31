/**
 * Database Schema Definition
 *
 * This file defines the TypeScript types that mirror our SQLite database schema.
 * In a production app, you might use an ORM like Drizzle or Prisma, but for learning
 * purposes, we're using raw SQL to understand the fundamentals.
 */

export interface Project {
  id: number;
  name: string;
  description: string;
  category: 'infrastructure' | 'product' | 'marketing' | 'internal';
  isPublic: number; // SQLite uses integers for booleans: 0 = false, 1 = true
  createdAt: string; // SQLite stores dates as ISO strings
  updatedAt: string;
}

/**
 * Input type for creating a new project (excludes auto-generated fields)
 */
export interface CreateProjectInput {
  name: string;
  description: string;
  category: Project['category'];
  isPublic: boolean;
}

/**
 * Input type for updating a project (all fields optional except id)
 */
export interface UpdateProjectInput {
  id: number;
  name?: string;
  description?: string;
  category?: Project['category'];
  isPublic?: boolean;
}

/**
 * Project type with boolean conversion for easier use in React
 */
export interface ProjectWithBoolean extends Omit<Project, 'isPublic'> {
  isPublic: boolean;
}
