//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const md5 = require("md5");
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/usreDB");

const userSchema = new mongoose.Schema({
  email:String,
  password:String
})


//mongoos encryption packge
// const encrypt = require("mongoose-encryption");
// var encKey = process.env.SOME_32BYTE_BASE64_STRING;
// var sigKey = process.env.SOME_64BYTE_BASE64_STRING;
// userSchema.plugin(encrypt,{secret:process.env.SECRET , encryptedFields:["password"]});


const User =   new mongoose.model("User",userSchema);



app.use(express.static("public"));

app.get("/",function(req,res){
  res.render("home");
})
app.get("/login",function(req,res){
  res.render("login");
})
app.get("/register",function(req,res){
  res.render("register");
})

app.post("/register",function(req,res){
 const newUser = new User({
   email:req.body.username,
   //md5 hashing techniq
   password:md5(req.body.password)
 });
 newUser.save(function(err){
   if(!err){
     res.render("secrets")
   }else{
     res.render("error")
   }
 })
})

app.post("/login",(req,res)=>{
  const username = req.body.username;
  const password = md5(req.body.password);

  User.findOne({email:username},(err,foundName)=>{
    if(err){
      console.log("errror");
    }else{
      if(foundName.password===password){
res.render("secrets");
      }else{
        res.send("Opps!Wrong Password.")
      }
    }
  })
})
app.listen(3000, function() {
  console.log("Server started on port 3000");
});