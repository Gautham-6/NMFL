var nodemailer = require("nodemailer");
require('dotenv').config()
function sendMail(to, subject, body ){
  var transporter = nodemailer.createTransport(
  {
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
      user: process.env.NMFL_EMAIL,
      pass: process.env.G_APP_CODE
    }
  }
);
  var mailOptions = {
  from: process.env.NMFL_EMAIL,
  to: to,
  subject: subject,
  html: body
};
transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});

}



module.exports = {
  sendMail
};
