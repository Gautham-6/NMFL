const request = require('supertest');
const app = require('../app'); // assuming the express app is defined in app.js
const HospitalAdmin = require('../mongodb/userdata');
  
  describe('POST /hospital', () => {
    it('should render the hospital.ejs template with form data', async () => {
      const formData = {
        Hosname: 'Test Hospital',
        hosadd: '123 Test Street',
        hosphone: '123-456-7890',
        hosimage: 'test.jpg'
      };
  
      const response = await request(app)
        .post('/hospital')
        .send(formData)
        .expect(200);
  
      expect(response.text).toContain('<title>Hospital Page</title>');
      expect(response.text).toContain(`<h2>Hospital Name: ${formData.Hosname}</h2>`);
      expect(response.text).toContain(`<p>Address: ${formData.hosadd}</p>`);
      expect(response.text).toContain(`<p>Phone: ${formData.hosphone}</p>`);
      expect(response.text).toContain(`<img src="${formData.hosimage}" alt="Hospital Image">`);
    });
  });
  