const brain = require('brain.js');

const net = new brain.NeuralNetwork();

const trainingData = [
  { input: { flu: 1 }, output: { treatmentTime: 7 } },
  { input: { pneumonia: 1 }, output: { treatmentTime: 14 } },
  { input: { cancer: 1 }, output: { treatmentTime: 90 } },
  { input: { heartDisease: 1 }, output: { treatmentTime: 30 } },
  { input: { diabetes: 1 }, output: { treatmentTime: 21 } },
  { input: { asthma: 1 }, output: { treatmentTime: 10 } },
  { input: { fever: 1 }, output: { treatmentTime: 5 } },
  { input: { migraine: 1 }, output: { treatmentTime: 3 } },
  { input: { headache: 1 }, output: { treatmentTime: 2 } },
  { input: { stomachAche: 1 }, output: { treatmentTime: 3 } }
];

const max = Math.max(...trainingData.map(d => d.output.treatmentTime));

const normalizedData = trainingData.map(d => ({
  input: Object.values(d.input).map(val => val / max),
  output: { treatmentTime: d.output.treatmentTime / max }
}));

const config = {
  hiddenLayers: [8, 4],
  learningRate: 0.1,
  activation: 'sigmoid'
};

net.train(normalizedData, { iterations: 10000, ...config });

module.exports = {
  net,
  max
};