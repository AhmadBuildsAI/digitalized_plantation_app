import { PrismaClient, UserRole, EquipmentType, DeviceStatus, EquipmentState, PlantationStatus, NotificationPriority, NotificationType, TicketCategory, TicketStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const EQUIPMENT_TYPES: EquipmentType[] = [
  EquipmentType.WATER_PUMP,
  EquipmentType.INTAKE_FAN,
  EquipmentType.EXHAUST_FAN,
  EquipmentType.GROW_LIGHTS,
  EquipmentType.HUMIDIFIER,
];

const EQUIPMENT_NAMES: Record<EquipmentType, string> = {
  WATER_PUMP: 'Water Pump',
  INTAKE_FAN: 'Intake Fan',
  EXHAUST_FAN: 'Exhaust Fan',
  GROW_LIGHTS: 'Grow Lights',
  HUMIDIFIER: 'Humidifier',
};

async function main() {
  console.log('🌱 Seeding Digitalized Plantation database...');

  const passwordHash = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@digitalizedplantation.com' },
    update: {},
    create: {
      email: 'admin@digitalizedplantation.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  const support = await prisma.user.upsert({
    where: { email: 'support@digitalizedplantation.com' },
    update: {},
    create: {
      email: 'support@digitalizedplantation.com',
      passwordHash,
      firstName: 'Support',
      lastName: 'Agent',
      role: UserRole.SUPPORT,
      isActive: true,
    },
  });

  const customerPassword = await bcrypt.hash('Customer@123', 12);

  const customerUsers = [
    { email: 'john.green@farm.com', firstName: 'John', lastName: 'Green', company: 'Green Valley Farms' },
    { email: 'sarah.bloom@farm.com', firstName: 'Sarah', lastName: 'Bloom', company: 'Bloom Plantation Co.' },
    { email: 'mike.harvest@farm.com', firstName: 'Mike', lastName: 'Harvest', company: 'Harvest Hills' },
  ];

  for (const cu of customerUsers) {
    const user = await prisma.user.upsert({
      where: { email: cu.email },
      update: {},
      create: {
        email: cu.email,
        passwordHash: customerPassword,
        firstName: cu.firstName,
        lastName: cu.lastName,
        role: UserRole.CUSTOMER,
        isActive: true,
      },
    });

    const customer = await prisma.customer.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        companyName: cu.company,
        manualControlEnabled: cu.email === 'john.green@farm.com',
      },
    });

    await prisma.permission.create({
      data: {
        customerId: customer.id,
        manualControlEnabled: cu.email === 'john.green@farm.com',
        grantedById: admin.id,
      },
    });

    const plantation = await prisma.plantation.create({
      data: {
        customerId: customer.id,
        name: `${cu.company} Main Farm`,
        location: 'California, USA',
        status: PlantationStatus.HEALTHY,
        connectedDevices: 5,
        isOnline: true,
        lastActivityAt: new Date(),
      },
    });

    for (const type of EQUIPMENT_TYPES) {
      const isActive = Math.random() > 0.3;
      await prisma.equipment.create({
        data: {
          plantationId: plantation.id,
          type,
          name: EQUIPMENT_NAMES[type],
          status: isActive ? DeviceStatus.ACTIVE : DeviceStatus.INACTIVE,
          state: isActive ? EquipmentState.ON : EquipmentState.OFF,
          lastActivityAt: new Date(),
        },
      });
    }

    const notifications = [
      { type: NotificationType.SYSTEM, priority: NotificationPriority.LOW, title: 'Welcome to Digitalized Plantation', message: 'Your plantation monitoring system is now active.' },
      { type: NotificationType.LOW_MOISTURE, priority: NotificationPriority.MEDIUM, title: 'Low Moisture Detected', message: 'Soil moisture levels are below optimal range in Zone A.' },
    ];

    if (cu.email === 'mike.harvest@farm.com') {
      notifications.push({
        type: NotificationType.PUMP_FAILURE,
        priority: NotificationPriority.CRITICAL,
        title: 'Pump Failure Alert',
        message: 'Water pump has stopped responding. Immediate attention required.',
      });
    }

    for (const n of notifications) {
      await prisma.notification.create({
        data: { plantationId: plantation.id, ...n },
      });
    }

    await prisma.supportTicket.create({
      data: {
        customerId: customer.id,
        subject: 'Need help with humidity settings',
        category: TicketCategory.PLANTATION_GUIDANCE,
        status: TicketStatus.OPEN,
        priority: NotificationPriority.MEDIUM,
        messages: {
          create: {
            senderId: user.id,
            content: 'Hi, I need guidance on optimal humidity settings for my grow lights setup.',
            isStaff: false,
          },
        },
      },
    });
  }

  console.log('✅ Seed completed!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Admin:    admin@digitalizedplantation.com / Admin@123');
  console.log('  Support:  support@digitalizedplantation.com / Admin@123');
  console.log('  Customer: john.green@farm.com / Customer@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
