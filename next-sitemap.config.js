/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://app.harperai.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: [
    '/api/*',
    '/server-sitemap.xml',
    '/404',
    '/500',
    '/(auth)/*',
    '/admin/*',
  ],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://app.harperai.com/server-sitemap.xml',
    ],
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/static/',
        ],
      },
    ],
  },
  transform: async (config, path) => {
    // Custom transform for specific paths
    const customPriorities = {
      '/': 1.0,
      '/dashboard': 0.9,
      '/contacts': 0.8,
      '/calling': 0.8,
      '/reports': 0.7,
    }

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: customPriorities[path] || config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    }
  },
}