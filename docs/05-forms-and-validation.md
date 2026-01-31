# Forms and Validation

This document explains how forms work in this application, including validation, submission, and error handling.

## The Modern Forms Pattern

This application uses the **Server Actions + useActionState** pattern introduced in React 19 and Next.js.

### Traditional Approach (What We Don't Do)

```typescript
// ❌ Old way
const handleSubmit = async (e) => {
  e.preventDefault();
  const res = await fetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  // Handle response...
};
```

### Modern Approach (What We Do)

```typescript
// ✅ New way
'use client';

export function ProjectForm({ action }) {
  const [state, formAction, isPending] = useActionState(action, null);

  return <form action={formAction}>
    {/* Form fields */}
  </form>;
}
```

## Form Submission Flow

Here's what happens when a user submits a form:

```
1. User clicks "Submit"
   ↓
2. Form data collected automatically
   ↓
3. Server Action called with FormData
   ↓
4. Zod validates input
   ↓
5. If valid: Database mutation + redirect
   If invalid: Return errors to form
   ↓
6. useActionState updates with result
   ↓
7. Form shows errors or redirects
```

## Server Actions in Detail

### Anatomy of a Server Action

```typescript
// lib/actions/projects.ts
'use server';  // Makes this a Server Action

export async function createProject(
  prevState: any,       // Previous state from useActionState
  formData: FormData    // Automatically passed by React
) {
  // 1. Extract form data
  const rawData = {
    name: formData.get('name'),
    description: formData.get('description'),
    category: formData.get('category'),
    isPublic: formData.get('isPublic') === 'on',
  };

  // 2. Validate with Zod
  const result = createProjectSchema.safeParse(rawData);

  if (!result.success) {
    // 3. Return validation errors
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
      message: 'Invalid form data',
    };
  }

  // 4. Database mutation
  const project = dbCreateProject(result.data);

  // 5. Revalidate cache
  revalidatePath('/');

  // 6. Redirect
  redirect(`/projects/${project.id}`);
}
```

### Key Points:

1. **'use server' directive**: Required at the top of file or function
2. **FormData parameter**: Automatically populated by React
3. **Return value**: Sent back to `useActionState`
4. **redirect()**: Throws an error to navigate (this is intentional)
5. **revalidatePath()**: Clears Next.js cache for that route

## Validation with Zod v4

### Schema Definition

```typescript
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must be less than 100 characters'),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),

  category: z.enum(['infrastructure', 'product', 'marketing', 'internal'], {
    message: 'Invalid category selected',
  }),

  isPublic: z.boolean().default(false),
});
```

### Type Inference

Zod automatically generates TypeScript types:

```typescript
type CreateProjectInput = z.infer<typeof createProjectSchema>;
// Equivalent to:
// {
//   name: string;
//   description: string;
//   category: 'infrastructure' | 'product' | 'marketing' | 'internal';
//   isPublic: boolean;
// }
```

### Validation Errors

Zod returns errors in a nested structure. We use `.flatten()` for easier handling:

```typescript
const result = schema.safeParse(data);

if (!result.success) {
  result.error.flatten().fieldErrors;
  // {
  //   name: ['Project name is required'],
  //   description: ['Description must be at least 10 characters']
  // }
}
```

## Client-Side Form Component

### useActionState Hook

React 19's `useActionState` manages form state:

```typescript
'use client';

export function ProjectForm({ action }) {
  const [state, formAction, isPending] = useActionState(action, null);
  //     ^       ^            ^
  //     |       |            └─ Boolean: is form submitting?
  //     |       └─ Enhanced action to pass to <form>
  //     └─ Result from last Server Action call

  return (
    <form action={formAction}>
      <Input name="name" />
      {state?.errors?.name && <p>{state.errors.name[0]}</p>}

      <Button disabled={isPending}>
        {isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
```

### Displaying Validation Errors

```typescript
{state?.errors?.name && (
  <p className="text-sm text-red-600 dark:text-red-400">
    {state.errors.name[0]}  {/* Show first error */}
  </p>
)}
```

**Why `[0]`?**
- Zod can return multiple errors per field
- We show only the first for simplicity
- Could show all errors if needed

### Loading States

```typescript
<Button type="submit" disabled={isPending}>
  {isPending ? 'Saving...' : 'Create Project'}
</Button>
```

The `isPending` boolean from `useActionState` tells us when the form is submitting.

## Controlled vs Uncontrolled Components

### Uncontrolled (Default)

Most form fields are **uncontrolled**:

```typescript
<Input name="name" defaultValue={defaultValues.name} />
```

**Benefits:**
- Less React state
- Better performance
- FormData handles values automatically

### Controlled (When Needed)

Some components need to be **controlled**:

```typescript
const [category, setCategory] = useState('infrastructure');

<Select value={category} onValueChange={setCategory}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="infrastructure">Infrastructure</SelectItem>
  </SelectContent>
</Select>
```

**Why controlled?**
- Radix Select needs controlled state
- Switch toggle needs controlled state
- Need to react to value changes

## Boolean Handling in Forms

Checkboxes and switches have special handling:

```typescript
// Checkbox/Switch sends 'on' when checked
const isPublic = formData.get('isPublic') === 'on'
  || formData.get('isPublic') === 'true';
```

**Why the double check?**
- HTML checkboxes send `'on'` when checked
- JavaScript might send `'true'` string
- We handle both cases

## Progressive Enhancement

Our forms work **without JavaScript**:

```tsx
<form action={formAction}>  {/* Not onSubmit! */}
  <Input name="name" required />
  <Button type="submit">Submit</Button>
</form>
```

**How?**
1. Form uses `action` prop (not `onSubmit`)
2. Server Actions work via regular form submission
3. Inputs have `name` attributes
4. Native HTML validation with `required`

**With JavaScript:**
- Client-side validation
- Loading states
- No page refresh
- Better UX

**Without JavaScript:**
- Form still submits
- Server validates
- Page refreshes
- Still works!

## Edit Forms vs Create Forms

We **reuse the same form component** for create and edit:

### Create Form

```typescript
<ProjectForm
  action={createProject}
  submitLabel="Create Project"
/>
```

### Edit Form

```typescript
const updateProjectWithId = updateProject.bind(null, projectId);

<ProjectForm
  action={updateProjectWithId}
  defaultValues={{
    name: project.name,
    description: project.description,
    // ...
  }}
  submitLabel="Save Changes"
/>
```

**Key technique: `.bind()`**

```typescript
const updateProjectWithId = updateProject.bind(null, projectId);
```

This creates a new function with `projectId` pre-filled:

```typescript
// Original function
function updateProject(id, prevState, formData) { }

// Bound function
function updateProjectWithId(prevState, formData) {
  return updateProject(projectId, prevState, formData);
}
```

## Error Handling Layers

We have **multiple layers of validation**:

### 1. HTML Validation (Client)

```tsx
<Input name="name" required minLength={3} maxLength={100} />
```

Basic validation before submission.

### 2. Zod Validation (Server)

```typescript
const result = createProjectSchema.safeParse(rawData);
```

Comprehensive validation in Server Action.

### 3. Database Constraints

```sql
CHECK(category IN ('infrastructure', 'product', 'marketing', 'internal'))
```

Final safeguard at database level.

**Why all three?**
- **HTML**: Quick feedback (best UX)
- **Zod**: Business logic validation (can't be bypassed)
- **Database**: Data integrity (bulletproof)

## Common Patterns

### Global Error Messages

```typescript
{state?.message && !state?.success && (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
    <p className="text-sm text-red-600">{state.message}</p>
  </div>
)}
```

### Field-Level Errors

```typescript
<div className="space-y-2">
  <Label htmlFor="name">Name</Label>
  <Input
    id="name"
    name="name"
    aria-describedby={state?.errors?.name ? 'name-error' : undefined}
  />
  {state?.errors?.name && (
    <p id="name-error" className="text-sm text-red-600">
      {state.errors.name[0]}
    </p>
  )}
</div>
```

**Accessibility note:**
- `aria-describedby` connects input to error message
- Screen readers announce errors when field is focused

## Comparison to Other Approaches

| Approach | Pros | Cons |
|----------|------|------|
| **Server Actions** (ours) | Type-safe, no API routes, works without JS | Relatively new pattern |
| **React Hook Form** | Great DX, popular | Needs client-side validation, more setup |
| **Formik** | Mature, well-documented | Large bundle, overkill for simple forms |
| **Plain fetch()** | Full control | Lots of boilerplate, error-prone |

For this learning project, Server Actions are the most modern and Next.js-idiomatic approach.

## Summary Checklist

When creating a form:

- [ ] Create Zod schema in `lib/validations/`
- [ ] Create Server Action in `lib/actions/`
- [ ] Use `useActionState` in Client Component
- [ ] Add `'use client'` directive
- [ ] Display field errors from `state.errors`
- [ ] Show loading state with `isPending`
- [ ] Use `defaultValue` for edit forms
- [ ] Call `revalidatePath()` after mutations
- [ ] Use `redirect()` to navigate after success
