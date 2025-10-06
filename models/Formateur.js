const mongoose=require("mongoose");
const passportLocalMongoose=require("passport-local-mongoose");
const findOrCreate=require('mongoose-findorcreate');
const FormateurSchema = new mongoose.Schema({
  username:String,
  email:String,
  password:String,
  phoneNumber:String,
  name:String,
  address:String,
  competances:Array,
  languages: Array,
  interets:Array,
  formations:Array,
  reviews:[
      {   
          auteur:String,
          note:Number,
          commentaire:String}
  ]


   });
   FormateurSchema.plugin(passportLocalMongoose);
   FormateurSchema.plugin(findOrCreate);
   const Formateur = mongoose.model("Formateur", FormateurSchema);
 module.exports= Formateur;