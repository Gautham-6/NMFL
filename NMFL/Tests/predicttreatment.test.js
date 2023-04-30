const brain = require('brain.js');
const request = require('supertest');
const app = require('../app'); // assuming the code is in a file named app.js

describe('Recurrent LSTM network', () => {
  let network;

  beforeEach(() => {
    network = new brain.recurrent.LSTM();
  });

  test('should train the network', () => {
    const data = [
      { disease: 'flu', treatment_time: 2 },
      { disease: 'cold', treatment_time: 3 },
      { disease: 'fever', treatment_time: 4 }
    ];
    const trainData = data.map(item => ({
      input: item.disease,
      output: item.treatment_time
    }));
    const options = {
      iterations: 5,
      logPeriod: 5,
      learningRate: 0.3,
    };
    expect(() => {
      network.train(trainData, options);
    }).not.toThrow();
  });

  test('should predict treatment time', async () => {
    const data = [
      { disease: 'flu', treatment_time: 2 },
      { disease: 'cold', treatment_time: 3 },
      { disease: 'fever', treatment_time: 4 }
    ];
    const trainData = data.map(item => ({
      input: item.disease,
      output: item.treatment_time
    }));
    network.train(trainData, {
      iterations: 5,
      logPeriod: 5,
      learningRate: 0.3,
    });
    const response = await request(app)
      .post('/predict')
      .send({ message: 'cold' });
    expect(response.status).toBe(200);
    expect(response.body).toBe(3);
  });
});