const request = require('supertest');
const app = require('../src/app');
const { sequelize, Role, User } = require('../src/models');
const { ROLES } = require('../src/utils/roles');
const bcrypt = require('bcrypt');

describe('Auth API', () => {
  let adminToken;

  beforeAll(async () => {
    await sequelize.sync();

    const [adminRole] = await Role.findOrCreate({
      where: { name: ROLES.ADMIN },
      defaults: { description: 'admin role' },
    });

    const password = 'AdminPass123!';
    const hash = await bcrypt.hash(password, 10);

    const [admin] = await User.findOrCreate({
      where: { email: 'test-admin@example.com' },
      defaults: {
        fullName: 'Test Admin',
        email: 'test-admin@example.com',
        password: hash,
        roleId: adminRole.id,
        status: 'active',
      },
    });

    const res = await request(app).post('/api/auth/login').send({
      email: admin.email,
      password,
    });

    adminToken = res.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('login returns token with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test-admin@example.com',
      password: 'AdminPass123!',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
  });

  test('register creates a new user when called by admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'API Test User',
        email: 'apitest.user@example.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', 'apitest.user@example.com');
  });
});


