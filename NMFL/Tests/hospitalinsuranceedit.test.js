const request = require('supertest');
const app = require('../app');

describe('POST /hospitalinsuranceEdit', () => {
  it('should update insurance information and redirect to dashboard if user is logged in', async () => {

    const mockSession = {
      partneremail: 'test@example.com',
      hospitalid: '12345'
    };

    const requestBody = {
      editinsurancename: 'United Health Insurance',
      editinsurancedescription: 'This insurance covers all plans for students',
      hiddeneditinsurancename: 'ABC',
      hiddeneditinsurancedescription: 'This is test description'
    };

    const response = await request(app)
      .post('/hospitalinsuranceEdit')
      .send(requestBody)
      .set('Cookie', [`session=${JSON.stringify(mockSession)}`]);

    expect(response.status).toBe(302);

    expect(response.headers.location).toBe('/dashboard');

    const updatedInsurance = await Insurance.findOne({
      hospitalid: mockSession.hospitalid,
      InsuranceName: requestBody.editinsurancename,
      InsuranceDescription: requestBody.editinsurancedescription
    });
    expect(updatedInsurance).not.toBeNull();
  });

  it('should redirect to partnerlogin if user is not logged in', async () => {

    const response = await request(app)
      .post('/hospitalinsuranceEdit')
      .send({});

    expect(response.status).toBe(302);

    expect(response.headers.location).toBe('/partnerlogin');
  });
});
