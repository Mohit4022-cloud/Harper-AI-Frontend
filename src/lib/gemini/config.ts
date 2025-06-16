export const GEMINI_CONFIG = {
  apiKey: '', // Set via environment variable or user input
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
  model: 'gemini-1.5-pro'
};

export const ICP_CRITERIA = {
  employeeRange: { min: 250, max: 5000 },
  targetIndustries: [
    'technology',
    'financial services',
    'healthcare',
    'manufacturing',
    'retail',
    'software',
    'fintech'
  ],
  seniorTitles: [
    'director',
    'vp',
    'vice president',
    'cfo',
    'cio',
    'ciso',
    'chief',
    'head of',
    'senior manager',
    'principal'
  ],
  targetDepartments: ['it', 'procurement', 'finance', 'strategy', 'security']
};