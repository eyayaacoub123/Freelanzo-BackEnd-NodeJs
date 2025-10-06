const mongoose=require("mongoose");
const ProjetSchema = new mongoose.Schema({
    idclient:String,
    titre:String,
    contenu:String,
    auteur:String,
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
    },
    domain:String,
    Budget: String, 
    Skills: Array,
    Deadline: {
        type: Date,
        get: function() {
            // Récupérer la date de la deadline
            const date = this.get('Deadline');

            // Formater la date en 'jour/mois/année'
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();

            // Retourner la date formatée
            return `${day}/${month}/${year}`;
        }

    },    commentaire:[{"nom":String,"contenu":String}],
   
   });
   const Projet = mongoose.model("Projet", ProjetSchema);
module.exports= Projet;