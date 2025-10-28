import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const projects = [
  {
    name: 'Alpha 25',
    description: 'Alpha project with Records field',
    billing_formula: 'Records*0.125',
    item_fields: [
      {
        id: 'object_id',
        label: 'Object_ID',
        type: 'text',
        required: true,
        includeInBilling: false,
      },
      {
        id: 'records',
        label: 'Records',
        type: 'number',
        required: true,
        includeInBilling: true,
      },
    ],
    is_active: true,
  },
  {
    name: 'Alpha 35',
    description: 'Alpha project with Records field',
    billing_formula: 'Records*0.095',
    item_fields: [
      {
        id: 'object_id',
        label: 'Object_ID',
        type: 'text',
        required: true,
        includeInBilling: false,
      },
      {
        id: 'records',
        label: 'Records',
        type: 'number',
        required: true,
        includeInBilling: true,
      },
    ],
    is_active: true,
  },
  {
    name: 'Gamma 133',
    description: 'Gamma project with Characters field',
    billing_formula: '(Characters/1000)*4.84',
    item_fields: [
      {
        id: 'object_id',
        label: 'Object_ID',
        type: 'text',
        required: true,
        includeInBilling: false,
      },
      {
        id: 'characters',
        label: 'Characters',
        type: 'number',
        required: true,
        includeInBilling: true,
      },
    ],
    is_active: true,
  },
  {
    name: 'Gamma 138',
    description: 'Gamma project with Characters field',
    billing_formula: '(Characters/1000)*4.95',
    item_fields: [
      {
        id: 'object_id',
        label: 'Object_ID',
        type: 'text',
        required: true,
        includeInBilling: false,
      },
      {
        id: 'characters',
        label: 'Characters',
        type: 'number',
        required: true,
        includeInBilling: true,
      },
    ],
    is_active: true,
  },
  {
    name: 'Gamma 139',
    description: 'Gamma project with Characters and Pages fields',
    billing_formula: '(Pages*0.05)+(Characters/1000)*4.95',
    item_fields: [
      {
        id: 'object_id',
        label: 'Object_ID',
        type: 'text',
        required: true,
        includeInBilling: false,
      },
      {
        id: 'characters',
        label: 'Characters',
        type: 'number',
        required: true,
        includeInBilling: true,
      },
      {
        id: 'pages',
        label: 'Pages',
        type: 'number',
        required: true,
        includeInBilling: true,
      },
    ],
    is_active: true,
  },
];

async function main() {
  console.log('Seeding projects...');

  for (const project of projects) {
    const existingProject = await prisma.project.findFirst({
      where: { name: project.name },
    });

    if (existingProject) {
      console.log(`Project ${project.name} already exists, updating...`);
      await prisma.project.update({
        where: { id: existingProject.id },
        data: {
          description: project.description,
          fieldConfig: JSON.stringify({
            report_level: [],
            item_level: project.item_fields.map(field => ({
              label: field.label,
              type: field.type,
              required: field.required,
              options: [],
              unique: false,
              includeInBilling: field.includeInBilling,
            }))
          }),
          billingConfig: JSON.stringify({
            rateType: 'custom_formula',
            formula: project.billing_formula,
            rateValue: 0,
          }),
          billingType: 'custom_formula',
          ratePerHour: 0,
          is_active: project.is_active,
        },
      });
    } else {
      console.log(`Creating project ${project.name}...`);
      await prisma.project.create({
        data: {
          name: project.name,
          description: project.description,
          fieldConfig: JSON.stringify({
            report_level: [],
            item_level: project.item_fields.map(field => ({
              label: field.label,
              type: field.type,
              required: field.required,
              options: [],
              unique: false,
              includeInBilling: field.includeInBilling,
            }))
          }),
          billingConfig: JSON.stringify({
            rateType: 'custom_formula',
            formula: project.billing_formula,
            rateValue: 0,
          }),
          billingType: 'custom_formula',
          ratePerHour: 0,
          is_active: project.is_active,
        } as any,
      });
    }
  }

  console.log('Projects seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });