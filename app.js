//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoos = require("passport-local-mongoose");
const { use } = require("passport");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const finalcreat = require("mongoose-findorcreate");


const app = express();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  secret: "our Little secret ohhhh!",
  resave: false,
  saveUninitialized: false

}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/usreDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId:String,
  secret:String
})
userSchema.plugin(passportLocalMongoos);
userSchema.plugin(finalcreat)
//mongoos encryption packge
// const encrypt = require("mongoose-encryption");
// var encKey = process.env.SOME_32BYTE_BASE64_STRING;
// var sigKey = process.env.SOME_64BYTE_BASE64_STRING;
// userSchema.plugin(encrypt,{secret:process.env.SECRET , encryptedFields:["password"]});


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL:"https://WWW.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

app.use(express.static("public"));

app.get("/", function (req, res) {
  res.render("home");
})
//by using google oath user can log in with his Google account 
// it use to redirec user to google's oath page and authenticat user and return the profile of user
app.get('/auth/google',
  passport.authenticate("google", { scope: ["profile"] }));
//hear google check that user is legit or not and redirect to the secret route
  app.get("/auth/google/secrets",
  passport.authenticate("google",{failureRedirect:"/login"}),
  function(req,res){
res.redirect("/secrets")
  })

app.get("/login", function (req, res) {
  res.render("login");
})
app.get("/register", function (req, res) {
  res.render("register");
})
app.get("/secrets", function (req, res) {
 User.find({"secret":{$ne:null}},function(err,founduser){
   if(err){
     console.log("errrr");
   }else{
     res.render("secrets",{userhavesecret:founduser});
   }
 })
})
app.post("/register", function (req, res) {
  User.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log("erro");
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets")
      })
    }
  })

})

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function (err) {
    if (err) {
      console.log("errrror");

    }
    else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      })
    }
  })

})
app.get("/submit",function(req,res){
  if (req.isAuthenticated) {
    res.render("submit");
  }
  else {
    res.redirect("/login")
  }
})
app.post("/submit",function(req,res){
const secretSubmittedUsre = req.body.secret;

//passpot save  current loged in user session detail like id etc. so we can fatch that detal. that s why we use this req.user
User.findById(req.user.id,function(err,foundUser){
  if(err){
    console.log("err");
  }else{
    if(foundUser){
 foundUser.secret = secretSubmittedUsre;
    foundUser.save(function(){
      res.redirect("/secrets")
    });
  }
}
  
})
})
app.get("/logout",(req,res)=>{
  req.logout();
  res.redirect("/");
})
app.listen(3000, function () {
  console.log("Server started on port 3000");
});

// email=j@k.com
// password=rushi