/**
 * Edit Project Page
 *
 * Allows editing an existing project.
 *
 * Learning Points:
 * - Binding Server Action arguments with .bind()
 * - Prefilling form with existing data
 * - Same form component reused for create and edit
 */

import { notFound } from 'next/navigation';
import { getProjectById } from '@/lib/db/projects';
import { updateProject } from '@/lib/actions/projects';
import { ProjectForm } from '@/components/dashboard/project-form';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = parseInt(id, 10);

  // Guard against invalid IDs (NaN or non-positive values)
  if (Number.isNaN(projectId) || projectId <= 0) {
    notFound();
  }

  // Fetch the existing project
  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  // Bind the project ID to the Server Action
  // This creates a new function with the ID pre-filled
  const updateProjectWithId = updateProject.bind(null, projectId);

  return (
    <>
      {/* Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-background flex items-center px-8">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Projects</span>
          <svg
            className="w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-slate-500">{project.name}</span>
          <svg
            className="w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="font-medium">Edit</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl font-bold tracking-tight mb-1">
              Edit Project Details
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Update your project configuration and visibility settings.
            </p>
          </div>

          {/* Pre-fill the form with existing data */}
          <ProjectForm
            action={updateProjectWithId}
            defaultValues={{
              name: project.name,
              description: project.description,
              category: project.category,
              isPublic: project.isPublic,
            }}
            submitLabel="Save Changes"
          />
        </div>
      </div>
    </>
  );
}
