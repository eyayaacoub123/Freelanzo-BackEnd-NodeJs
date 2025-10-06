const mongoose=require("mongoose");
const PosteSchema = new mongoose.Schema({
    idfreelancer: String,
    activity:String,
    description: String,
    domain:String,
    auteur: String,
    files:Array,
    dateCreation: {
        type: Date,
        default: Date.now,
        get: function() {
            // Récupérer la date de création
            const date = this.get('dateCreation');

            // Formater la date en 'jour/mois/année'
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();

            // Retourner la date formatée
            return `${day}/${month}/${year}`;
        }
    },    image: String,
    commentaire: [
        {
            nom: String,
            contenu: String
        }
    ],
  

});

   const Poste = mongoose.model("PosteFreelancer", PosteSchema);
module.exports= Poste;