# Test Plan - CRUD Next.js Application

This document lists all use cases that should be tested to ensure the application works correctly. Use this as a checklist when making changes.

## Quick Smoke Test

Run these after any significant change:

```bash
pnpm build          # Should complete without errors
pnpm dev            # Start dev server
# Then test manually or with agent-browser
```

---

## 1. Project List (Dashboard)

### 1.1 View Projects
- [ ] Dashboard loads at `/`
- [ ] Projects are displayed in a grid layout
- [ ] Each project card shows: name, description (truncated), category badge, visibility badge, relative time
- [ ] "New Project" button is visible in header

### 1.2 Empty State
- [ ] When no projects exist, empty state message is shown
- [ ] "Create Project" button is visible in empty state

---

## 2. Create Project

### 2.1 Navigation
- [ ] Clicking "New Project" navigates to `/projects/new`
- [ ] Form page loads correctly with all fields

### 2.2 Form Fields
- [ ] Project Name field accepts input
- [ ] Description textarea accepts input
- [ ] Category dropdown opens and shows all options (Infrastructure, Product, Marketing, Internal)
- [ ] Category selection works correctly
- [ ] Public visibility toggle switches on/off

### 2.3 Form Validation
- [ ] Submitting empty form shows validation errors
- [ ] Name must be at least 3 characters
- [ ] Description must be at least 10 characters
- [ ] Validation errors display below respective fields

### 2.4 Successful Submission
- [ ] Valid form submission creates project
- [ ] User is redirected to the new project's detail page
- [ ] Project appears in dashboard list

### 2.5 Cancel Action
- [ ] Cancel button navigates back to dashboard
- [ ] No project is created when canceling

---

## 3. View Project

### 3.1 Navigation
- [ ] Clicking project card navigates to `/projects/[id]`
- [ ] Breadcrumb shows "Projects > [Project Name]"

### 3.2 Project Details
- [ ] Project name displays correctly
- [ ] Description displays in full
- [ ] Category badge shows correct category
- [ ] Visibility status displays (Public/Private)
- [ ] Created date and Updated date display correctly

### 3.3 Actions
- [ ] "Edit Project" button is visible
- [ ] Delete section (danger zone) is visible at bottom

### 3.4 Invalid Project IDs
- [ ] `/projects/invalid-id` returns 404
- [ ] `/projects/999999` (non-existent) returns 404
- [ ] `/projects/0` returns 404
- [ ] `/projects/-1` returns 404

---

## 4. Edit Project

### 4.1 Navigation
- [ ] Clicking "Edit Project" navigates to `/projects/[id]/edit`
- [ ] Form is pre-filled with existing project data

### 4.2 Form Pre-population
- [ ] Name field shows current name
- [ ] Description shows current description
- [ ] Category dropdown shows current category
- [ ] Visibility toggle reflects current state

### 4.3 Successful Update
- [ ] Changing fields and submitting updates project
- [ ] User is redirected to project detail page
- [ ] Updated values are reflected
- [ ] "Updated" timestamp changes

### 4.4 Cancel Action
- [ ] Cancel button navigates back to dashboard
- [ ] No changes are saved when canceling

### 4.5 Invalid Project IDs
- [ ] `/projects/invalid-id/edit` returns 404
- [ ] `/projects/999999/edit` (non-existent) returns 404

---

## 5. Delete Project

### 5.1 Delete Flow
- [ ] Clicking "Delete Project" opens confirmation dialog
- [ ] Dialog shows project name
- [ ] Dialog has Cancel and "Delete Forever" buttons

### 5.2 Cancel Delete
- [ ] Clicking Cancel closes dialog
- [ ] Project is not deleted

### 5.3 Confirm Delete
- [ ] Clicking "Delete Forever" deletes the project
- [ ] User is redirected to dashboard
- [ ] Project no longer appears in list
- [ ] Navigating to deleted project's URL returns 404

---

## 6. UI/UX

### 6.1 Responsive Design
- [ ] Dashboard displays correctly on mobile viewport
- [ ] Forms are usable on mobile
- [ ] Project detail page is readable on mobile

### 6.2 Dark Mode
- [ ] Application respects system color scheme preference
- [ ] All components render correctly in dark mode

### 6.3 Loading States
- [ ] Form submit buttons show loading state ("Saving...", "Deleting...")
- [ ] Buttons are disabled during submission

### 6.4 Accessibility
- [ ] All interactive elements are keyboard accessible
- [ ] Form labels are properly associated with inputs
- [ ] Focus states are visible

---

## 7. Edge Cases

### 7.1 Data Integrity
- [ ] Special characters in project name are handled correctly
- [ ] Very long project names display correctly (truncation)
- [ ] Very long descriptions display correctly

### 7.2 Concurrent Operations
- [ ] Editing a project that was just deleted shows 404
- [ ] Creating multiple projects in quick succession works

---

## Browser Testing Commands

Using `agent-browser` for automated testing:

```bash
# Start dev server first
pnpm dev

# Open app in headed mode
agent-browser open http://localhost:3000 --headed

# Get interactive elements
agent-browser snapshot -i

# Click element by reference
agent-browser click @e1

# Fill input field
agent-browser fill @e2 "Test Value"

# Take screenshot
agent-browser screenshot

# Close browser
agent-browser close
```

---

## Test Scenarios by Priority

### P0 - Critical (Test on every change)
1. Build succeeds (`pnpm build`)
2. Create project flow works
3. View project works
4. Delete project works

### P1 - High (Test on UI/form changes)
1. Form validation works
2. Edit project flow works
3. Invalid ID handling (404s)

### P2 - Medium (Test periodically)
1. Responsive design
2. Dark mode
3. Loading states

### P3 - Low (Test on major refactors)
1. Edge cases
2. Accessibility
3. Concurrent operations

---

## Regression Checklist

After fixing bugs, verify these common regression points:

- [ ] Redirect after form submission works (not swallowed by error handling)
- [ ] Button/Link patterns render valid HTML (no `<a><button>` nesting)
- [ ] ID validation guards against NaN/invalid values
- [ ] TypeScript build passes without errors
- [ ] All form error states display correctly
