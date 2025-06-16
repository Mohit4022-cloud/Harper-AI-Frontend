import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create PrismaClient with error handling
function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'minimal',
  })

  // Add connection error handling
  client.$connect().catch((error) => {
    console.error('Failed to connect to database:', error)
    console.error('Please check DATABASE_URL environment variable')
  })

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Enable query logging in development
if (process.env.NODE_ENV === 'development') {
  prisma.$use(async (params, next) => {
    const before = Date.now()
    const result = await next(params)
    const after = Date.now()
    
    console.log(
      `Query ${params.model}.${params.action} took ${after - before}ms`
    )
    
    return result
  })
}

// Health check function
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { connected: true }
  } catch (error) {
    console.error('Database connection check failed:', error)
    return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}