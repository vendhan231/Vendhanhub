import { PrismaClient } from '../employee-management-billing-backend/node_modules/@prisma/client';
import bcrypt from '../employee-management-billing-backend/node_modules/bcrypt';

const prisma = new PrismaClient();

const users = [
  { name: 'Angeeswari', password: '123456' },
  { name: 'Anusuya', password: '123456' },
  { name: 'Balkees', password: '123456' },
  { name: 'Barathi', password: '123456' },
  { name: 'Chitra', password: '123456' },
  { name: 'Deepa.m', password: '123456' },
  { name: 'Deepa.s', password: '123456' },
  { name: 'Dharini', password: '123456' },
  { name: 'Gayathri', password: '123456' },
  { name: 'Hema', password: '123456' },
  { name: 'Jeevitha', password: '123456' },
  { name: 'Jeynandhini', password: '123456' },
  { name: 'Kalaivani', password: '123456' },
  { name: 'kaleeswari', password: '123456' },
  { name: 'Karthika', password: '123456' },
  { name: 'Keerthana', password: '123456' },
  { name: 'Kulanthayammal', password: '123456' },
  { name: 'Lakshmipriya', password: '123456' },
  { name: 'Mathavi', password: '123456' },
  { name: 'Meena', password: '123456' },
  { name: 'Nithiya', password: '123456' },
  { name: 'Pandiselvi', password: '123456' },
  { name: 'Ponnarasi', password: '123456' },
  { name: 'Selvapriya', password: '123456' },
  { name: 'Senbagapriya', password: '123456' },
  { name: 'shanmugapriya.s', password: '123456' },
  { name: 'Sheeja', password: '123456' },
  { name: 'sujitha', password: '123456' },
  { name: 'swathi', password: '123456' },
  { name: 'Varshini', password: '123456' },
  { name: 'Deepa.T', password: '123456' },
];

const adminUser = {
  name: 'renuga',
  password: 'vendhan@123',
  role: 'ADMIN'
};

async function seedUsers() {
  try {
    console.log('Starting user seeding...');

    // Hash passwords
    const saltRounds = 10;

    // Create admin user
    const adminPasswordHash = await bcrypt.hash(adminUser.password, saltRounds);
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
    console.log(`Created/updated admin user: ${admin.username}`);

    // Create employee users
    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, saltRounds);

      // Split name for first and last name
      const nameParts = user.name.split('.');
      const firstName = nameParts[0] || user.name;
      const lastName = nameParts[1] || '';

      const employee = await prisma.user.upsert({
        where: { username: user.name.toLowerCase() },
        update: {},
        create: {
          username: user.name.toLowerCase(),
          email: `${user.name.toLowerCase()}@company.com`,
          passwordHash: passwordHash,
          role: 'EMPLOYEE',
          firstName: firstName,
          lastName: lastName,
          department: 'Operations',
          joinDate: new Date(),
        },
      });
      console.log(`Created/updated user: ${employee.username}`);
    }

    console.log('User seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();