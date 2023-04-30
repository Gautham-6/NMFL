const request = require('supertest');
const app = require('./app');

jest.mock('./models/DoctorDetails');

const DoctorDetails = require('./models/DoctorDetails');

describe('POST /doctorInfoAdd', () => {
  beforeEach(() => {
    DoctorDetails.mockClear();
  });

  it('should save doctor details and redirect to dashboard', async () => {
    const mockSave = jest.fn().mockResolvedValue({});
    DoctorDetails.mockImplementation(() => {
      return {
        save: mockSave,
      };
    });

    const res = await request(app)
      .post('/doctorInfoAdd')
      .send({
        doctorName: 'John Doe',
        Specialization: 'Cardiology',
        doctorEmailaddress: 'johndoe@example.com',
        doctorphoneNumber: '1234567890',
      });

    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/dashboard');
  });

  it('should log error when there is an error saving doctor details', async () => {
    const error = new Error('Something went wrong');
    const mockSave = jest.fn().mockRejectedValue(error);
    DoctorDetails.mockImplementation(() => {
      return {
        save: mockSave,
      };
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app)
      .post('/doctorInfoAdd')
      .send({
        doctorName: 'John Doe',
        Specialization: 'Cardiology',
        doctorEmailaddress: 'johndoe@example.com',
        doctorphoneNumber: '1234567890',
      });

    expect(mockSave).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(error);
    expect(res.status).toBe(302);
    expect(res.header.location).toBe('/dashboard');
  });
});
