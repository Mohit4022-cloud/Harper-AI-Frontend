import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth/bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await hashPassword('admin123!');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@harperai.com' },
    update: {},
    create: {
      email: 'admin@harperai.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'admin',
      isActive: true,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create demo users
  const demoPassword = await hashPassword('demo123!');
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@harperai.com' },
    update: {},
    create: {
      email: 'demo@harperai.com',
      name: 'Demo User',
      password: demoPassword,
      role: 'user',
      isActive: true,
    },
  });
  console.log('✅ Created demo user:', demoUser.email);

  const sdrUser = await prisma.user.upsert({
    where: { email: 'sdr@harperai.com' },
    update: {},
    create: {
      email: 'sdr@harperai.com',
      name: 'SDR User',
      password: demoPassword,
      role: 'sdr',
      isActive: true,
    },
  });
  console.log('✅ Created SDR user:', sdrUser.email);

  // Create some sample contacts for the demo user
  const contacts = [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      company: 'Acme Corp',
      position: 'CEO',
      userId: demoUser.id,
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+0987654321',
      company: 'Tech Inc',
      position: 'CTO',
      userId: demoUser.id,
    },
    {
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      company: 'Startup LLC',
      position: 'Founder',
      userId: demoUser.id,
    },
  ];

  for (const contact of contacts) {
    await prisma.contact.create({
      data: contact,
    });
  }
  console.log('✅ Created sample contacts');

  console.log('🎉 Database seed completed!');
  console.log('');
  console.log('Test credentials:');
  console.log('Admin: admin@harperai.com / admin123!');
  console.log('Demo: demo@harperai.com / demo123!');
  console.log('SDR: sdr@harperai.com / demo123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });