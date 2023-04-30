const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');

describe('/hospitalsignup', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb+srv://team3nmfl:nmfl7880@nmfl1.9dtwhan.mongodb.net/?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should add a new hospital admin to the database', async () => {
    const res = await request(app)
      .post('/hospitalsignup')
      .send({
        HospitalName: 'green Hospitals',
        HospitalPincode: '85282',
        HospitalCity: 'Tempe',
        HospitalState: 'AZ',
        HospitalLatitude: 'none',
        HospitalLongitude: 'none',
        HospitalAdminEmail: 'admin@cgreen.com',
        HospitalInsurance: 'United Health Care, Aetna, CVS Health',
        HospitalAddress: 'none',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toEqual('Hello');
  });
});
