const mongoose=require("mongoose");

const PosteClientSchema = new mongoose.Schema({
    idclient: String,
    auteur:String,
    domainTraining:String,
    descriptionTraining: { type: String, required: false }, // Rendre facultatif
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
    },    commentaire: [
        {
            nom: String,
            contenu: String
        }
    ],
});

const PosteClient = mongoose.model('PosteClient', PosteClientSchema);

module.exports = PosteClient;