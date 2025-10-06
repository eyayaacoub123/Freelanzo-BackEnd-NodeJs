const mongoose=require("mongoose");

const FreelancerselectedShema = new mongoose.Schema({
    idclient: String,
    idfreelancer:String,
    idProjet:String,

});

const FreelancerS = mongoose.model('freelancerselected', FreelancerselectedShema);

module.exports = FreelancerS;