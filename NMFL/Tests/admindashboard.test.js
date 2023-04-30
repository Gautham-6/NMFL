const request = require('supertest');
const app = require('../app'); // assuming that your app.js file is located in the same directory as this test file

describe('GET /admindashboard', () => {
  test('responds with status 200', async () => {
    const response = await request(app).get('/admindashboard');
    expect(response.statusCode).toBe(200);
  });

  test('renders the admindashboard view', async () => {
    const response = await request(app).get('/admindashboard');
    expect(response.text).toContain('  <h3 style="text-align: center; color:cornflowerblue"> Registered Hospital Admins</h3>\r\n');
  });
});