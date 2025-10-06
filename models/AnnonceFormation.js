const mongoose = require("mongoose");

const AnnonceSchema = new mongoose.Schema({
    idformateur: String,
    contenu: String,
    auteur: String,
    domain: String,
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
    price: Number,
    startdate: {
        type: Date,
        get: function() {
            // Récupérer la date de début
            const date = this.get('startdate');

            // Formater la date en 'jour/mois/année'
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();

            // Retourner la date formatée
            return `${day}/${month}/${year}`;
        }
    }, 
    enddate: {
        type: Date,
        get: function() {
            // Récupérer la date de fin
            const date = this.get('enddate');

            // Formater la date en 'jour/mois/année'
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();

            // Retourner la date formatée
            return `${day}/${month}/${year}`;
        }
    }, 
    address:String,

    commentaire: [{ "nom": String, "contenu": String }],
    modedelivery: String,
    listedesinscrits: [
        {
            _id: String,
        }
    ]
});

const Annonce = mongoose.model("Annonce", AnnonceSchema);
module.exports = Annonce;
