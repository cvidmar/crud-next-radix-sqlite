/**
 * Sidebar Component
 *
 * Reusable sidebar content used in both desktop (static) and mobile (drawer) layouts.
 * This is a Server Component - no client-side interactivity needed for the content itself.
 */

import Link from 'next/link';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <>
      {/* Logo / Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="size-7 bg-primary rounded flex items-center justify-center text-white">
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
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Project Manager
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6">
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-3">
            Overview
          </div>
          <Link
            href="/"
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-900 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Dashboard
          </Link>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 px-2">
          <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
            AR
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">Alex Rivera</p>
            <p className="text-[10px] text-slate-500 truncate">
              Administrator
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
