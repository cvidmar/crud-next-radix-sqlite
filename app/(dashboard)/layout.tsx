/**
 * Dashboard Layout
 *
 * This layout wraps all dashboard pages with a consistent sidebar and header.
 *
 * Learning Points:
 * - Route groups: (dashboard) creates a layout without adding "dashboard" to the URL
 * - Server Components by default: This doesn't need 'use client' directive
 * - Layouts persist across navigation, so state in this component persists
 * - Responsive design: Sidebar hidden on mobile, shown on desktop (lg breakpoint)
 */

import { Sidebar } from '@/components/dashboard/sidebar';
import { MobileNav } from '@/components/dashboard/mobile-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar - Hidden on mobile, visible on lg screens */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 dark:border-slate-700 flex-col bg-white dark:bg-background shrink-0">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header - Only visible on mobile */}
        <header className="lg:hidden h-14 flex items-center justify-between px-4 bg-white dark:bg-background border-b border-slate-200 dark:border-slate-700 shrink-0">
          <MobileNav />

          <h1 className="text-sm font-semibold tracking-tight absolute left-1/2 -translate-x-1/2">
            Project Manager
          </h1>

          {/* User Avatar */}
          <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">
            AR
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 flex flex-col bg-slate-50/50 dark:bg-[#0c0c0e] overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
