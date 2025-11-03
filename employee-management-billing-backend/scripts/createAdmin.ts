const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const adminUser = {
  name: 'renuga',
  password: 'vendhan@123',
  role: 'ADMIN'
};

async function createAdmin() {
  try {
    console.log('Creating admin user...');

    // Hash password
    const saltRounds = 10;
    const adminPasswordHash = await bcrypt.hash(adminUser.password, saltRounds);

    // Create admin user
    const admin = await prisma.user.upsert({
      where: { username: adminUser.name },
      update: {},
      create: {
        username: adminUser.name,
        email: `${adminUser.name}@company.com`,
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        firstName: adminUser.name,
        lastName: 'Admin',
        department: 'Administration',
        joinDate: new Date(),
      },
    });

    console.log(`Admin user created/updated: ${admin.username}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();