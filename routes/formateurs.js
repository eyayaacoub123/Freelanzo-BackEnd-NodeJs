const express = require("express");
const passport = require("passport");
const mongoose = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;
const session = require("express-session");
const Formateur = require("../models/Formateur");
const Freelancer = require("../models/Freelancer");
const Client = require("../models/Client");
const Annonce = require("../models/AnnonceFormation");
const PosteFreelancer = require("../models/PosteFreelancer");
const ProjetClient = require("../models/ProjetClient");
const PosteClient = require("../models/PosteClient");
const jwt = require('jsonwebtoken');
const secretKey = 'yourSecretKey'; 
const router = express.Router();
passport.use('formateur-local', new LocalStrategy(Formateur.authenticate()));

router.use(session({
    secret: "our little secret.",
    resave: false,
    saveUninitialized: false
}));

router.use(passport.initialize());
router.use(passport.session());

passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
    if (obj.type === 'formateur') {
        Formateur.findById(obj.id)
            .then(formateur => {
                cb(null, formateur);
            })
            .catch(err => {
                cb(err, null);
            });
    } else {
        // Handle other types of users if needed
    }
});


// Middleware for authenticating Formateur
function authenticateFormateur(req, res, next) {
    passport.authenticate('formateur-local', function(err, formateur, info) {
        if (err) {
            console.error(err);
            return res.status(500).send('Error occurred during login.');
        }
        if (!formateur) {
            return res.status(401).send('Invalid username or password.');
        }
        req.login({ type: 'formateur', id: formateur._id }, function(err) {
            if (err) {
                console.error(err);
                return res.status(500).send('Error occurred during login.');
            }
            // Generate JWT token
            const token = jwt.sign({ type: 'formateur', id: formateur._id }, secretKey, { expiresIn: '1h' });
            // Store token in localStorage or state
            // For example, storing in localStorage
            return res.status(200).json({ token, id: formateur._id, nom:formateur.name});
         
        });
    })(req, res, next);
}

router.post("/signinFormateur", authenticateFormateur, function(req, res) {
    res.status(200).send("Login successful.");
});

router.post("/signupFormateur", (req, res) => {
    const  { password, ...data } = req.body;
    const newFormateur = new Formateur(data);

    Formateur.register(newFormateur, password, function(err, formateur) {
        if (err) {
            console.error(err);
            res.send("Error occurred during signup.");
        } else {
            res.send("Signup successful");
        }
    });
});

router.get("/logoutFormateur", function(req, res) {
    req.logout(function(err) {
        if (err) {
            console.error(err);
            return res.send("Error occurred during logout.");
        }
        res.send("Logout successful!!");
    });
});



 //get delete update formateur 
 router.get("/formateurGetFormateur/:idformateur", (req, res) => {
    Formateur.findOne({ _id: req.params.idformateur })
        .then(foundFormateur => {
            if (foundFormateur) {
                res.send(foundFormateur);
            } else {
                res.status(404).send("Aucun formateur correspondant à cet id n'a été trouvé.");
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Une erreur s'est produite lors de la recherche du formateur.");
        });
});

router.delete("/deleteFormateur/:idformateur",(req,res)=>{
    Formateur.findOneAndDelete(
    { _id: req.params.idformateur }
)
.then(deletedFormateur => {
    if (deletedFormateur) {
        res.send("Formateur supprimé avec succès : ");
    } else {
        res.send("Aucun Formateur trouvé avec cet id.");
    }
})
.catch(err => {
    res.send(err);
});
});

router.patch("/updateFormateur/:idformateur",(req,res)=>{
    Formateur.findOneAndUpdate(
        { _id: req.params.idformateur },
        { $set: req.body },
        { new: true } // Pour renvoyer le document mis à jour
    )
    .then(updatedFormateur => {
        res.send("Formateur mis à jour avec succès . ");
    })
    .catch(err => {
        res.send(err);
    });
});



//Annoucements  

router.post("/createAnnonce/:idformateur", async (req, res) => {
    try {
        const idformateur = req.params.idformateur;
        const donnees = req.body;

        // Créer un nouveau Annonce en incluant l'ID du freelancer
        const newAnnonce = new Annonce({
            idformateur: idformateur,
            contenu:donnees.contenu,
            domain:donnees.domain,
            auteur:donnees.auteur,
            price: donnees.price,
            startdate: donnees.startdate, 
            enddate: donnees.enddate, 
            modedelivery:donnees.modedelivery,
            address:donnees.address,

        });

        await newAnnonce.save();
        console.log("Annonce added successfully:", newAnnonce);
        res.send("Annonce added successfully:");
    } catch (error) {
        console.error("Error while adding Annonce:", error);
        res.status(500).send("An error occurred while adding Annonce");
    }
});

router.get("/getAnnonces/:idformateur", async (req, res) => {
    try {
        const idFormateur = req.params.idformateur; // Use idFormateur with the same casing as in the URL
        const annonces = await Annonce.find({ idformateur: idFormateur }); // Use idFormateur with the same casing as in the MongoDB schema

        if (annonces.length > 0) {
            res.status(200).json(annonces);
        } else {
            res.status(404).send("Aucune annonce trouvée pour cet ID de formateur.");
        }
    } catch (error) {
        console.error("Erreur lors de la lecture des annonces :", error);
        res.status(500).send("Une erreur s'est produite lors de la lecture des annonces");
    }
});
/*
router.get("/annonce/:id", async (req, res) => {
    const idf = req.params.id;
    try {
        // Find all posts except those belonging to the specified user ID
        const touteslespostes = await Annonce.find({ idformateur: { $ne: idf } });
        console.log(touteslespostes);
        if (touteslespostes) {
            res.send(touteslespostes);
        } else {
            res.send("No posts found for the specified user ID.");
        }
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send("Internal Server Error");
    }
});
*/
router.get("/getAnnonce/:idannonce", async (req, res) => {
    try {
        const annonce = await Annonce.findById(req.params.idannonce);
    
        if (annonce) {
            res.status(200).json(annonce);
        } else {
            res.status(404).send("Aucun annonce de formateur trouvé avec cet ID.");
        }
    } catch (error) {
        console.error("Erreur lors de la lecture du annonce:", error);
        res.status(500).send("Une erreur s'est produite lors de la lecture du annonce");
    }
});

router.delete("/deleteAnnonce/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const annonce = await Annonce.findByIdAndDelete(id);
        if (annonce) {
            console.log("annonce deleted successfully:", annonce);
            res.send("annonce deleted with success");
        } else {
            console.log("annonce not found");
            res.status(404).send("annonce not found");
        }
    } catch (error) {
        console.error("Error while deleting annonce:", error);
        res.status(500).send("An error occurred while deleting annonce");
    }
});
router.patch("/updateAnnonce/:idannonce", async (req, res) => {
    try {
        const updatedAnnonce = await Annonce.findByIdAndUpdate(req.params.idannonce, req.body, { new: true });
        if (updatedAnnonce) {
            res.send("annonce updated successfully");
        } else {
            res.status(404).send("Aucun annonce de formateur trouvé avec cet ID.");
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour du annonce:", error);
        res.status(500).send("Une erreur s'est produite lors de la mise à jour du poste");
    }
});
//all the annoucements except his
router.get("/formateurGetAnnonce/:id", async (req, res) => {
    const idfo = req.params.id;

    try {
        const touteslespostesclients = await Annonce.find({ idformateur: { $ne: idfo } });
        if (touteslespostesclients) {
            res.send(touteslespostesclients);
        } else {
            res.send("No posts found for the specified user ID.");
        }
    } catch (error) {
        console.error("Error fetching client posts:", error);
        res.status(500).send("Internal Server Error");
    }
});
//get List of participants
router.get('/clients-and-freelancers/:formationId', async (req, res) => {
    try {
        const formationId = req.params.formationId;

        // Find the formation by its ID
        const formation = await Annonce.findOne({ _id: formationId });

        // Check if the formation exists
        if (!formation) {
            return res.status(404).json({ error: 'Formation not found' });
        }

        // Check if formation.listedesinscrits exists and is an array of object IDs
        if (!Array.isArray(formation.listedesinscrits)) {
            return res.status(400).json({ error: 'Formation list of enrolled participants is not valid' });
        }

        // Initialize an array to store all clients and freelancers
        let allClientsAndFreelancers = [];

        // Iterate through the listdesinscrits of the formation
        for (const participant of formation.listedesinscrits) {
            // Find the document by ID in both Client and Freelancer collections
            const client = await Client.findOne({ _id: participant._id });
            const freelancer = await Freelancer.findOne({ _id: participant._id});

            // Determine the type based on which collection contains the document
            if (client) {
                allClientsAndFreelancers.push(client);
            } else if (freelancer) {
                allClientsAndFreelancers.push(freelancer);
            }
        }

        // Return the array of all clients and freelancers
        res.json({ allClientsAndFreelancers });
    } catch (error) {
        console.error('Error retrieving clients and freelancers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


//comments for the trainigs requests  :
router.post("/formateurAddCommentPosteClient/:idPosteClient", async (req, res) => {
    try {
        const id = req.params.idPosteClient;
        const commentaire = req.body; // Array of comments provided in the request body under the key "commentaire"
        
        let posteCLient = await PosteClient.findById(id);
        if (!posteCLient) {
            console.log("posteCLient not found");
            return res.status(404).send("posteCLient not found");
        }
        
        // Vérifier que commentaires est un tableau et qu'il n'est pas vide
        if (!commentaire) {
            console.log("Invalid or empty comment");
            return res.status(400).send("Invalid or empty comment");
        }

        // Ajouter le commentaire au champ "commentaire" du document
        posteCLient.commentaire.push(commentaire);


        await posteCLient.save();
        console.log("Comments added successfully for poste CLient:", posteCLient);
        res.status(200).send("Comments added successfully");
    } catch (error) {
        console.error("Error while adding comments:", error);
        res.status(500).send("An error occurred while adding comments");
    }
});
router.get("/formateurGetCommentsPosteClient/:idPosteClient", async (req, res) => {
    try {
        const idPosteClient = req.params.idPosteClient;

        // Trouver le poste de freelancer en utilisant son ID
        const posteClient = await PosteClient.findById(idPosteClient);
        if (!posteClient) {
            console.log("posteClient not found");
            return res.status(404).send("posteClient not found");
        }

        // Extraire les commentaires du posteClient de freelancer
        const commentaires = posteClient.commentaire;

        console.log("Commentaires retrieved successfully:", commentaires);
        res.status(200).json(commentaires);
    } catch (error) {
        console.error("Error while retrieving comments:", error);
        res.status(500).send("An error occurred while retrieving comments");
    }
});

router.patch("/formateurUpdateCommentPosteClient/:idPosteClient/:idCommentaire", async (req, res) => {
    try {
        const idPosteClient = req.params.idPosteClient;
        const idCommentaire = req.params.idCommentaire;
        const { nom, contenu } = req.body.commentaire[0]; // Extract nom and contenu from the first element of the commentaire array
    
        // Trouver l'annonce
        let posteClient = await PosteClient.findById(idPosteClient);
        if (!posteClient) {
            console.log("posteClient not found");
            return res.status(404).send("posteClient not found");
        }

        // Trouver l'index du commentaire à mettre à jour dans l'posteClient
        const indexCommentaire = posteClient.commentaire.findIndex(commentaire => commentaire._id.toString() === idCommentaire);
        if (indexCommentaire === -1) {
            console.log("Commentaire not found");
            return res.status(404).send("Commentaire not found");
        }

        // Mettre à jour le commentaire s'il existe
        if (posteClient.commentaire[indexCommentaire]) {
            posteClient.commentaire[indexCommentaire].nom = nom;
            posteClient.commentaire[indexCommentaire].contenu = contenu;
        } else {
            console.log("Commentaire not found");
            return res.status(404).send("Commentaire not found");
        }

        // Sauvegarder les modifications de l'posteClient
        await posteClient.save();
        
        console.log("Commentaire updated successfully:", posteClient.commentaire[indexCommentaire]);
        res.status(200).send("Commentaire updated successfully");
    } catch (error) {
        console.error("Error while updating commentaire:", error);
        res.status(500).send("An error occurred while updating commentaire");
    }
});

router.delete("/formateurDeleteCommentPosteClient/:idPosteClient/:idCommentaire", async (req, res) => {
    try {
        const idPosteClient = req.params.idPosteClient;
        const idCommentaire = req.params.idCommentaire;

        let posteClient = await PosteClient.findById(idPosteClient);
        if (!posteClient) {
            console.log("posteClient not found");
            return res.status(404).send("posteClient not found");
        }

        const indexCommentaire = posteClient.commentaire.findIndex(commentaire => commentaire && commentaire._id.toString() === idCommentaire);
        if (indexCommentaire === -1) {
            console.log("Commentaire not found");
            return res.status(404).send("Commentaire not found");
        }

        posteClient.commentaire.splice(indexCommentaire, 1);

        await posteClient.save();
        
        console.log("Commentaire deleted successfully");
        res.status(200).send("Commentaire deleted successfully");
    } catch (error) {
        console.error("Error while deleting commentaire:", error);
        res.status(500).send("An error occurred while deleting commentaire");
    }
});

//comments  for the annoucements

router.post("/formateurAddCommentAnnonce/:idAnnonce", async (req, res) => {
    try {
        const id = req.params.idAnnonce;
        const commentaire = req.body; // Array of comments provided in the request body under the key "commentaire"
        let annonce = await Annonce.findById(id);
        if (!annonce) {
            console.log("annonce not found");
            return res.status(404).send("annonce not found");
        }
        
        // Vérifier que commentaires est un tableau et qu'il n'est pas vide
        if (!commentaire) {
            console.log("Invalid or empty comment");
            return res.status(400).send("Invalid or empty comment");
        }

        // Ajouter le commentaire au champ "commentaire" du document
        annonce.commentaire.push(commentaire);

        await annonce.save();
        console.log("Comments added successfully for annonce:", annonce);
        res.status(200).send("Comments added successfully");
    } catch (error) {
        console.error("Error while adding comments:", error);
        res.status(500).send("An error occurred while adding comments");
    }
});
router.get("/formateurGetCommentsAnnonce/:idAnnonce", async (req, res) => {
    try {
        const idAnnonce = req.params.idAnnonce;

        // Trouver le poste de formateur
        const annonce = await Annonce.findById(idAnnonce);
        if (!annonce) {
            console.log("annonce not found");
            return res.status(404).send("annonce not found");
        }

        // Extraire les commentaires du annonce de formateur
        const commentaires = annonce.commentaire;

        console.log("Commentaires retrieved successfully:", commentaires);
        res.status(200).json(commentaires);
    } catch (error) {
        console.error("Error while retrieving comments:", error);
        res.status(500).send("An error occurred while retrieving comments");
    }
});
router.patch("/formateurUpdateCommentAnnonce/:idAnnonce/:idCommentaire", async (req, res) => {
    try {
        const idAnnonce = req.params.idAnnonce;
        const idCommentaire = req.params.idCommentaire;
        const { nom, contenu } = req.body.commentaire[0]; // Extract nom and contenu from the first element of the commentaire array
    
        // Trouver l'annonce
        let annonce = await Annonce.findById(idAnnonce);
        if (!annonce) {
            console.log("Annonce not found");
            return res.status(404).send("Annonce not found");
        }

        // Trouver l'index du commentaire à mettre à jour dans l'annonce
        const indexCommentaire = annonce.commentaire.findIndex(commentaire => commentaire._id.toString() === idCommentaire);
        if (indexCommentaire === -1) {
            console.log("Commentaire not found");
            return res.status(404).send("Commentaire not found");
        }

        // Mettre à jour le commentaire s'il existe
        if (annonce.commentaire[indexCommentaire]) {
            annonce.commentaire[indexCommentaire].nom = nom;
            annonce.commentaire[indexCommentaire].contenu = contenu;
        } else {
            console.log("Commentaire not found");
            return res.status(404).send("Commentaire not found");
        }

        // Sauvegarder les modifications de l'annonce
        await annonce.save();
        
        console.log("Commentaire updated successfully:", annonce.commentaire[indexCommentaire]);
        res.status(200).send("Commentaire updated successfully");
    } catch (error) {
        console.error("Error while updating commentaire:", error);
        res.status(500).send("An error occurred while updating commentaire");
    }
});
router.delete("/formateurDeleteCommentAnnonce/:idAnnonce/:idCommentaire", async (req, res) => {
    try {
        const idAnnonce = req.params.idAnnonce;
        const idCommentaire = req.params.idCommentaire;

        let annonce = await Annonce.findById(idAnnonce);
        if (!annonce) {
            console.log("annonce not found");
            return res.status(404).send("annonce not found");
        }

        const indexCommentaire = annonce.commentaire.findIndex(commentaire => commentaire && commentaire._id.toString() === idCommentaire);
        if (indexCommentaire === -1) {
            console.log("Commentaire not found");
            return res.status(404).send("Commentaire not found");
        }

        annonce.commentaire.splice(indexCommentaire, 1);

        await annonce.save();
        
        console.log("Commentaire deleted successfully");
        res.status(200).send("Commentaire deleted successfully");
    } catch (error) {
        console.error("Error while deleting commentaire:", error);
        res.status(500).send("An error occurred while deleting commentaire");
    }
});

//get all reviews (of all users but he can't evaluate them)
//get reviewsClient 
router.get("/formateurGetReviewsClient/:id_utilisateur_cible", async (req, res) => {
    try {
        const idUtilisateurCible = req.params.id_utilisateur_cible;
        const userReviews = await Client.findById(idUtilisateurCible);

        if (!userReviews) {
            return res.status(404).send("Aucun utilisateur trouvé avec cet ID.");
        }

        // Retourner uniquement les détails des reviews
        const reviews = userReviews.reviews.map(review => ({
            auteur: review.auteur,
            note: review.note,
            commentaire: review.commentaire
        }));

        res.status(200).json(reviews);
    } catch (error) {
        console.error("Erreur lors de la récupération des reviews :", error);
        res.status(500).send("Une erreur s'est produite lors de la récupération des reviews.");
    }
});
//get reviewsFormateur
router.get("/formateurGetReviewsForamteur/:id_utilisateur_cible", async (req, res) => {
    try {
        const idUtilisateurCible = req.params.id_utilisateur_cible;
        const userReviews = await Formateur.findById(idUtilisateurCible);

        if (!userReviews) {
            return res.status(404).send("Aucun utilisateur trouvé avec cet ID.");
        }

        // Retourner uniquement les détails des reviews
        const reviews = userReviews.reviews.map(review => ({
            auteur: review.auteur,
            note: review.note,
            commentaire: review.commentaire
        }));

        res.status(200).json(reviews);
    } catch (error) {
        console.error("Erreur lors de la récupération des reviews :", error);
        res.status(500).send("Une erreur s'est produite lors de la récupération des reviews.");
    }
});
//get reviewsFreelancer
router.get("/freelancerGetReviewsFreelancer/:id_utilisateur_cible", async (req, res) => {
    try {
        const idUtilisateurCible = req.params.id_utilisateur_cible;
        const userReviews = await Freelancer.findById(idUtilisateurCible);

        if (!userReviews) {
            return res.status(404).send("Aucun utilisateur trouvé avec cet ID.");
        }

        // Retourner uniquement les détails des reviews
        const reviews = userReviews.reviews.map(review => ({
            auteur: review.auteur,
            note: review.note,
            commentaire: review.commentaire
        }));

        res.status(200).json(reviews);
    } catch (error) {
        console.error("Erreur lors de la récupération des reviews :", error);
        res.status(500).send("Une erreur s'est produite lors de la récupération des reviews.");
    }
});
//What he will get in his home page 
router.get("/formateurGetPostesClients",async (req,res)=>{
    let touteslespostesclients=await PosteClient.find();
    console.log(touteslespostesclients);
    if (touteslespostesclients){
        res.send(touteslespostesclients)
    }else{
        res.send("error");
    }

});
//with client id he will get the trainings request
router.get("/formateurGetPosteClient/:idposteclient", async (req, res) => {
    try {
        const posteclient = await PosteClient.findById(req.params.idposteclient);
    
        if (posteclient) {
            res.status(200).json(posteclient);
        } else {
            res.status(404).send("Aucun posteclient de formateur trouvé avec cet ID.");
        }
    } catch (error) {
        console.error("Erreur lors de la lecture du posteclient:", error);
        res.status(500).send("Une erreur s'est produite lors de la lecture du posteclient");
    }
});

module.exports = router;
