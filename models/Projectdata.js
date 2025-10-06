const mongoose=require("mongoose");
const Projectdata = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId, 
    titre:String,
    idclient:String,
    listeCandidates:[{"idfreelancer":String,"nom":String,duration:Number,price:Number,coverletter:{nomclient:String,contenu:String,nom:String}}],
    status:String,
   });

   const project = mongoose.model("postedata", Projectdata);
module.exports= project;
