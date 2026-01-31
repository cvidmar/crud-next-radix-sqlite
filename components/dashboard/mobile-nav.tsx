'use client';

/**
 * Mobile Navigation Component
 *
 * Provides a hamburger menu button and slide-out drawer for mobile devices.
 * Uses Radix UI Dialog primitive for accessible modal behavior.
 *
 * Learning Points:
 * - 'use client' directive: This component needs client-side interactivity
 * - Radix Dialog: Provides accessible modal/drawer with focus management
 * - Responsive design: Only visible on mobile (lg:hidden)
 */

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { Sidebar } from './sidebar';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* Hamburger Menu Button - Only visible on mobile */}
      <Dialog.Trigger asChild>
        <button
          className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
          aria-label="Open navigation menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Backdrop overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Drawer content - slides in from left */}
        <Dialog.Content className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-background z-50 flex flex-col shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-300">
          {/* Close button */}
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="Close navigation menu"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </Dialog.Close>

          {/* Sidebar content - closes drawer on navigation */}
          <Sidebar onNavigate={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
