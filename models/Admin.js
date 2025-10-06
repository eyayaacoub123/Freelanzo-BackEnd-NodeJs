const mongoose=require("mongoose");
const passportLocalMongoose=require("passport-local-mongoose");
const findOrCreate=require('mongoose-findorcreate');//find a doc or create it if it doesn't exist.
const AdminSchema = new mongoose.Schema({
    username:String,
    email:String,
    password:String,

   });
   AdminSchema.plugin(passportLocalMongoose);
   AdminSchema.plugin(findOrCreate);
   const Admin = mongoose.model("Admin", AdminSchema); // we use the schema to create a mongoose model.
module.exports= Admin;