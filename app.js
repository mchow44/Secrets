//jshint esversion:6
require('dotenv').config(); //require this as early as possible, does not need to be a variable, as it will be running constantly
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

console.log(process.env.API_KEY); //there's no need for this console log, we just use it to show we can access API_KEY variable from .env file

app.use(express.static("public")); //helps access the css and images files
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

//connnect mongodb to userdb
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

/* this basic javascript schema object which is no longer used because we want encryption below
const userSchema = {
  email: String,
  password: String
};
*/

//increasing security
//starting encryption, we have to make it into an official mongoose schema object
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

//secret variable is our encryption key
//mongoose will encrypt when we call User.save (look down at app.post("/register") below)
//and decrypt when we call User.findOne below at app.post("/login") on database
//const secret = "Thisisourlittlesecret."; <--since we're using .env, we will copy and paste this key to the .env file
const secret = process.env.SECRET; //<--use this for .env secure file to hide our secret key
userSchema.plugin(encrypt, {secret:secret, encryptedFields: ["password"]}); //"password" string has to match password variable name in userSchema

const User = new mongoose.model("user", userSchema);

app.get("/", function(req, res) {
  res.render("home");
});

//we get here from home.ejs from the anchor <a> tag that shifts directory to here (href="/login")
app.get("/login", function(req, res) {
  res.render('login');
});

//we get here from home.ejs from the anchor <a> tag that shifts directory to here (href="/register")
app.get("/register", function(req, res) {
  res.render('register');
});

//this request comes from register.ejs page once button is clicked within that <form method="POST"> tag
//inside this post request from register.ejs, we are going to create a brand new user
//listens for "register" button at register.ejs, once clicked, then we enter here
app.post("/register", function(req, res) {
  const newUser = new User ({
    email: req.body.username,
    password: req.body.password
  });

  newUser.save(function(err){
    if (err) {
      console.log(err);
    } else {
      res.render("secrets"); //go to secrets.ejs if registering user to database is successful
    }
  }); //saves to users collection mongodb
});

//this login page is accessed once login button is pressed at login.ejs
//once clicked, we access here
app.post("/login", function(req, res){
  const username = req.body.username; //this req.body.username is the username that the user typed in from login.ejs
  const password = req.body.password; //this req.body.password is the password that the user typed in from login.ejs

  //first parameter is our query search
  //once found, it outputs the user document to second parameter at foundUser
  User.findOne({email: username}, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        if (foundUser.password === password) { //if foundUser's password matches to what is entered at login page
          res.render("secrets"); //then go to secrets page to confirm it's the same user
        }
      }
    }
  }); //end of User.findOne()

}); //end of app.post("/login")

app.listen(3000, function(req, res) {
  console.log("Successfully connected to port 3000.");
})
