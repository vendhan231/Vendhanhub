import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

async function main(){
  const prisma = new PrismaClient();

  try{
    // Test the connection by running a simple query
    const userCount = await prisma.user.count();
    console.log('✅ Connected to SQLite database successfully!');
    console.log(`📊 Current user count: ${userCount}`);

    // Test with a simple query
    const users = await prisma.user.findMany({
      take: 3,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    console.log('👥 Sample users in database:');
    users.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.username}) - ${user.role}`);
    });

    process.exit(0);
  }catch(err:any){
    console.error('❌ DB connection failed:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
