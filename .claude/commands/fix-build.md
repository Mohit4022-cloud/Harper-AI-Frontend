# Fix Build Errors

Please diagnose and fix any build or compilation errors in the Harper AI project.

Follow these steps:

1. **Run type-check**: Execute `npm run type-check` to identify TypeScript errors
2. **Run build**: Execute `npm run build` to identify compilation issues
3. **Analyze errors**: Read and understand each error message
4. **Fix systematically**: Address each error one by one:
   - Fix TypeScript type errors with proper typing
   - Add missing imports or exports
   - Fix syntax errors
   - Ensure all components follow Next.js App Router patterns
5. **Verify fix**: Re-run `npm run type-check` and `npm run build`
6. **Test locally**: Run `npm run dev` to ensure the app starts correctly

**IMPORTANT**: 
- Use optional chaining (`?.`) for null safety
- Follow the code style guidelines in CLAUDE.md
- Don't break existing functionality
- Test the login flow works after fixes

If you encounter specific patterns, refer to existing working components in the codebase for guidance.