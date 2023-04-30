const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // assuming the app is defined in a separate file
const AdminDetails = require('../mongodb/admindata'); // assuming the AdminDetails model is defined in a separate file

describe('Admin Login', () => {
  beforeEach(async () => {
    // await AdminDetails.deleteMany({});
  });

  it('should redirect to admin dashboard if the email and password are correct', (done) => {
    const adminDetails = new AdminDetails({
      Email: 'admin@example.com',
      Password: 'password123'
    });
    adminDetails.save((err) => {
      if (err) return done(err);

      request(app)
        .post('/adminlogin')
        .send({
          adminemail: 'admin@example.com',
          adminpassword: 'password123'
        })
        .expect(302)
        .expect('Location', '/admindashboard')
        .end(done);
    });
  });

});
