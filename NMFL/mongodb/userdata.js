const mongoose = require('mongoose');
require('dotenv').config()
mongoose.connect(process.env.MONGOOSE_CONNECTION);
  // creatinga dummy user data to verify the credintials.
  const HospitalAdminSchema = new mongoose.Schema({
    HospitalName: String,
    emailid:{type: String, unique:true},
    password: String,
    hospitalid: String,
    hospitalOTP:String,
    otptime: String,
    approved: Boolean
  }, {timestamps: true});
  const HospitalAdmin = mongoose.model('hospitaladmin',HospitalAdminSchema);

module.exports = HospitalAdmin;
