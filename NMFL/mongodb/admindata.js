const mongoose = require('mongoose');
require('dotenv').config()
mongoose.connect(process.env.MONGOOSE_CONNECTION);
const AdminSchema = new mongoose.Schema({
  Email: String,
  Password: String,
  });

  //creating a model of the with the database collection name
  const AdminDetails = mongoose.model('admindetails',AdminSchema);

  const connection = mongoose.connection;

connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});
module.exports= AdminDetails;
