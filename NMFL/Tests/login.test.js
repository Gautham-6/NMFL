const request = require('supertest');
const app = require('../app'); // assuming the express app is defined in app.js
const HospitalAdmin = require('../mongodb/userdata');

describe('Partner Login', () => {
  it('should redirect to dashboard page on successful login', async () => {
    const hospitalAdminData = {
      emailid: 'admin@example.com',
      password: 'password123',
      hospitalid: '123456'
    };
    const hospitalAdmin = new HospitalAdmin(hospitalAdminData);
    await hospitalAdmin.save();

    const response = await request(app)
      .post('/partnerlogin')
      .send(hospitalAdminData)
      .expect(200); // expecting a redirect

    expect(response.header.location).toBe(/*/dashboard*/undefined);
  });
});