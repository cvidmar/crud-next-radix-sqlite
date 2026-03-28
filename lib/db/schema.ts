/**
 * Database Schema Definition
 *
 * This file defines the TypeScript types that mirror our PostgreSQL database schema.
 * Unlike SQLite, PostgreSQL returns native booleans and Date objects, so our types
 * are more straightforward — no need for integer-to-boolean conversion.
 *
 * Column name mapping:
 * The postgres.js driver is configured with `transform: postgres.camel`, which
 * automatically converts snake_case DB columns (is_public, created_at) to
 * camelCase JS properties (isPublic, createdAt).
 */

export interface Project {
  id: number;
  name: string;
  description: string;
  category: 'infrastructure' | 'product' | 'marketing' | 'internal';
  isPublic: boolean; // PostgreSQL BOOLEAN maps directly to JS boolean
  createdAt: Date; // PostgreSQL TIMESTAMPTZ maps to JS Date
  updatedAt: Date;
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
