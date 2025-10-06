const mongoose=require("mongoose");
const passportLocalMongoose=require("passport-local-mongoose");
const findOrCreate=require('mongoose-findorcreate');
const FreelancerSchema = new mongoose.Schema({
    username:String,
    email:String,
    password:String,
    name:String,
    job:String,
    phoneNumber:String,
    name:String,
    address:String,
    competences: Array,
    intersts:Array,
    parcours:String,
    jobdescription:String,
    languages:Array,
    formations:Array,
    formationsinp:Array,
    reviews:[
        {   
            auteur:String,
            note:Number,
            commentaire:String}
    ]

   });
   FreelancerSchema.plugin(passportLocalMongoose);
   FreelancerSchema.plugin(findOrCreate);
   const Freelancer = mongoose.model("Freelancer", FreelancerSchema);
module.exports= Freelancer;