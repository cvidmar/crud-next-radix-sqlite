/**
 * Project Form Component
 *
 * A reusable form for creating and editing projects.
 * Uses React 19's useActionState hook for handling Server Actions.
 *
 * Key Learning Points:
 * - 'use client' because we use hooks and interactivity
 * - useActionState manages form submission state
 * - Progressive enhancement: works without JavaScript via Server Actions
 * - Proper error handling and validation feedback
 */

'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { useState } from 'react';

// Type for the action state returned by Server Actions
interface ActionState {
  success?: boolean;
  message?: string;
  errors?: {
    name?: string[];
    description?: string[];
    category?: string[];
    isPublic?: string[];
  };
}

interface ProjectFormProps {
  action: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    name?: string;
    description?: string;
    category?: string;
    isPublic?: boolean;
  };
  submitLabel?: string;
}

export function ProjectForm({
  action,
  defaultValues = {},
  submitLabel = 'Create Project',
}: ProjectFormProps) {
  // React 19's useActionState hook for handling Server Actions
  // prevState starts as null, gets updated with action result
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(action, null);

  // Local state for controlled components
  const [category, setCategory] = useState(defaultValues.category || 'infrastructure');
  const [isPublic, setIsPublic] = useState(defaultValues.isPublic || false);

  return (
    <form action={formAction} className="space-y-8">
      {/* Name field */}
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="e.g. Next-gen Platform"
          defaultValue={defaultValues.name}
          required
          aria-describedby={state?.errors?.name ? 'name-error' : undefined}
        />
        {state?.errors?.name && (
          <p id="name-error" className="text-sm text-red-600 dark:text-red-400">
            {state.errors.name[0]}
          </p>
        )}
      </div>

      {/* Description field */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe the goals and scope of this project..."
          defaultValue={defaultValues.description}
          required
          aria-describedby={state?.errors?.description ? 'description-error' : undefined}
        />
        {state?.errors?.description && (
          <p id="description-error" className="text-sm text-red-600 dark:text-red-400">
            {state.errors.description[0]}
          </p>
        )}
      </div>

      {/* Category field */}
      <div className="space-y-2">
        <Label htmlFor="category">Project Category</Label>
        <Select
          name="category"
          value={category}
          onValueChange={setCategory}
          required
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="infrastructure">Frontend Infrastructure</SelectItem>
            <SelectItem value="product">Product Development</SelectItem>
            <SelectItem value="marketing">Marketing Website</SelectItem>
            <SelectItem value="internal">Internal Tooling</SelectItem>
          </SelectContent>
        </Select>
        {state?.errors?.category && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.errors.category[0]}
          </p>
        )}
      </div>

      {/* Public visibility toggle */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-zinc-950/50">
        <div className="space-y-0.5">
          <Label htmlFor="isPublic">Public Visibility</Label>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            Make this project visible to everyone in your organization.
          </p>
        </div>
        <Switch
          id="isPublic"
          name="isPublic"
          checked={isPublic}
          onCheckedChange={setIsPublic}
        />
      </div>

      {/* Global error message */}
      {state?.message && !state?.success && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10 p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
        </div>
      )}

      {/* Form actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button asChild variant="ghost">
          <Link href="/">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
