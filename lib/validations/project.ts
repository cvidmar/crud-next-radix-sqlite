/**
 * Project Validation Schemas
 *
 * Using Zod v4 for type-safe validation.
 *
 * Key Learning Points:
 * - Zod provides runtime validation + TypeScript types
 * - Use z.infer to extract TypeScript types from schemas
 * - Validation happens before database operations
 * - Error messages are customizable for better UX
 */

import { z } from 'zod';

/**
 * Project creation schema
 *
 * In Zod v4, string validators moved to top-level functions,
 * but for basic string validation we still use z.string()
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must be less than 100 characters'),

  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),

  category: z.enum(['infrastructure', 'product', 'marketing', 'internal'], {
    required_error: 'Please select a category',
    message: 'Invalid category selected',
  }),

  isPublic: z.boolean().default(false),
});

/**
 * Project update schema (all fields optional except we'll handle ID separately)
 */
export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must be less than 100 characters')
    .optional(),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .optional(),

  category: z
    .enum(['infrastructure', 'product', 'marketing', 'internal'])
    .optional(),

  isPublic: z.boolean().optional(),
});

// Infer TypeScript types from schemas
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
