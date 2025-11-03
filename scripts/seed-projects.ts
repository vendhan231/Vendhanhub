// Script to seed the database with the specified projects
import { PrismaClient } from '../employee-management-billing-backend/node_modules/@prisma/client';

const prisma = new PrismaClient();

async function seedProjects() {
  console.log('🌱 Seeding projects...');

  try {
    // Clear existing projects (optional - remove if you want to keep existing data)
    // await prisma.project.deleteMany();

    const projects = [
      {
        name: 'Alpha 25',
        billingType: 'count_based' as const,
        ratePerHour: null,
        countMetricLabel: 'Records',
        countDivisor: 1,
        countMultiplier: 0.125,
        fieldConfig: JSON.stringify([
          {
            label: 'Object ID',
            type: 'text' as const,
            required: true,
            unique: true,
            includeInBilling: false
          },
          {
            label: 'Records',
            type: 'number' as const,
            required: true,
            unique: false,
            includeInBilling: true
          }
        ]),
        billingConfig: JSON.stringify({
          rateType: 'per_count_field',
          rateValue: 0.125,
          countField: 'Records',
          formula: 'Records*0.125'
        }),
        is_active: true,
        description: 'Alpha 25 project with Records-based billing at $0.125 per record'
      },
      {
        name: 'Alpha 35',
        billingType: 'count_based' as const,
        ratePerHour: null,
        countMetricLabel: 'Records',
        countDivisor: 1,
        countMultiplier: 0.095,
        fieldConfig: JSON.stringify([
          {
            label: 'Object ID',
            type: 'text' as const,
            required: true,
            unique: true,
            includeInBilling: false
          },
          {
            label: 'Records',
            type: 'number' as const,
            required: true,
            unique: false,
            includeInBilling: true
          }
        ]),
        billingConfig: JSON.stringify({
          rateType: 'per_count_field',
          rateValue: 0.095,
          countField: 'Records',
          formula: 'Records*0.095'
        }),
        is_active: true,
        description: 'Alpha 35 project with Records-based billing at $0.095 per record'
      },
      {
        name: 'Gamma 133',
        billingType: 'count_based' as const,
        ratePerHour: null,
        countMetricLabel: 'Characters',
        countDivisor: 1000,
        countMultiplier: 4.84,
        fieldConfig: JSON.stringify([
          {
            label: 'Object ID',
            type: 'text' as const,
            required: true,
            unique: true,
            includeInBilling: false
          },
          {
            label: 'Characters',
            type: 'number' as const,
            required: true,
            unique: false,
            includeInBilling: true
          }
        ]),
        billingConfig: JSON.stringify({
          rateType: 'custom_formula',
          rateValue: 4.84,
          countField: 'Characters',
          formula: '(Characters/1000)*4.84'
        }),
        is_active: true,
        description: 'Gamma 133 project with Characters-based billing at $4.84 per 1000 characters'
      },
      {
        name: 'Gamma 138',
        billingType: 'count_based' as const,
        ratePerHour: null,
        countMetricLabel: 'Characters',
        countDivisor: 1000,
        countMultiplier: 4.95,
        fieldConfig: JSON.stringify([
          {
            label: 'Object ID',
            type: 'text' as const,
            required: true,
            unique: true,
            includeInBilling: false
          },
          {
            label: 'Characters',
            type: 'number' as const,
            required: true,
            unique: false,
            includeInBilling: true
          }
        ]),
        billingConfig: JSON.stringify({
          rateType: 'custom_formula',
          rateValue: 4.95,
          countField: 'Characters',
          formula: '(Characters/1000)*4.95'
        }),
        is_active: true,
        description: 'Gamma 138 project with Characters-based billing at $4.95 per 1000 characters'
      },
      {
        name: 'Gamma 139',
        billingType: 'count_based' as const,
        ratePerHour: null,
        countMetricLabel: 'Pages',
        countDivisor: 1,
        countMultiplier: 0.05,
        fieldConfig: JSON.stringify([
          {
            label: 'Object ID',
            type: 'text' as const,
            required: true,
            unique: true,
            includeInBilling: false
          },
          {
            label: 'Characters',
            type: 'number' as const,
            required: true,
            unique: false,
            includeInBilling: true
          },
          {
            label: 'Pages',
            type: 'number' as const,
            required: true,
            unique: false,
            includeInBilling: true
          }
        ]),
        billingConfig: JSON.stringify({
          rateType: 'custom_formula',
          rateValue: 0.05,
          countField: 'Pages',
          formula: '(Pages*0.05)+(Characters/1000)*4.95'
        }),
        is_active: true,
        description: 'Gamma 139 project with Pages and Characters-based billing'
      }
    ];

    for (const projectData of projects) {
      const existingProject = await prisma.project.findFirst({
        where: { name: projectData.name }
      });

      if (existingProject) {
        console.log(`✅ Project "${projectData.name}" already exists, skipping...`);
        continue;
      }

      const newProject = await prisma.project.create({
        data: projectData
      });

      console.log(`✅ Created project: ${newProject.name} (ID: ${newProject.id})`);
    }

    console.log('🎉 Project seeding completed successfully!');

    // Display all projects
    const allProjects = await prisma.project.findMany({
      orderBy: { name: 'asc' }
    });

    console.log('\n📋 All Projects in Database:');
    allProjects.forEach(project => {
      console.log(`- ${project.name}: ${project.billingType} billing`);
    });

  } catch (error) {
    console.error('❌ Error seeding projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedProjects();