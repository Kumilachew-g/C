require('dotenv').config();
const { sequelize } = require('./models');
const { Role, User, CommissionerProfile, Engagement } = require('./models');
const { ROLES } = require('./utils/roles');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

async function seed() {
  try {
    // Ensure DB schema
    await sequelize.sync();

    // Seed roles
    const roleRecords = {};
    for (const roleName of Object.values(ROLES)) {
      const [role] = await Role.findOrCreate({
        where: { name: roleName },
        defaults: { description: `${roleName} role` },
      });
      roleRecords[roleName] = role;
    }

    // Admin user
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminPass123!';
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const adminHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

    const [adminUser] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        fullName: 'System Administrator',
        email: adminEmail,
        password: adminHash,
        roleId: roleRecords[ROLES.ADMIN].id,
        status: 'active',
      },
    });

    // Commissioner users
    const commissionerPassword = process.env.SEED_COMMISSIONER_PASSWORD || 'CommPass123!';
    const commissionerHash = await bcrypt.hash(commissionerPassword, SALT_ROUNDS);

    const commissionersData = [
      {
        fullName: 'Commissioner One',
        email: 'commissioner1@example.com',
        title: 'Commissioner for Health',
        office: 'Health Commission',
      },
      {
        fullName: 'Commissioner Two',
        email: 'commissioner2@example.com',
        title: 'Commissioner for Education',
        office: 'Education Commission',
      },
    ];

    const commissioners = [];

    for (const data of commissionersData) {
      const [user] = await User.findOrCreate({
        where: { email: data.email },
        defaults: {
          fullName: data.fullName,
          email: data.email,
          password: commissionerHash,
          roleId: roleRecords[ROLES.COMMISSIONER].id,
          status: 'active',
        },
      });

      await CommissionerProfile.findOrCreate({
        where: { userId: user.id },
        defaults: {
          userId: user.id,
          title: data.title,
          office: data.office,
        },
      });

      commissioners.push(user);
    }

    // Secretariat user
    const secretariatPassword = process.env.SEED_SECRETARIAT_PASSWORD || 'SecretariatPass123!';
    const secretariatHash = await bcrypt.hash(secretariatPassword, SALT_ROUNDS);
    await User.findOrCreate({
      where: { email: 'secretariat@example.com' },
      defaults: {
        fullName: 'Secretariat User',
        email: 'secretariat@example.com',
        password: secretariatHash,
        roleId: roleRecords[ROLES.SECRETARIAT].id,
        status: 'active',
      },
    });

    // Department user
    const deptPassword = process.env.SEED_DEPARTMENT_PASSWORD || 'DeptPass123!';
    const deptHash = await bcrypt.hash(deptPassword, SALT_ROUNDS);
    await User.findOrCreate({
      where: { email: 'department.user@example.com' },
      defaults: {
        fullName: 'Department User',
        email: 'department.user@example.com',
        password: deptHash,
        roleId: roleRecords[ROLES.DEPARTMENT_USER].id,
        status: 'active',
      },
    });

    // Auditor user
    const auditorPassword = process.env.SEED_AUDITOR_PASSWORD || 'AuditorPass123!';
    const auditorHash = await bcrypt.hash(auditorPassword, SALT_ROUNDS);
    await User.findOrCreate({
      where: { email: 'auditor@example.com' },
      defaults: {
        fullName: 'Audit User',
        email: 'auditor@example.com',
        password: auditorHash,
        roleId: roleRecords[ROLES.AUDITOR].id,
        status: 'active',
      },
    });

    // Sample engagements
    if (commissioners.length > 0) {
      const [c1, c2] = commissioners;
      await Engagement.findOrCreate({
        where: { referenceNo: 'ENG-001' },
        defaults: {
          referenceNo: 'ENG-001',
          purpose: 'Stakeholder meeting on healthcare reforms',
          date: new Date().toISOString().slice(0, 10),
          time: '10:00:00',
          status: 'scheduled',
          commissionerId: c1.id,
          createdBy: adminUser.id,
        },
      });

      await Engagement.findOrCreate({
        where: { referenceNo: 'ENG-002' },
        defaults: {
          referenceNo: 'ENG-002',
          purpose: 'Briefing on education initiatives',
          date: new Date().toISOString().slice(0, 10),
          time: '14:00:00',
          status: 'draft',
          commissionerId: c2.id,
          createdBy: adminUser.id,
        },
      });
    }

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

seed();


