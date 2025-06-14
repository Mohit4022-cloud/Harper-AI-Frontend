# Create New Component

Create a new React component following Harper AI patterns: $ARGUMENTS

## Steps to Follow

1. **Understand the requirement**: 
   - What component needs to be created?
   - Is it a page component, UI component, or layout component?
   - Does it need client-side interactivity?

2. **Choose the right location**:
   - **Pages**: `/src/app/(dashboard)/[name]/page.tsx`
   - **UI Components**: `/src/components/ui/[name].tsx`
   - **Feature Components**: `/src/components/[feature]/[name].tsx`
   - **Layout Components**: `/src/components/layouts/[name].tsx`

3. **Follow component patterns**:
   ```tsx
   // Server component (default)
   export default function ComponentName() {
     return <div>Content</div>
   }
   
   // Client component (when needed)
   'use client'
   import { useState } from 'react'
   export default function InteractiveComponent() {
     const [state, setState] = useState('')
     return <div>Interactive content</div>
   }
   ```

4. **Apply Harper AI styling**:
   - Use **Tailwind CSS classes**
   - Follow **Shadcn/ui patterns**
   - Apply **gradient-purple-pink** for primary actions
   - Use **consistent spacing and typography**
   - Ensure **mobile responsiveness**

5. **Add TypeScript types**:
   - Define proper prop interfaces
   - Use strict typing for all variables
   - Import types from `/src/types/index.ts`
   - Add type annotations for all functions

6. **Include safety measures**:
   - Use **optional chaining** (`?.`) for object properties
   - Add **null checks** for data rendering
   - Include **loading states** when appropriate
   - Handle **error states** gracefully

7. **Test the component**:
   - Run `npm run type-check` to verify TypeScript
   - Test in browser for visual appearance
   - Verify responsive design
   - Check console for errors

## Required Patterns

### Styling
- Use Tailwind: `className="flex items-center space-x-4"`
- Primary button: `className="gradient-purple-pink hover:opacity-90"`
- Cards: Use Shadcn/ui `<Card>` components
- Icons: Import from `lucide-react`

### Data Safety
```tsx
// ✅ Safe property access
{user?.name || 'Unknown User'}
{items?.length > 0 && items.map(item => ...)}

// ❌ Unsafe property access  
{user.name}
{items.map(item => ...)}
```

### TypeScript
```tsx
interface Props {
  title: string
  items?: Item[]
  onClick?: () => void
}

export default function Component({ title, items = [], onClick }: Props) {
  // Component implementation
}
```

**IMPORTANT**: Follow existing component patterns in the codebase for consistency.