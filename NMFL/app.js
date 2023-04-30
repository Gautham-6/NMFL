var express = require('express');
const Insurance = require("./mongodb/insurance");
const People = require("./mongodb/people");
const Hospital = require("./mongodb/hospitaldata");
const HospitalAdmin = require("./mongodb/userdata");
const HospitalFeatures=require("./mongodb/hospitalfeatures");
const AdminDetails = require("./mongodb/admindata");
const DoctorDetails=require("./mongodb/doctordata");
var bodyParser = require('body-parser');
const fetch = require('node-fetch');
var session = require("express-session");
var Email = require('./public/scripts/EmailSender.js');
var flash = require("connect-flash");
var cookieParser = require("cookie-parser");
const NodeGeocoder = require('node-geocoder');
const {net,max} = require('./treatment');
const brain = require('brain.js');
const data = require('./data.json');
const md5 = require("md5");
require('dotenv').config()


const saltRounds = 10;

var app = express();

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.set('view engine','ejs')
app.use(express.static("public"));
app.use(flash());
app.use(session(
    {
        secret: process.env.SESSION_SECRET,
        cookie:{maxAge:10800000},
        resave: false,
        saveUninitialized: false
    }));

app.use((req,res,next)=>{
  res.locals.message = req.session.message;
  delete req.session.message
  next();
})

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});


app.get('/',function (req, res) {
res.render("main",{state:"off"});

});

app.get('/homepage', function (req, res) {

res.render("homepage",{state:"off",googleapikey:process.env.GOOGLE_GEOCODE_API, openmapkey: process.env.OPENWMAP,gmaplink:"https://maps.googleapis.com/maps/api/js?key="+process.env.GOOGLE_GEOCODE_API+"&callback=initMap&libraries=places&v=weekly"});

});

app.get('/adminsignup', function (req, res) {

  res.render("adminsignup",{state:"off"});

  });

  app.post('/adminsignup', async function(req, res){

try {
  var adminemail = req.body.email;
  var adminpassword = md5(req.body.psw);
  var data = new AdminDetails({
    Email:adminemail,
    Password:adminpassword
  });
  const findAdmindetail=await AdminDetails.find({
    Email:adminemail
  });
  if(findAdmindetail.length>0){
    console.log("duplicate");
    const errorMessage = "The User data already exists";
    res.redirect(`/adminsignup?error=${errorMessage}`);
  }
  else {
  await data.save(async function(err,doc){
    if (err) return console.error(err);
    console.log("saved to hospital admin to collection.");
    res.redirect("adminlogin");
  });
}
} catch (e) {
  console.log("[ERROR] - "+e);
  res.render("error",{errormessage:"There is an error while tring to signup. Kindly try again later.",pageredirect:"/adminsignup"})
}
      })

  app.get('/adminlogin', function (req, res) {

    res.render("adminlogin",{state:"off"});

    });

    app.post("/adminlogin",async function(req,res){
      try{
      var aemail = req.body.adminemail;
      var apassword = md5(req.body.adminpassword);
      AdminDetails.findOne({Email: aemail}, async function(err,found){
        if(err){
            console.log(err);
        }
        else{
            if(found){
                if(found.Password === apassword){
                    req.session.globaladminemail=aemail;
                    res.redirect("/admindashboard");
                }

                else{
                    res.render("adminlogin",{message:"Password is incorrect"});
                }

          }
            else{
                res.render("adminlogin",{message:"The mail id is not regiestered"});
            }
        }
    })
}catch(e){
  console.log("[ERROR] - "+e);
  res.render("error",{errormessage:"There is an error while tring to login. Kindly try again later.",pageredirect:"/adminlogin"})

}

    })

  app.get('/managehospitals', async (req, res) => {
    try{
      if(req.session.globaladminemail){
        const users = await HospitalAdmin.find();
        res.render('managehospitals', { users });

      }else{
        res.redirect("adminlogin")
      }
    }catch(e){
      console.log("[ERROR] - "+e);
      res.render("error",{errormessage:"There is an error accessing global admin page. Kindly try again later.",pageredirect:"/adminlogin"})

    }
    });
    // Route for approving or rejecting user registration requests
app.post('/admin/status', async (req, res) => {
try{
  const { userId, action } = req.body;
  if(action == 'Approve'){
  await HospitalAdmin.findByIdAndUpdate(userId, { approved: true });
  }
  else if(action == 'Reject'){
    await HospitalAdmin.findByIdAndUpdate(userId, { approved: false });
  }
  else if(action == 'Delete'){
    await HospitalAdmin.deleteOne({_id:userId});
  }
  res.redirect('/managehospitals');
}catch(e){
  console.log("[ERROR] - "+e);
  res.render("error",{errormessage:"There is an error accessing global admin page. Kindly try again later.",pageredirect:"/adminlogin"})
}
});

app.get('/admindashboard',async(req,res)=>{
try{
  if(req.session.globaladminemail){
    const hospitals = await Hospital.find();
    const hospitalinsurance = await Insurance.find();
    const services = await HospitalFeatures.find();
    res.render('admindashboard',{hospitals,hospitalinsurance,services});
  }else{
    res.redirect("adminlogin")
  }
}catch(e){
  console.log("[ERROR] - "+e);
  res.render("error",{errormessage:"There is an error accessing global admin page. Kindly try again later.",pageredirect:"/adminlogin"})

}
})

app.get('/adminlogout',async(req,res)=>{
  req.session.destroy();
  res.redirect("adminlogin")
}
)


  app.post("/searchhospitals", async function(req,res){
    try{
      var enteredcity = req.body.cityvalue.trim();
      var access_lat = req.body.access_lat_value;
      var access_long = req.body.access_long_value;
      var state;
      var cityvalue;
      var searchcity;
      
      //know the status of slider

      if(enteredcity.split(",").length <= 2){
        
        res.render("homepage",{state:"off",citywarning:"Please select a valid city / zip code - Not a state.",googleapikey:process.env.GOOGLE_GEOCODE_API, openmapkey: process.env.OPENWMAP,gmaplink:"https://maps.googleapis.com/maps/api/js?key="+process.env.GOOGLE_GEOCODE_API+"&callback=initMap&libraries=places&v=weekly"});
      }else{

      if (req.body.slider){
        state = req.body.slider
      }else{
        state="off"
      }
      // fetch hospital data
      if (req.body.slider){
        access_lat = req.body.access_lat_value;
        access_long = req.body.access_long_value;
        cityvalue=enteredcity.split(",")[0].trim()
        // write code for lat long if disable read only has to be removed
        searchcity = enteredcity;
       
        
      }else{
        cityvalue=enteredcity.split(",")[0].trim()
        searchcity = enteredcity.split(",")[0].trim()+", "+enteredcity.split(",")[1].trim()+", "+enteredcity.split(",")[2].trim()
        const response = await fetch('http://api.openweathermap.org/geo/1.0/direct?q='+cityvalue+'&appid='+process.env.OPENWMAP, {method: 'GET'});
        const data = await response.json();
        access_lat= data[0].lat;
        access_long = data[0].lon;
      }

      // lat long to send to ejs pager
      var latlng={
        lat:access_lat,
        lng:access_long
      }


        //fetch nearby hosiptals
        const bearer = "Bearer "+process.env.YELP_API
        
        var apiRequest = 'https://api.yelp.com/v3/businesses/search?location='+cityvalue+'&categories=hospitals'
      // applying rating filter
        if(req.body.speciality){
          apiRequest = apiRequest+"&categories="+req.body.speciality
        }
      if(req.body.sortvalue){
        apiRequest = apiRequest+"&sort_by="+req.body.sortvalue
      }
      if(req.body.pharmacy=="include"){
              apiRequest = apiRequest+"&categories=pharmacy"
      }
        var response_hospital = await fetch(apiRequest,
                                  {method: 'GET',
                                  headers: {
                                    'Authorization': bearer,
                                    'Content-Type': 'application/json'
                                  }
                                  }
                                );
        const dataHospital = await response_hospital.json();
        
        var storeddata = await Hospital.find({HospitalCity: cityvalue});
        if(storeddata){
          

          for(let i = 0; i < storeddata.length; i++) {
            var jsonlive =   {
            'id': '',
            'alias': '',
            'name': '',
            'image_url': '',
            'is_closed': false,
            'url': '',
            'review_count': 30,
            'categories': '',
            'rating': 8,
            'coordinates': { 'latitude': 38, 'longitude': -38 },
            'transactions': [],
            'location': {
              'address1': '',
              'address2': '',
              'address3': '',
              'city': '',
              'zip_code': '',
              'country': '',
              'state': '',
              'display_address': ''
            },
            'phone': '',
            'display_phone': '',
            'distance':22.4
          }
            jsonlive.id = storeddata[i]._id.toString()
            jsonlive.alias = storeddata[i].HospitalName
            jsonlive.name = storeddata[i].HospitalName
            jsonlive.image_url = storeddata[i].HospitalImage
            jsonlive.is_closed = false
            jsonlive.url = ""
            jsonlive.review_count = 20
            jsonlive.categories = ""
            jsonlive.rating = 3.5
            jsonlive.coordinates.latitude = storeddata[i].HospitalLatitude
            jsonlive.coordinates.longitude = storeddata[i].HospitalLongitude
            jsonlive.location.address1 = storeddata[i].HospitalAddress
            jsonlive.location.city = storeddata[i].HospitalCity
            jsonlive.location.state = storeddata[i].HospitalState
            jsonlive.location.zip_code = storeddata[i].HospitalPincode
            jsonlive.phone = "123456789"
            jsonlive.display_phone = "(123) 456-789"
            jsonlive.tag = "Sponsored"


            dataHospital.businesses.push(jsonlive)
        }
        }
        console.log(dataHospital.businesses);

      res.render("homepage",{cityname:searchcity.trim(), latlng:latlng ,data:dataHospital.businesses,googleapikey:process.env.GOOGLE_GEOCODE_API, openmapkey: process.env.OPENWMAP,gmaplink:"https://maps.googleapis.com/maps/api/js?key="+process.env.GOOGLE_GEOCODE_API+"&callback=initMap&libraries=places&v=weekly"});

      }
    }catch(e){
      console.log("[ERROR] - "+e);
      res.render("error",{errormessage:"There is an error trying to fetch hospital information at this point. Kindly try again later.",pageredirect:"/homepage"})

    }

    });



app.get('/support', function (req, res) {

  res.render("support");

  });

  app.post('/livesupport', async function (req, res) {

try{
  var sname=req.body.supportname;
  var semail = req.body.supportemail;
  var sphone = req.body.supportphone;
  var smessage = req.body.supportmessage;

    var htmlBody = "<div><h2><font color='red'>NMFL</font></h2></div><br><p>The following user requires live support help : </p><p>Name:"+sname+" </p><p>Email:"+semail+" </p><p>Phone:"+sphone+" </p><p>Message:"+smessage+" </p><br><p>Respond Immediately</p><p>Regards</p><p>Team NMFL</p>"
    await Email.sendMail(process.env.NMFL_EMAIL,"[IMPORTANT] - User Live Help Required",htmlBody);
    var urldata = req.headers.referer
    var lastSlashIndex = urldata.lastIndexOf("/");
    res.redirect(urldata.substring(lastSlashIndex));
}catch(e){
  console.log("[ERROR] - "+e);
  res.render("error",{errormessage:"There is an error trying to send email. Kindly try again later.",pageredirect:"/homepage"})

}
    });

  app.get('/livesupport', function (req, res) {

    res.render("livesupport");

    });

  app.post("/dashboard", async function(req, res){
try{
  if(req.body.update){
    const options = {
      provider: 'google',

      // Optional depending on the providers
      // fetch: customFetchImplementation,
      apiKey: process.env.GOOGLE_GEOCODE_API, // for Mapquest, OpenCage, Google Premier
      // formatter: null // 'gpx', 'string', ...
    };
    const geocoder = NodeGeocoder(options);

    const addressdata = await geocoder.geocode({
      address: req.body.haddress+" "+req.body.hcity+" "+req.body.hstate,
      country: 'United States',
      zipcode: req.body.hzipcode
    });
    
    await Hospital.findOneAndUpdate(
      {
        _id: req.body.hid
      },
       {HospitalName:req.body.hname,
        HospitalPincode: req.body.hzipcode,
        HospitalCity:req.body.hcity,
        HospitalState:req.body.hstate,
        HospitalAddress: req.body.haddress,
        HospitalAdminEmail: req.body.hmanagedby,
        HospitalLatitude: addressdata[0].latitude,
        HospitalLongitude: addressdata[0].longitude
      });
  }
  res.redirect("/dashboard")
}catch(e){
  console.log("[ERROR] - "+e);
  res.render("error",{errormessage:"There is an error trying to access dashboard page. Kindly try again later.",pageredirect:"/partnerlogin"})

}
  })


  app.get('/dashboard', async function (req, res) {
try{

      if(req.session.partneremail){
           
           const getinsurancedetail=await Insurance.find({
            hospitalid: req.session.hospitalid
          });
    
          const getfeaturedetail=await HospitalFeatures.find({
            hospitalid: req.session.hospitalid
          });
          const getHospitaldetail=await Hospital.find({
            _id: req.session.hospitalid
          });

          const getDoctorDetails=await DoctorDetails.find({
            hospitalid: req.session.hospitalid
          });
    res.render('dashboard',{
      featuredata:getfeaturedetail,
      data:getinsurancedetail,
      hospital_data:getHospitaldetail,
      doctorDetails:getDoctorDetails
    });
      }else{
        res.redirect("partnerlogin");
      }

}catch(e){
  console.log("[ERROR] - "+e);
  res.render("error",{errormessage:"There is an error trying to access dashboard page. Kindly try again later.",pageredirect:"/partnerlogin"})

}

  });

  app.post('/editHospitalDetails', async function(req, res){
      try{
        if(req.session.partneremail){
          let hospitalName=req.body.hname;
          let hospitalZip=req.body.hzipcode;
          let hospitalCity=req.body.hcity;
          let hospitalState=req.body.hstate;
          let hospitalAddress=req.body.haddress;
          let hospitalemail=req.body.hmanagedby;
          let hospitalimage=req.body.hPhotoURL;

          const options = {
            provider: 'google',
            apiKey: process.env.GOOGLE_GEOCODE_API, // for Mapquest, OpenCage, Google Premier

            // Optional depending on the providers
            // fetch: customFetchImplementation,
            apiKey: process.env.GOOGLE_GEOCODE_API, // for Mapquest, OpenCage, Google Premier
            // formatter: null // 'gpx', 'string', ...
          };
          const geocoder = NodeGeocoder(options);

          const addressdata = await geocoder.geocode({
            address: hospitalAddress+" "+hospitalCity+" "+hospitalState,
            country: 'United States',
            zipcode: hospitalZip
          });

          const findHospitaldetail=await Hospital.find({
            HospitalName:hospitalName,
            HospitalAddress:hospitalAddress,
            HospitalPincode:hospitalZip,
            HospitalCity:hospitalCity,
            HospitalState:hospitalState
          });
          if(findHospitaldetail.length>0){
            const errorMessage = "The Hospital data already exists";
            res.redirect(`/dashboard?error=${errorMessage}`);
          }
          else{
          Hospital.updateOne({_id:req.session.hospitalid},
            {
              $set:{
                HospitalName:hospitalName,
                HospitalPincode:hospitalZip,
                HospitalCity:hospitalCity,
                HospitalState:hospitalState,
                HospitalLatitude:addressdata[0].latitude,
                HospitalLongitude:addressdata[0].longitude,
                HospitalAdminEmail:hospitalemail,
                HospitalAddress:hospitalAddress,
                HospitalImage:hospitalimage
              }}).then(doc => {
              if(!doc) return res.status(404).end()
              console.log("saved");
              }
            ).catch(e =>
                console.error(e));
              HospitalAdmin.updateOne({hospitalid:req.session.hospitalid},
                {
                  $set:{
                    HospitalName:hospitalName,
                  }}).then(doc => {
                  if(!doc) return res.status(404).end()
                  console.log("saved");
                  }
                ).catch(e =>
                    console.error(e));

                res.redirect('/dashboard');
          }
        }else{
          res.redirect("partnerlogin")
        }
      }catch(e){
        console.log("[ERROR] - "+e);
        res.render("error",{errormessage:"There is an error trying to access dashboard page. Kindly try again later.",pageredirect:"/partnerlogin"})

      }
        });

  app.post('/hospitalFeature', async function (req, res) {
try{
  if(req.session.partneremail){
   var featureName=req.body.featurename;
 var featureDescription=req.body.featuredescription;

 const hospitalfeature=new HospitalFeatures({
   hospitalid:req.session.hospitalid,
   FeatureName:featureName,
   FeatureDescription:featureDescription,
   FeaturePrice:12
 })
 const findfeaturedetail=await HospitalFeatures.find({
   hospitalid: req.session.hospitalid,
   FeatureName: featureName
 });
 if(findfeaturedetail.length>0){
   const errorMessage = "The feature already exists";
   res.redirect(`/dashboard?error=${errorMessage}`);
 }
 else{
 await hospitalfeature.save(async function (err, doc) {
     if (err) {
       console.error(err);
     } else {
       console.log("saved");
     }

   })
 res.redirect('/dashboard');
 }
  }else{
   res.redirect("partnerlogin")
  }
}catch(e){
  console.log("[ERROR] - "+e);
  res.render("error",{errormessage:"There is an error trying to access dashboard page. Kindly try again later.",pageredirect:"/partnerlogin"})
}
  });

  app.post('/hospitalFeatureEdit', async function(req,res){
try{
  if(req.session.partneremail){
    let featureName=req.body.editfeaturename;
    let featureDescription=req.body.editFeaturedescription;
    let oldFeatureName=req.body.hiddeneditfeaturename;
    let oldFeatureDescription=req.body.hiddeneditfeaturedescription;
    const findfeaturedetail=await HospitalFeatures.find({
      hospitalid: req.session.hospitalid,
      FeatureName: featureName
    });

    if((findfeaturedetail.length==1)&&(findfeaturedetail[0].FeatureDescription!=oldFeatureDescription)){
      const errorMessage = "The feature already exists";
      res.redirect(`/dashboard?error=${errorMessage}`);
    }
    else{
    HospitalFeatures.updateOne({hospitalid:req.session.hospitalid,FeatureName:oldFeatureName,FeatureDescription:oldFeatureDescription},
        {
          $set:{
            FeatureName:featureName,
            FeatureDescription:featureDescription
          }}).then(doc => {
          if(!doc) return res.status(404).end()
          console.log("saved");
  }
  ).catch(e =>
      console.error(e));
    res.redirect('/dashboard');
  }
  }else{
    res.redirect("partnerlogin")
  }
}catch(e){
  console.log("[ERROR] - "+e);
  res.render("error",{errormessage:"There is an error trying to access dashboard page. Kindly try again later.",pageredirect:"/partnerlogin"})

}
  });

  app.post('/hospitalfeaturedelete', async function(req,res){
    try{
      if(req.session.partneremail){
      let featureName=req.body.hiddeneditfeaturename;
      let featureDescription=req.body.hiddeneditfeaturedescription;

      HospitalFeatures.deleteOne({hospitalid:req.session.hospitalid,FeatureName:featureName,FeatureDescription:featureDescription}
        ).then(doc => {
          if(!doc) return res.status(404).end()
        }
        ).catch(e =>
            console.error(e));
          res.redirect('/dashboard');
        }else{
          res.redirect("partnerlogin")
         }
    }catch(e){
      console.log("[ERROR] - "+e);
      res.render("error",{errormessage:"There is an error trying to access dashboard page. Kindly try again later.",pageredirect:"/partnerlogin"})

    }
  });

  app.post('/hospitalinsurance', async function(req,res){
    try{
      if(req.session.partneremail){
        let insuraNcename=req.body.insurancename;
        let insuranceDescription=req.body.insurancedescription;
        const hospitalinsurance=new Insurance({
          hospitalid:req.session.hospitalid,
          InsuranceName:insuraNcename,
          InsuranceDescription:insuranceDescription
        })

        const findinsurancedetail=await Insurance.find({
          hospitalid: req.session.hospitalid,
          InsuranceName: insuraNcename
        });
        if(findinsurancedetail.length>0){
          const errorMessage = "The Insurance already exists";
          res.redirect(`/dashboard?error=${errorMessage}`);
        }
        else{
        await hospitalinsurance.save(async function (err, doc) {
            if (err) {
              console.error(err);
            } else {
              console.log("saved");
            }

          })
        res.redirect('/dashboard');
        }
      }else{
        res.redirect("partnerlogin")
      }
    }catch(e){
      console.log("[ERROR] - "+e);
      res.render("error",{errormessage:"There is an error trying to access dashboard page. Kindly try again later.",pageredirect:"/partnerlogin"})

    }
  });

  app.post('/hospitalinsuranceEdit', async function(req,res){
try{
  if(req.session.partneremail){
    let insuraNcename=req.body.editinsurancename;
    let insuranceDescription=req.body.editinsurancedescription;
    let oldinsuraNcename=req.body.hiddeneditinsurancename;
    let oldinsuranceDescription=req.body.hiddeneditinsurancedescription;
    const findinsurancedetail=await Insurance.find({
      hospitalid: req.session.hospitalid,
      InsuranceName: insuraNcename
    });
    if((findinsurancedetail.length==1)&&(findinsurancedetail[0].InsuranceDescription!=oldinsuranceDescription)){
      const errorMessage = "The Insurance already exists";
      res.redirect(`/dashboard?error=${errorMessage}`);
    }
    else{
     Insurance.updateOne({hospitalid:req.session.hospitalid,InsuranceName:oldinsuraNcename,InsuranceDescription:oldinsuranceDescription},
        {
          $set:{
            InsuranceName:insuraNcename,
            InsuranceDescription:insuranceDescription
          }}).then(doc => {
          if(!doc) return res.status(404).end()
          console.log("saved");
  }
  ).catch(e =>
      console.error(e));
    res.redirect('/dashboard');
  }
  }else{
    res.redirect("partnerlogin")
  }
}catch(e){
  console.log("[ERROR] - "+e);
  res.render("error",{errormessage:"There is an error trying to access dashboard page. Kindly try again later.",pageredirect:"/partnerlogin"})

}
  });

  app.post('/hospitalinsurancedelete',async function(req,res){
try{
  if(req.session.partneremail){
   let insuraNcename=req.body.hiddeneditinsurancename;
   let insuranceDescription=req.body.hiddeneditinsurancedescription;


   Insurance.deleteOne({hospitalid:req.session.hospitalid,InsuranceName:insuraNcename,InsuranceDescription:insuranceDescription}
     ).then(doc => {
       if(!doc) return res.status(404).end()
 }
 ).catch(e =>
   console.error(e));
 res.redirect('/dashboard');
  }else{
   res.redirect("partnerlogin")
  }

}catch(e){
  console.log("[ERROR] - "+e);
  res.render("error",{errormessage:"There is an error trying to access dashboard page. Kindly try again later.",pageredirect:"/partnerlogin"})

}

  });

  app.post('/doctorInfoAdd',async function(req,res){
try{
  if(req.session.partneremail){
    let doctorName=req.body.doctorName;
    let DoctorSpecialization=req.body.Specialization;
    let doctorEmail=req.body.doctorEmailaddress;
    let doctorphone=req.body.doctorphoneNumber;
    let doctorPictureURL=req.body.doctorImageURL;

    const doctorDetails= new DoctorDetails({
      DoctorName:doctorName,
      DoctorSpecialization:DoctorSpecialization,
      DoctorPhonenumber:doctorphone,
      DoctorEmail:doctorEmail,
      DoctorImage:doctorPictureURL,
      hospitalid:req.session.hospitalid
    })

    const findDoctorDetails=await DoctorDetails.find({
      hospitalid: req.session.hospitalid,
      DoctorName:doctorName,
      DoctorEmail:doctorEmail
    });
    if(findDoctorDetails.length>0){
      const errorMessage = "The Doctor already exists";
      res.redirect(`/dashboard?error=${errorMessage}`);
    }
    else{
    await doctorDetails.save(async function (err, doc) {
      if (err) {
        console.error(err);
      } else {
        console.log("saved");
      }

    })
  res.redirect('/dashboard');
    }
  }else{
    res.redirect("partnerlogin")
  }
}catch(e){
  console.log("[ERROR] - "+e);
  res.render("error",{errormessage:"There is an error trying to access dashboard page. Kindly try again later.",pageredirect:"/partnerlogin"})

}
  });

  app.post('/hospitalDoctorEdit',async function(req,res){
    try{
      if(req.session.partneremail){
       let doctorName=req.body.editdoctorname;
    let doctorSpecialization=req.body.editdoctorSpecialization;
    let doctorEmail=req.body.editdoctorEmail;
    let doctorphone=req.body.editdoctorPhone;
    let doctorpictureURL=req.body.editdoctorPhotoURL;
    let olddoctorName=req.body.hiddeneditdoctorname;
    let olddoctorDescription=req.body.hiddeneditdoctorSpecialization;
    let olddoctorEmail=req.body.hiddeneditdoctorEmail;
    let olddoctorphone=req.body.hiddeneditdoctorPhone;
    let olddoctorpictureURL=req.body.hiddeneditdoctorPhotoURL;

     const findDoctorDetails=await DoctorDetails.find({
       hospitalid: req.session.hospitalid,
       DoctorName:doctorName,
       DoctorEmail:doctorEmail
     });
     if((findDoctorDetails.length>0)&&((findDoctorDetails[0].DoctorSpecialization!=olddoctorDescription)||(findDoctorDetails[0].DoctorPhonenumber!=olddoctorphone)||(findDoctorDetails[0].DoctorImage!=olddoctorpictureURL))){
       const errorMessage = "The Doctor already exists";
       res.redirect(`/dashboard?error=${errorMessage}`);
     }
     else{
     DoctorDetails.updateOne({hospitalid:req.session.hospitalid,DoctorName:olddoctorName,DoctorSpecialization:olddoctorDescription,DoctorEmail:olddoctorEmail,DoctorPhonenumber:olddoctorphone,DoctorImage:olddoctorpictureURL},
         {
           $set:{
             DoctorName:doctorName,
             DoctorSpecialization:doctorSpecialization,
             DoctorEmail:doctorEmail,
             DoctorPhonenumber:doctorphone,
             DoctorImage:doctorpictureURL
           }}).then(doc => {
           if(!doc) return res.status(404).end()
           console.log("saved");
   }
   ).catch(e =>
       console.error(e));
     res.redirect('/dashboard');
     }
   }
     else{
       res.redirect("partnerlogin")
     }
    }catch(e){
      console.log("[ERROR] - "+e);
      res.render("error",{errormessage:"There is an error trying to access dashboard page. Kindly try again later.",pageredirect:"/partnerlogin"})

    }
 });

  app.post('/hospitaldoctordelete',async function(req,res){
try{
  if(req.session.partneremail){
    let doctorName=req.body.hiddendeletedoctorname;
    let doctorEmail=req.body.hiddendeletedoctoremail;


    DoctorDetails.deleteOne({hospitalid:req.session.hospitalid,DoctorName:doctorName,DoctorEmail:doctorEmail}
      ).then(doc => {
        if(!doc) return res.status(404).end()
}
).catch(e =>
    console.error(e));
  res.redirect('/dashboard');
  }else{
    res.redirect("partnerlogin")
  }

}catch(e){
  console.log("[ERROR] - "+e);
  res.render("error",{errormessage:"There is an error trying to access dashboard page. Kindly try again later.",pageredirect:"/partnerlogin"})

}
  });

  app.get('/hospitalDashboardLogout',async function(req,res){
        req.session.destroy();
        res.redirect("partnerlogin")
  });

  app.post('/hospitalsignup', async function(req, res){

    try{
      var hospitalName = req.body.hospitalname;
      var pincode = req.body.ZipCode;
      var city = req.body.CityName;
      var state = req.body.State;
      var latitudes = "none"
      var longitudes = "none"
      var hospitalAdminEmail = req.body.hospitalemail;
      var hospitalAddress = req.body.hospitaladdress;
      var adminPassword = req.body.password;
      var hospitalImage="https://thumbs.dreamstime.com/b/hospital-building-modern-parking-lot-59693686.jpg";

      var hospitalInsurance = "United Health Care, Aetna, CVS Health"
      var databaseAdminPassword = adminPassword;

      //geo geocoder
      const options = {
        provider: 'google',
        apiKey: process.env.GOOGLE_GEOCODE_API, // for Mapquest, OpenCage, Google Premier

        // Optional depending on the providers
        // fetch: customFetchImplementation,
        apiKey: process.env.GOOGLE_GEOCODE_API, // for Mapquest, OpenCage, Google Premier
        // formatter: null // 'gpx', 'string', ...
      };
      const geocoder = NodeGeocoder(options);

      const addressdata = await geocoder.geocode({
        address: hospitalAddress+" "+city+" "+state,
        country: 'United States',
        zipcode: pincode
      });
      //geo coder end
      
      var latitudes = addressdata[0].latitude
      var longitudes = addressdata[0].longitude

          var hospitalData = new Hospital({
            HospitalName: hospitalName,
            HospitalPincode: pincode,
            HospitalCity: city,
            HospitalState: state,
            HospitalLatitude: latitudes,
            HospitalLongitude: longitudes,
            HospitalAdminEmail: hospitalAdminEmail,
            HospitalInsurance: hospitalInsurance,
            HospitalAddress: hospitalAddress,
            HospitalImage:hospitalImage

          })
          const findHospitaldetail=await Hospital.find({
            HospitalName:hospitalName,
            HospitalAddress:hospitalAddress,
            HospitalPincode:pincode,
            HospitalCity:city,
            HospitalState:state
          });

          await hospitalData.save( async function(err, doc){
            if(err){
            console.log("Error in storing hospital information");
            // res render - signup with error
            }else{

              var hospitaladmin = new HospitalAdmin({
                HospitalName: hospitalName,
                emailid:hospitalAdminEmail,
                password:databaseAdminPassword,
                hospitalid: doc._id,
                hospitalOTP:"",
                otptime: "",
              });

              await hospitaladmin.save(function (err, us) {
                if (err) return console.error(err);
                console.log("saved to hospital admin to collection.");
                res.render("login");
              });

            }
            console.log(doc);
          })

    }catch(e){
      console.log("[ERROR] - "+e);
      res.render("error",{errormessage:"There is an error trying to register your hospital. Kindly try again later.",pageredirect:"/signup"})

    }

      })

  app.get('/partnerlogin', function (req, res) {

    res.render("login");

    });
    app.post('/peoplerequest', function (req, res) {
try{
  console.log(req.body.nslettername);
  if(req.body.nslettername){
    var peopledata = new People({
      personemail:req.body.nslettername
    });
    peopledata.save();
  }
  res.render("success");
}catch(e){
  console.log("[ERROR] - "+e);
  res.render("error",{errormessage:"There is an error trying to register your hospital. Kindly try again later.",pageredirect:"/homepage"})

}

      });
    app.get('/forgotpassword', function (req, res) {

    res.render("forgotpassword",{emailverified:"off",initialframe:"450px"});

    });


    app.post('/forgotpassword', async function (req, res) {
      try{
        var email = req.body.forgotemail;
        var otp = req.body.otp;
        var password = req.body.password;
        var cnfpassword = req.body.cnfpassword;
        var email1 = await HospitalAdmin.findOne({emailid: email});
 
      if(email1 && password && cnfpassword){
        if(password==cnfpassword){
          await HospitalAdmin.findOneAndUpdate({_id: email1._id}, {password:password, hospitalOTP: ""});
          res.render("forgotpassword",{emailvalue:email,emailverified:"off",initialframe:"350px",success:" Passwords changed. Kindly Login",processfinished:"completed"});
        }else{
          res.render("forgotpassword",{emailvalue:email,emailverified:"on",passwordmode:"on",initialframe:"770px",error:" Passwords did not match! Kindly enter your new password"});
        }

      }else if(email1 && otp ){
          // generate pwd and cnf password html firlds
          var fetchOTP = await HospitalAdmin.findOne({emailid: email});
          
          if((otp+"" == fetchOTP.hospitalOTP+"") && (Date.now() - fetchOTP.otptime <= 300000) ){
            res.render("forgotpassword",{emailvalue:email,emailverified:"on",passwordmode:"on",initialframe:"750px",success:" OTP matched! Kindly enter your new password"});
          }else{
            res.render("forgotpassword",{emailverified:"off",initialframe:"550px",error:"The OPT you've entered seems invalid or might have expired. Kindly try again."});
          }
        }else if(email1){
         
          var randomnumber = Math.floor(100000 + Math.random() * 900000);
          var otpupdate = await HospitalAdmin.findOneAndUpdate({_id: email1._id}, {hospitalOTP:randomnumber, otptime: Date.now()});
          var htmlBody = "<div><h2><font color='red'>NMFL</font></h2></div><br><p>The following is the OTP to reset admin password : "+randomnumber+". Please enter the OTP in less than 5 minutes to reset the password. </p><br><p>Regards</p><p>Team NMFL</p>"
          await Email.sendMail(email,"NMFL secured OTP Verification- Password Reset",htmlBody);
          res.render("forgotpassword",{emailvalue:email,emailverified:"on",passwordmode:"off",initialframe:"720px", success:"You have received an OTP to the below email. Please enter otp under 5 minutes."});
        }else{
            console.log("[UPDATE FAILURE] "+"No Email Found");
            res.render("forgotpassword",{emailverified:"off",initialframe:"550px",error:"The email id you entered does not exist."});
        }

      }catch(e){
        console.log("[ERROR] - "+e);
        res.render("error",{errormessage:"There is an error trying to reset password. Kindly try again later.",pageredirect:"/partnerlogin"})

      }
        });

        const network1 = new brain.recurrent.LSTM();
        const network2 = new brain.recurrent.LSTM();
        const network3 = new brain.recurrent.LSTM();

        const trainData1 = data.map(item=>({
          input:item.disease,
          output:item.treatment_time,
      }));
      const trainData2 = data.map(item=>({
          input:item.disease,
          output:item.time_discharge,
      }));
      const trainData3 = data.map(item=>({
          input:item.disease,
          output:item.Cost_of_treatment,
      }));

    network1.train(trainData1,{
        iterations:5
    })
    network2.train(trainData2,{
        iterations:5
    })
    network3.train(trainData3,{
        iterations:5
    })

    let predictionResult1 = '';
    let predictionResult2 = '';
    let predictionResult3 = '';
    

      app.post("/hospital",async function(req,res){
        
        try{

                  if(req.body.more){
                    res.render("more",{external:req.body.more})

                  }else{

                    if(req.body.hospitaltag){
                      var hospitalservices = await HospitalFeatures.find({hospitalid:req.body.hospitalid});
                      var hospitalinsurance = await Insurance.find({hospitalid:req.body.hospitalid});
                      var doctordetails = await DoctorDetails.find({hospitalid:req.body.hospitalid});
                    }
                    var name = req.body.Hosname;
                    var add = req.body.hosadd;
                    var phone = req.body.hosphone;
                    var image = req.body.hosimage;
                    req.session.hospitalData = {
                      hosname: name,
                      hosadd: add,
                      hosphone: phone,
                      hosimage: image,
                      hosservices: hospitalservices,
                      hospitalinsurance: hospitalinsurance,
                      doctordetails : doctordetails
                    };
                    res.render("hospital", {hosname:name,hosadd:add,hosphone:phone,hosimage:image,hosservices:hospitalservices, hospitalinsurance:hospitalinsurance, doctordetails : doctordetails})


                  }

        }catch(e){
          console.log("[ERROR] - "+e);
          res.render("error",{errormessage:"There is an error trying to access hospital page. Kindly try again later.",pageredirect:"/homepage"})

        }

      })

    app.post('/predict',function(req,res){
      predictionResult1 = network1.run(req.body.message);
      predictionResult2= network2.run(req.body.message);
      predictionResult3 = network3.run(req.body.message);
      res.send({
        predictionResult1: predictionResult1,
        predictionResult2: predictionResult2,
        predictionResult3: predictionResult3
      });
    })


  app.get('/signup', function (req, res) {

    res.render("signup");

    });

app.get('/getHospitals', function (req, res) {

  res.send("<h1>hospital list</h1>");

  });


app.post("/partnerlogin",async function(req,res){
try{
  var uemail = req.body.useremail;
  var upassword = req.body.userpassword;
  HospitalAdmin.findOne({emailid: uemail}, async function(err,found){
    if(err){
        console.log(err);
    }
    else{
        if(found){
          if(!found.approved){
            console.log("Your registration is pending please wait until it gets approved")
            res.render("login",{message:"Your registration is pending please wait until it gets approved"});
          }
          else{
            if(found.password === upassword){
                req.session.partneremail = uemail;
                var sessionhospital = await Hospital.find({HospitalAdminEmail: uemail});
                req.session.hospitalid = sessionhospital[0]._id.toString()
                req.session.hospitaldata = sessionhospital

                res.redirect("/dashboard");
            }

            else{
                res.render("login",{message:"Password is incorrect"});
            }
        }
      }
        else{
            res.render("login",{message:"The mail id is not regiestered"});
        }
    }
})

}catch(e){
  console.log("[ERROR] - "+e);
  res.render("error",{errormessage:"There is an error trying to login. Kindly try again later.",pageredirect:"/partnerlogin"})

}

})
const fluInput = { flu: 1 };
const pneumoniaInput = { pneumonia: 1 };
const cancerInput = { cancer: 1 };
const heartDiseaseInput = { heartDisease: 1 };

const predictTreatmentTime = (input) => {
  const inputArray = Object.values(input).map(val => val / max);
  const output = net.run(inputArray);
  return Math.round(output.treatmentTime * max);
};

console.log(`Time to treat flu: ${predictTreatmentTime(fluInput)} days`);

app.get('*', function(req, res){
  res.render("pagenotfound");
});

app.listen(process.env.PORT || 8080, function () {

console.log('Server is up and running');

});
module.exports = app;
