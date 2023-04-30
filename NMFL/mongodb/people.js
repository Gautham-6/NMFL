const mongoose = require('mongoose');
require('dotenv').config()
mongoose.connect(process.env.MONGOOSE_CONNECTION);
  // creating the insurance name and details of the hospitals
  const PeopleSchema = new mongoose.Schema({
    personname : String,
    personemail : String,
    personphone: String,
    personlatitude : String,
    personlongitude : String,
    personmessage : String
  });
  const Person = mongoose.model('Person',PeopleSchema);

module.exports = Person;
