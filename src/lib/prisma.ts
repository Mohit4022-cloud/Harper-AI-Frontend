import { PrismaClient } from '@prisma/client'

const prismaConfig = {
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn'] as const
    : ['error'] as const,
  // bypass TS so we can pass the engine flag
  __internal: {
    engine: {
      enableTracing: false,
    },
  },
} as any // <-- cast to any

export const prisma =
  global.prisma ||
  new PrismaClient(prismaConfig)

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}