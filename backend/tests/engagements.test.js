const request = require('supertest');
const app = require('../src/app');
const { sequelize, Role, User, CommissionerProfile, Engagement } = require('../src/models');
const { ROLES } = require('../src/utils/roles');
const bcrypt = require('bcrypt');

describe('Engagements API', () => {
  let adminToken;
  let commissioner;

  beforeAll(async () => {
    await sequelize.sync();

    const [[adminRole], [commRole]] = await Promise.all([
      Role.findOrCreate({
        where: { name: ROLES.ADMIN },
        defaults: { description: 'admin role' },
      }),
      Role.findOrCreate({
        where: { name: ROLES.COMMISSIONER },
        defaults: { description: 'commissioner role' },
      }),
    ]);

    const password = 'AdminPass123!';
    const hash = await bcrypt.hash(password, 10);

    const [admin] = await User.findOrCreate({
      where: { email: 'eng-admin@example.com' },
      defaults: {
        fullName: 'Engagement Admin',
        email: 'eng-admin@example.com',
        password: hash,
        roleId: adminRole.id,
        status: 'active',
      },
    });

    const [comm] = await User.findOrCreate({
      where: { email: 'eng-commissioner@example.com' },
      defaults: {
        fullName: 'Engagement Commissioner',
        email: 'eng-commissioner@example.com',
        password: hash,
        roleId: commRole.id,
        status: 'active',
      },
    });

    await CommissionerProfile.findOrCreate({
      where: { userId: comm.id },
      defaults: {
        userId: comm.id,
        title: 'Commissioner for Testing',
        office: 'Test Office',
      },
    });

    commissioner = comm;

    const loginRes = await request(app).post('/api/auth/login').send({
      email: admin.email,
      password,
    });
    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('creates a new engagement when authorized', async () => {
    const res = await request(app)
      .post('/api/engagements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        referenceNo: 'TEST-ENG-001',
        purpose: 'API test engagement',
        date: new Date().toISOString().slice(0, 10),
        time: '09:00:00',
        commissionerId: commissioner.id,
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('referenceNo', 'TEST-ENG-001');
  });

  test('lists engagements for authenticated user', async () => {
    const res = await request(app)
      .get('/api/engagements')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});


