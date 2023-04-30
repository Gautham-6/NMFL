const mongoose = require('mongoose');
require('dotenv').config()
mongoose.connect(process.env.MONGOOSE_CONNECTION);

  // creating the insurance name and details of the hospitals
  const HospitalFeaturesSchema = new mongoose.Schema({
    hospitalid: String,
    FeatureName: String,
    FeatureDescription: String,
    FeaturePrice: Number
  });
  const HospitalFeatures = mongoose.model('hospitalservices',HospitalFeaturesSchema);

module.exports = HospitalFeatures;
