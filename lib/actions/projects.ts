/**
 * Server Actions for Projects
 *
 * Server Actions are a Next.js feature that allows you to run server-side code
 * directly from client components (or forms).
 *
 * Key Learning Points:
 * - 'use server' directive makes these functions run on the server
 * - Can be called from Client Components
 * - Perfect for mutations (create, update, delete)
 * - Automatically handle serialization
 * - Type-safe with TypeScript
 * - Works with or without JavaScript enabled (Progressive Enhancement)
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  createProject as dbCreateProject,
  updateProject as dbUpdateProject,
  deleteProject as dbDeleteProject,
} from '@/lib/db/projects';
import { createProjectSchema, updateProjectSchema } from '@/lib/validations/project';

/**
 * Server Action: Create a new project
 *
 * This can be called from a form or from client-side JavaScript.
 * It validates the input, creates the project, and redirects to it.
 *
 * @param formData - Form data from the client
 * @returns Success/error state with messages
 */
export async function createProject(prevState: any, formData: FormData) {
  // Extract form data
  const rawData = {
    name: formData.get('name'),
    description: formData.get('description'),
    category: formData.get('category'),
    isPublic: formData.get('isPublic') === 'on' || formData.get('isPublic') === 'true',
  };

  // Validate with Zod
  const validationResult = createProjectSchema.safeParse(rawData);

  if (!validationResult.success) {
    // Return validation errors to the client
    const flattened = z.flattenError(validationResult.error);
    return {
      success: false,
      errors: flattened.fieldErrors,
      message: 'Invalid form data',
    };
  }

  let projectId: number;

  try {
    // Create the project in the database
    const project = dbCreateProject(validationResult.data);
    projectId = project.id;

    // Revalidate the cache for the dashboard page
    // This ensures the new project shows up immediately
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to create project:', error);
    return {
      success: false,
      message: 'Failed to create project. Please try again.',
    };
  }

  // Redirect outside try/catch - redirect() throws a special error
  // that should not be caught
  redirect(`/projects/${projectId}`);
}

/**
 * Server Action: Update an existing project
 *
 * @param id - Project ID
 * @param formData - Form data from the client
 */
export async function updateProject(id: number, prevState: any, formData: FormData) {
  // Extract form data
  const rawData = {
    name: formData.get('name') || undefined,
    description: formData.get('description') || undefined,
    category: formData.get('category') || undefined,
    isPublic: formData.get('isPublic') === 'on' || formData.get('isPublic') === 'true',
  };

  // Validate with Zod
  const validationResult = updateProjectSchema.safeParse(rawData);

  if (!validationResult.success) {
    const flattened = z.flattenError(validationResult.error);
    return {
      success: false,
      errors: flattened.fieldErrors,
      message: 'Invalid form data',
    };
  }

  try {
    // Update the project in the database
    const project = dbUpdateProject({
      id,
      ...validationResult.data,
    });

    if (!project) {
      return {
        success: false,
        message: 'Project not found',
      };
    }

    // Revalidate affected pages
    revalidatePath('/');
    revalidatePath(`/projects/${id}`);
  } catch (error) {
    console.error('Failed to update project:', error);
    return {
      success: false,
      message: 'Failed to update project. Please try again.',
    };
  }

  // Redirect outside try/catch - redirect() throws a special error
  redirect(`/projects/${id}`);
}

/**
 * Server Action: Delete a project
 *
 * @param id - Project ID to delete
 */
export async function deleteProjectAction(id: number) {
  try {
    const success = dbDeleteProject(id);

    if (!success) {
      return {
        success: false,
        message: 'Project not found',
      };
    }

    // Revalidate the dashboard page
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to delete project:', error);
    return {
      success: false,
      message: 'Failed to delete project. Please try again.',
    };
  }

  // Redirect outside try/catch - redirect() throws a special error
  redirect('/');
}
