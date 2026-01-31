/**
 * View Project Page
 *
 * Displays a single project's details.
 *
 * Learning Points:
 * - Dynamic route using [id] folder
 * - Type-safe params with TypeScript
 * - notFound() helper for 404 handling
 * - Mixing Server and Client Components
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProjectById } from '@/lib/db/projects';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { DeleteProjectButton } from '@/components/dashboard/delete-project-button';

// Define the shape of params for TypeScript
interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage({ params }: PageProps) {
  // Await params in Next.js 16
  const { id } = await params;
  const projectId = parseInt(id, 10);

  // Fetch the project from database
  const project = getProjectById(projectId);

  // Show 404 if project doesn't exist
  if (!project) {
    notFound();
  }

  return (
    <>
      {/* Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-background flex items-center justify-between px-8">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
            Projects
          </Link>
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
          <span className="font-medium">{project.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/projects/${project.id}/edit`}>
            <Button variant="outline" size="sm">
              Edit Project
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-3xl mx-auto">
          {/* Project header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>Created {formatDate(project.createdAt)}</span>
                  <span>•</span>
                  <span>Updated {formatDate(project.updatedAt)}</span>
                </div>
              </div>
              {project.isPublic && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                  Public
                </span>
              )}
            </div>
          </div>

          {/* Project details */}
          <div className="space-y-6 mb-12">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Description
              </h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {project.description}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Category
              </h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {project.category}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Visibility
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {project.isPublic
                  ? 'This project is visible to everyone in the organization'
                  : 'This project is private'}
              </p>
            </div>
          </div>

          {/* Danger zone */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10 p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-red-900 dark:text-red-400">
                    Delete Project
                  </h4>
                  <p className="text-xs text-red-700 dark:text-red-400/70">
                    Once deleted, all data associated with this project will be permanently
                    removed.
                  </p>
                </div>
                <DeleteProjectButton projectId={project.id} projectName={project.name} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
