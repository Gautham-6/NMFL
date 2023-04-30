const request = require('supertest');
const app = require('../app'); // assuming that your app.js file is located in the same directory as this test file

describe('GET /managehospitals', () => {
  test('responds with status 200', async () => {
    const response = await request(app).get('/managehospitals');
    expect(response.statusCode).toBe(200);
  });

  test('renders the adminmanagement view', async () => {
    const response = await request(app).get('/managehospitals');
    expect(response.text).toContain('  <h3 style="text-align: center; color:cornflowerblue"> Registered Hospital Admins</h3>\r\n');
  });
});