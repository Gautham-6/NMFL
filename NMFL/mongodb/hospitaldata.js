const mongoose = require('mongoose');
require('dotenv').config()
mongoose.connect(process.env.MONGOOSE_CONNECTION);
const HospitalSchema = new mongoose.Schema({
  HospitalName: String,
  HospitalPincode: String,
  HospitalCity: String,
  HospitalState: String,
  HospitalLatitude: String,
  HospitalLongitude: String,
  HospitalAdminEmail: String,
  HospitalInsurance: String,
  HospitalAddress: String,
  HospitalImage:String
  });

  //creating a model of the with the database collection name
  const Hospital = mongoose.model('hospitaldetails',HospitalSchema);

  const connection = mongoose.connection;

connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});
module.exports= Hospital;
