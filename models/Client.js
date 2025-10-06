const mongoose=require("mongoose");
const passportLocalMongoose=require("passport-local-mongoose");
const findOrCreate=require('mongoose-findorcreate');
const ClientSchema = new mongoose.Schema({
    username:String,
    email:String,
    password:String,
    phoneNumber:String,
    name:String,
    address:String,
    formations:Array,
    languages: Array,
    intersts:Array,
    formationsinp:Array,
   

   });
   ClientSchema.plugin(passportLocalMongoose);
   ClientSchema.plugin(findOrCreate);
   const Client = mongoose.model("Client", ClientSchema);
module.exports= Client;