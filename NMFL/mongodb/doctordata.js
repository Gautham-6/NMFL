const mongoose = require('mongoose');
require('dotenv').config()
mongoose.connect(process.env.MONGOOSE_CONNECTION);
const DoctorSchema  = new mongoose.Schema({
  DoctorName: String,
  DoctorSpecialization: String,
  DoctorPhonenumber: String,
  DoctorEmail: String,
  hospitalid : String,
  DoctorImage: String
  });

  //creating a model of the with the database collection name
  const Doctor = mongoose.model('doctordetails',DoctorSchema);

  const connection = mongoose.connection;


module.exports= Doctor;
