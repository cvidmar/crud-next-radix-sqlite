/**
 * Dashboard Home Page - Project List
 *
 * This page demonstrates Next.js 16 Server Components in action.
 *
 * Key Learning Points:
 * - Server Components: We can directly query the database here (no API needed!)
 * - No 'use client' directive: This renders on the server
 * - Automatic request memoization: Multiple calls to getAllProjects() are deduplicated
 * - Static rendering by default (becomes dynamic when using database)
 */

import Link from 'next/link';
import { getAllProjects } from '@/lib/db/projects';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';

/**
 * Category badge component
 * This is a server component because it doesn't have 'use client'
 */
function CategoryBadge({ category }: { category: string }) {
  const colors = {
    infrastructure: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    product: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
    marketing: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
    internal: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[category as keyof typeof colors]
      }`}
    >
      {category}
    </span>
  );
}

/**
 * Project card component
 */
function ProjectCard({ project }: { project: any }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block group"
    >
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 bg-white dark:bg-zinc-950 hover:border-primary/50 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          {project.isPublic && (
            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              Public
            </span>
          )}
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
          {project.description}
        </p>

        <div className="flex items-center justify-between">
          <CategoryBadge category={project.category} />
          <span className="text-xs text-slate-500">
            Updated {formatRelativeTime(project.updatedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Main page component
 *
 * This is an async Server Component - we can use async/await directly!
 */
export default async function DashboardPage() {
  // Direct database access in a Server Component
  // No API route needed!
  const projects = getAllProjects();

  return (
    <>
      {/* Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-background flex items-center justify-between px-8">
        <div>
          <h1 className="text-xl font-bold">Projects</h1>
          <p className="text-sm text-slate-500">
            Manage your projects and track progress
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Project
          </Link>
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {projects.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Get started by creating your first project
            </p>
            <Button asChild>
              <Link href="/projects/new">Create Project</Link>
            </Button>
          </div>
        ) : (
          /* Project grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
