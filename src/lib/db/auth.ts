import { PrismaClient, User as PrismaUser } from '@prisma/client';
import { hashPassword } from '@/lib/auth/bcrypt';

// Create a singleton instance of Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * User database operations
 */
export const userDb = {
  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<PrismaUser | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  },

  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<PrismaUser | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  /**
   * Create a new user
   */
  async create(data: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }): Promise<PrismaUser> {
    const hashedPassword = await hashPassword(data.password);
    
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        name: data.name,
        role: data.role || 'user',
      },
    });
  },

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  },

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await hashPassword(newPassword);
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  },

  /**
   * Check if user exists by email
   */
  async exists(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  },

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: {
      name?: string;
      phone?: string;
      avatar?: string;
    }
  ): Promise<PrismaUser> {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  },

  /**
   * Delete a user (soft delete by setting isActive to false)
   */
  async softDelete(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  },
};