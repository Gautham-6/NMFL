const request = require('supertest');
const app = require('../app');

describe('GET /dashboard', () => {
  it('should return a status code of 200', async () => {
    const res = await request(app).get('/dashboard');
    expect(res.status).toBe(200);
  });
});

describe('POST /hospitalFeature', () => {
  it('should save a new hospital feature', async () => {
    const res = await request(app)
      .post('/hospitalFeature')
      .send({
        featurename: 'Test feature',
        featuredescription: 'This is a test feature',
      });
    expect(res.statusCode).toBe(302); 
  });
});

describe('POST /hospitalinsurance', () => {
  it('should save a new hospital insurance', async () => {
    const res = await request(app)
      .post('/hospitalinsurance')
      .send({
        insurancename: 'Test insurance',
        insurancedescription: 'This is a test insurance',
      });
    expect(res.statusCode).toBe(302); 
  });
});

const request = require('supertest');
const app = require('./app');
const HospitalAdmin = require('../mongodb/userdata');

describe('GET /admindashboard', () => {
  // Define a test case
  it('should fetch user data and render admin dashboard', async () => {
    // Mock the HospitalAdmin.find() function to return a fixed set of data
    const mockUserData = [{ HospitalName: 'John', emailid: 'john@example.com' }];
    jest.spyOn(HospitalAdmin, 'find').mockResolvedValue(mockUserData);

    // Send a GET request to the admin dashboard endpoint
    const response = await request(app).get('/admindashboard');

    // Expect the response to have a status code of 200
    expect(response.status).toBe(200);

    // Expect the response body to contain the rendered adminDashboard view
    expect(response.text).toContain('Admin Dashboard');

    // Expect the response body to contain the user data returned by the mock function
    expect(response.text).toContain('John');
    expect(response.text).toContain('john@example.com');

    // Expect the HospitalAdmin.find() function to have been called once
    expect(HospitalAdmin.find).toHaveBeenCalledTimes(1);

    // Expect the HospitalAdmin.find() function to have been called with no arguments
    expect(HospitalAdmin.find).toHaveBeenCalledWith();
  });
});



describe('POST /editHospitalDetails', function() {
  it('should update hospital details and redirect to dashboard page', function(done) {
    request(app)
      .post('/editHospitalDetails')
      .send({
        hname: 'Test Hospital',
        hzipcode: '85282',
        hcity: 'Tempe',
        hstate: 'AZ',
        haddress: '1817 E Southern Ave',
        hmanagedby: 'test@test.com'
      })
      .expect(302)
      .expect('Location', '/dashboard')
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });
});


const Insurance = require('../mongodb/insurance'); // assuming this is the Insurance model

describe('POST /hospitalinsurancedelete', () => {
  it('should delete insurance from hospital', async () => {
    // create a mock Insurance object to be deleted
    const mockInsurance = new Insurance({
      hospitalid: 123,
      InsuranceName: 'Mock Insurance',
      InsuranceDescription: 'This is a mock insurance object',
    });
    await mockInsurance.save();

    // send a request to delete the mock Insurance object
    const res = await request(app)
      .post('/hospitalinsurancedelete')
      .send({
        hiddeneditinsurancename: 'Mock Insurance',
        hiddeneditinsurancedescription: 'This is a mock insurance object',
      });

    // assert that the response is a redirect to the dashboard
    expect(res.statusCode).toEqual(302);
    expect(res.header.location).toEqual('/dashboard');

    // assert that the mock Insurance object was deleted from the database
    const deletedInsurance = await Insurance.findOne({
      hospitalid: 123,
      InsuranceName: 'Mock Insurance',
      InsuranceDescription: 'This is a mock insurance object',
    });
    expect(deletedInsurance).toBeNull();
  });
});
