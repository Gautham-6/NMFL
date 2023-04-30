const request = require('supertest');
const app = require('../app'); 
const DoctorDetails = require('../mongodb/doctordata'); 

describe('POST /hospitaldoctordelete', () => {
  let doctor;

  beforeAll(async () => {
    
    doctor = new DoctorDetails({
      hospitalid: 123,
      DoctorName: 'Test Doctor',
      DoctorEmail: 'test@example.com'
    });
    await doctor.save();
  });

  afterAll(async () => {
    
    await DoctorDetails.deleteOne({
      hospitalid: 123,
      DoctorName: 'Test Doctor',
      DoctorEmail: 'test@example.com'
    });
  });

  it('should delete the specified doctor and redirect to /dashboard', async () => {
    
    const response = await request(app)
      .post('/hospitaldoctordelete')
      .send({
        hiddendeletedoctorname: 'Test Doctor',
        hiddendeletedoctoremail: 'test@example.com'
      });

    
    expect(response.status).toBe(302);
    expect(response.header.location).toBe('/dashboard');

    
    const deletedDoctor = await DoctorDetails.findOne({
      hospitalid: 123,
      DoctorName: 'Test Doctor',
      DoctorEmail: 'test@example.com'
    });
    expect(deletedDoctor).toBeNull();
  });

  it('should return a 404 error if the doctor to delete is not found', async () => {
    
    const response = await request(app)
      .post('/hospitaldoctordelete')
      .send({
        hiddendeletedoctorname: 'Non-existent Doctor',
        hiddendeletedoctoremail: 'doesntexist@example.com'
      });

    
    expect(response.status).toBe(404);
  });
});
