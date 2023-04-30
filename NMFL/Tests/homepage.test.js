const request = require('supertest');
const app = require('../app'); // assuming that your app.js file is located in the same directory as this test file

describe('GET /homepage', () => {
  test('responds with status 200', async () => {
    const response = await request(app).get('/homepage');
    expect(response.statusCode).toBe(200);
  });

  test('renders the homepage view', async () => {
    const response = await request(app).get('/homepage');
    expect(response.text).toContain('<h1>Welcome to the homepage</h1>');
    // assuming that your homepage view contains a <h1>Welcome to the homepage</h1> tag
  });
});
