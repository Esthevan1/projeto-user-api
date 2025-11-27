// quick debug script to reproduce e2e requests against the app in test mode
process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });
require('ts-node/register');

const request = require('supertest');
const { app } = require('../src/app');
const { generateToken } = require('../src/auth/mock-jwks');
const token = generateToken('admin');

(async () => {
  console.log('Using token (truncated):', token.slice(0, 40) + '...');

  let res = await request(app).post('/api/v1/services').set('Authorization', `Bearer ${token}`).send({ name: 'Dbg Service', durationMin: 20 });
  console.log('/api/v1/services ->', res.status, res.body);

  res = await request(app).get('/api/v1/services').set('Authorization', `Bearer ${token}`);
  console.log('/api/v1/services GET ->', res.status, res.body);

  // try creating appointment (need a service id)
  const serviceId = (res.body && res.body[0] && res.body[0].id) || null;
  console.log('serviceId:', serviceId);
  if (serviceId) {
    const start = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const r2 = await request(app).post('/api/v1/appointments').set('Authorization', `Bearer ${token}`).send({ serviceId, startAt: start });
    console.log('/api/v1/appointments POST ->', r2.status, r2.body);
  }
})();
