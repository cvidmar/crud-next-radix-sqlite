/**
 * New Project Page
 *
 * This page demonstrates the hybrid Server Component + Client Component pattern.
 *
 * Learning Points:
 * - This page is a Server Component (no 'use client')
 * - It renders a Client Component (ProjectForm) which uses hooks
 * - Server Actions are passed to Client Components as props
 * - The Server Action executes on the server, even when called from client
 */

import { createProject } from '@/lib/actions/projects';
import { ProjectForm } from '@/components/dashboard/project-form';

export default function NewProjectPage() {
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
          <span className="font-medium">New Project</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-2xl mx-auto">
          {/* Page title */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold tracking-tight mb-1">
              Create New Project
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Set up a new project to start tracking your work.
            </p>
          </div>

          {/* Form - this is a Client Component */}
          <ProjectForm action={createProject} submitLabel="Create Project" />
        </div>
      </div>
    </>
  );
}
