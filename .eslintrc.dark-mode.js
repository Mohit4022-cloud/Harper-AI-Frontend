/**
 * ESLint rules to enforce dark mode patterns in Harper-AI
 * Add this to your .eslintrc.js extends array
 */

module.exports = {
  rules: {
    // Warn when common color classes are used without dark variants
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'JSXAttribute[name.name="className"][value.value=/\\b(bg-white|bg-gray-50|bg-gray-100|text-gray-900|text-gray-800|border-gray-200)\\b/]:not([value.value=/dark:/])',
        message: 'Consider adding dark mode variant for this color class. Example: bg-white → bg-white dark:bg-gray-900'
      },
      {
        selector: 'TemplateLiteral:has(TemplateElement[value.raw=/\\b(bg-white|bg-gray-50|bg-gray-100|text-gray-900|text-gray-800|border-gray-200)\\b/]):not(:has(TemplateElement[value.raw=/dark:/]))',
        message: 'Consider adding dark mode variant for this color class in template literal'
      }
    ],
    
    // Suggest using theme utility functions
    'prefer-theme-utils': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer using theme utility functions for consistent dark mode support'
        }
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name === 'className' && node.value) {
              const classNames = node.value.value || ''
              const hasColorClass = /\b(bg-|text-|border-)/.test(classNames)
              const hasDarkVariant = /\bdark:/.test(classNames)
              
              if (hasColorClass && !hasDarkVariant) {
                context.report({
                  node,
                  message: 'Consider using themeClass() utility or adding dark: variants for color classes',
                  suggest: [
                    {
                      desc: 'Import and use themeClass utility',
                      fix(fixer) {
                        return null // Implement auto-fix if needed
                      }
                    }
                  ]
                })
              }
            }
          }
        }
      }
    }
  }
}