const mongoose = require('mongoose');
require('dotenv').config()
mongoose.connect(process.env.MONGOOSE_CONNECTION);
  // creating the insurance name and details of the hospitals
  const InsuranceSchema = new mongoose.Schema({
    hospitalid: String,
    InsuranceName: String,
    InsuranceDescription: String
  });
  const Insurance = mongoose.model('Insurance',InsuranceSchema);

module.exports = Insurance;
