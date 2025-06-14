# Add New Page

Create a new page for the Harper AI dashboard: $ARGUMENTS

Follow these steps:

1. **Understand the request**: Determine what page needs to be created and its purpose
2. **Check existing pages**: Look at `/src/app/(dashboard)/` directory for patterns
3. **Create the page**: 
   - Use the dashboard layout pattern: `/src/app/(dashboard)/[page-name]/page.tsx`
   - Follow the placeholder page pattern from existing pages like `/contacts` or `/calling`
   - Include proper TypeScript types
   - Use Shadcn/ui components and Tailwind CSS
4. **Add navigation**: Update `/src/components/layouts/Sidebar.tsx` if needed
5. **Test the page**:
   - Run `npm run type-check` to verify no TypeScript errors
   - Run `npm run dev` and test navigation to the new page
   - Verify the page loads without console errors

**Page Template Structure**:
- Professional "Under Construction" design
- Feature roadmap showing planned functionality
- Back navigation button
- Consistent Harper AI branding with gradient-purple-pink theme
- Proper loading states and error handling

**IMPORTANT**: Follow the exact patterns from existing placeholder pages for consistency.