const express = require("express");
const passport = require("passport");
const multer = require('multer'); 
const path = require('path');
const LocalStrategy = require('passport-local').Strategy;
const session = require("express-session");
const Client = require("../models/Client");
const Transaction = require("../models/Transaction");
const Freelancer = require("../models/Freelancer");
const Formateur = require("../models/Formateur");
const ProjetClient = require("../models/ProjetClient");
const PosteClient = require('../models/PosteClient');
const PosteFreelancer = require("../models/PosteFreelancer");
const Annonce = require("../models/AnnonceFormation");
const Projectdata= require("../models/Projectdata");
const jwt = require('jsonwebtoken');
const secretKey = 'yourSecretKey'; 
const mongoose=require("mongoose");
const FreelancerS=require("../models/FreelancerSelcted");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/') // Destination folder for storing uploaded files
    },
    filename: function (req, file, cb) {
      // Generating a unique filename by adding a timestamp
      cb(null, Date.now() + '-' + file.originalname)
    }
  });
  
  const upload = multer({ storage: storage });
const router = express.Router();


//signin singup logout client
passport.use(new LocalStrategy(Client.authenticate()));

router.use(session({
    secret: "our little secret.",
    resave: false,
    saveUninitialized: false
}));

router.use(passport.initialize());
router.use(passport.session());
passport.serializeUser(function(client, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: client.id,
        username: client.username,
      });
    });
  });
  
  passport.deserializeUser(function(client, cb) {
    process.nextTick(function() {
      return cb(null, client);
    });
  });
 // Middleware personnalisé pour l'authentification
 function authenticateClient(req, res, next) {
    passport.authenticate("local", function(err, client, info) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error occurred during login." });
        }
        if (!client) {
            // No client found with provided credentials
            return res.status(401).json({ error: "Invalid username or password." });
        }
        req.login(client, { session: false }, function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error occurred during login." });
            }
            // Generate JWT token
            const token = jwt.sign({ type: 'client', id: client._id }, secretKey, { expiresIn: '1h' });
            // Store token in localStorage or state
            // For example, storing in localStorage
            return res.status(200).json({ token, id: client._id, nom: client.name });
           
        });
    })(req, res, next);
}

// Route for client login
router.post("/signinClient", authenticateClient, function(req, res) {
    res.status(200).json({ message: "Login successful." });
});

router.post("/signupClient", (req, res) => {
    const  { password, ...data } = req.body;
    const newClient = new Client(data); // Create a new client instance without password
    
    Client.register(newClient, password, function(err, client) {
        if (err) {
            console.error(err);
            res.send("Error occurred during signup.");
        } else {
            res.send("Signup successful");
        }
    });
});

router.get("/logoutClient", function(req, res) {
    req.logout(function(err) {
        if (err) {
            console.error(err);
            return res.send("Error occurred during logout.");
        }
        res.send("log out with success!!");
    });
});


 //get delete update client 
router.get("/clientGetClient/:idclient",(req,res)=>{
    Client.findOne({ _id: req.params.idclient })
    .then(foundClient => {
    if (foundClient) {
        res.send(foundClient);
    } else {
        res.send("Aucun client correspondant à cet id n'a été trouvé.");
    }
})
.catch(err => {
    console.error(err);
    res.status(500).send("Une erreur s'est produite lors de la recherche du client.");
});});

router.delete("/deleteClient/:idclient",(req,res)=>{
    Client.findOneAndDelete(
    { _id: req.params.idClient }
)
.then(deletedClient => {
    if (deletedClient) {
        res.send("Client supprimé avec succès : ");
    } else {
        res.send("Aucun Client trouvé avec cet id.");
    }
})
.catch(err => {
    res.send(err);
});});

router.patch("/updateClient/:idClient",(req,res)=>{
    Client.findOneAndUpdate(
        { _id: req.params.idClient },
        { $set: req.body },
        { new: true } // Pour renvoyer le document mis à jour
    )
    .then(updatedClient => {
        res.send("Client mis à jour avec succès . ");
    })
    .catch(err => {
        res.send(err);
    });
});
//get freelancer 
router.get("/clientGetFreelancer/:idfreelancer",(req,res)=>{
    Freelancer.findOne({ _id: req.params.idfreelancer })
    .then(foundCFreelancer => {
    if (foundCFreelancer) {
        res.send(foundCFreelancer);
    } else {
        res.send("Aucun freelancer correspondant à cet id n'a été trouvé.");
    }
})
.catch(err => {
    console.error(err);
    res.status(500).send("Une erreur s'est produite lors de la recherche du freelancer.");
});});
//get fomateur
router.get("/clientGetFormateur/:idformateur",(req,res)=>{
    Formateur.findOne({ _id: req.params.idformateur })
    .then(foundCFormateur => {
    if (foundCFormateur) {
        res.send(foundCFormateur);
    } else {
        res.send("Aucun formateur correspondant à cet id n'a été trouvé.");
    }
})
.catch(err => {
    console.error(err);
    res.status(500).send("Une erreur s'est produite lors de la recherche du formateur.");
});});



//Projects
router.get('/getdataprojects/:idclient', async (req, res) => {
    try {
        const idclient = req.params.idclient;

        // Find Projectdata documents with the specified idclient
        const projectdata = await Projectdata.find({ idclient });

        if (!projectdata) {
            return res.status(404).json({ error: 'Projectdata not found' });
        }

        res.status(200).json(projectdata);
    } catch (error) {
        console.error('Error fetching Projectdata:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post("/createProjet/:idclient", (req, res) => {
    const infos = req.body;
    console.log(infos);
    const projet = new ProjetClient({
        idclient: req.params.idclient,
        titre: infos.titre,
        contenu: infos.contenu,
        auteur: infos.auteur,
        Budget: infos.Budget,
        Skills: infos.Skills,
        domain:infos.domain,
        Deadline:infos.Deadline

    });
   
    projet.save()
        .then(savedProjet => {
            const projetdata=new Projectdata({
                idclient: req.params.idclient,
                titre: infos.titre,
                _id:projet._id
            });
            projetdata.save();
            console.log("Projet créé avec succès:", savedProjet);
            res.send("Projet créé avec succès");
        })
        .catch(error => {
            console.error("Erreur lors de la création du projet:", error);
            res.status(500).send("Erreur lors de la création du projet");
        });
});
router.post("/freelancerSelected/", (req, res) => {
    const infos = req.body;
    console.log(infos);
    const freelancerS = new FreelancerS({
        idclient: infos.idclient,
        idfreelancer: infos.idfreelancer,
        idProjet: infos.idProjet,
    });
    freelancerS.save()
        .then(savedProjet => {
            res.send("Freelancer Selected");
        })
        .catch(error => {
            console.error("Erreur:", error);
            res.status(500).send("Erreur ");
        });
});
router.post('/transferData', async (req, res) => {
    try {
        // Fetch data from ProjetClient model
        const projetClients = await ProjetClient.find();

        // Iterate over fetched data and insert/update documents
        for (const projetClient of projetClients) {
            await Projectdata.updateOne(
                { _id: projetClient._id }, // Use the existing _id
                {
                    $set: {
                        titre: projetClient.titre,
                        idclient: projetClient.idclient,
                        status: "Unrealised"
                    }
                },
                { upsert: true } // Insert the document if it does not exist
            );
        }

        res.status(200).json({ message: 'Data transferred successfully' });
    } catch (error) {
        console.error('Error transferring data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete("/deleteProjectdata/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const projet = await Projectdata.findByIdAndDelete(id);
        if (projet) {
            console.log("projet deleted successfully:", projet);
            res.send("projet deleted with success");
        } else {
            console.log("projet not found");
            res.status(404).send("projet not found");
        }
    } catch (error) {
        console.error("Error while deleting projet:", error);
        res.status(500).send("An error occurred while deleting projet");
    }
});
router.patch('/projects/:projectId/updateStatus', async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const { newStatus } = req.body;

        // Validate the new status
        if (!newStatus) {
            return res.status(400).json({ error: 'New status is required' });
        }

        // Check if the project exists
        const project = await Projectdata.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Update the status
        project.status = newStatus;
        await project.save();

        // Respond with the updated project
        res.status(200).json(project);
    } catch (error) {
        console.error('Error updating project status:', error);
        res.status(500).json({ error: 'An error occurred while updating project status' });
    }
});
router.get("/getProjetdata/:idclient",async (req,res)=>{
    try {
        const idClient = req.params.idclient; // Utilisez idfreelancer avec la même casse que dans l'URL
        const projet = await Projectdata.find({ idclient: idClient}); // Utilisez idFreelancer avec la même casse que dans le schéma MongoDB

        if (projet.length > 0) {
            res.status(200).json(projet);
        } else {
            res.status(404).send("Aucun poste de client trouvé pour cet ID de client.");
        }
    } catch (error) {
        console.error("Erreur lors de la lecture des projet:", error);
        res.status(500).send("Une erreur s'est produite lors de la lecture des projet");
    }


});
router.get("/getProjets/:idclient", async (req,res) => {
    try {
        const idClient = req.params.idclient; // Utilisez idfreelancer avec la même casse que dans l'URL
        const projet = await ProjetClient.find({ idclient: idClient}); // Utilisez idFreelancer avec la même casse que dans le schéma MongoDB

        if (projet.length > 0) {
            res.status(200).json(projet);
        } else {
            res.status(404).send("Aucun poste de client trouvé pour cet ID de client.");
        }
    } catch (error) {
        console.error("Erreur lors de la lecture des projet:", error);
        res.status(500).send("Une erreur s'est produite lors de la lecture des projet");
    }
});

router.get("/getProjet/:idprojet", async (req, res) => {
    try {
        const projet = await ProjetClient.findById(req.params.idprojet);
    
        if (projet) {
            res.status(200).json(projet);
        } else {
            res.status(404).send("Aucun projet de freelancer trouvé avec cet ID.");
        }
    } catch (error) {
        console.error("Erreur lors de la lecture du projet:", error);
        res.status(500).send("Une erreur s'est produite lors de la lecture du projet");
    }
});
router.delete("/deleteProjet/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const projet = await ProjetClient.findByIdAndDelete(id);
        if (projet) {
            console.log("projet deleted successfully:", projet);
            res.send("projet deleted with success");
        } else {
            console.log("projet not found");
            res.status(404).send("projet not found");
        }
    } catch (error) {
        console.error("Error while deleting projet:", error);
        res.status(500).send("An error occurred while deleting projet");
    }
});
router.patch("/updateProjet/:idprojet", async (req, res) => {
    try {
        const updatedProjet = await ProjetClient.findByIdAndUpdate(req.params.idprojet, req.body, { new: true });
        if (updatedProjet) {
            res.send("Projet updated successfully");
        } else {
            res.status(404).send("Aucun projet de freelancer trouvé avec cet ID.");
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour du projet:", error);
        res.status(500).send("Une erreur s'est produite lors de la mise à jour du poste");
    }
});



//signup Trainings
router.post("/clientInscritFormation/:idformation/:idclient", async (req, res) => {
    try {
        const idformation = req.params.idformation;
        const idclient = req.params.idclient;
        const formation = await Annonce.findById(idformation);
        const client = await Client.findById(idclient);
        console.log(formation);
        if (!formation || !client) {
            return res.status(404).send("Aucun formation  ou client trouvé avec cet ID.");
        }
        client.formations.push(formation);
        // Filter out the formation from client.formationsinp
        client.formationsinp = client.formationsinp.filter(item => item._id.toString() !== idformation);

        // Push the formation to client.formations
       
        console.log(client);
        // Push the req.body to formation.listedesinscrits
        formation.listedesinscrits.push(client);

        // Save both client and formation
        await client.save();
        await formation.save();

        res.status(200).json("vous etes inscrit");
    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).send("Une erreur.");
    }
});
router.post("/clientInscritFormationnonpayes/:idformation/:idclient", async (req, res) => {
    try {
        const idformation = req.params.idformation;
        const idclient= req.params.idclient;
        const formation = await Annonce.findById(idformation);
        const client= await Client.findById(idclient);
        console.log(formation);
        if (!formation || !client) {
            return res.status(404).send("Aucun formation trouvé avec cet ID.");
        }

        // Retourner uniquement les détails des reviews
        client.formationsinp.push(formation);
        await client.save();

        res.status(200).json("vous etes inscrit");
    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).send("Une erreur.");
    }

});


//Trainings request
router.post("/createPosteClient/:idclient", (req, res) => {
    const infos = req.body;
    console.log(infos);
    const posteClient = new PosteClient({
        idclient: req.params.idclient,
        descriptionTraining: infos.descriptionTraining,
        auteur: infos.auteur,
        domainTraining:infos.domainTraining
      
      
    });

    posteClient.save()
        .then(savedPosteClient => {
            console.log("posteClient créé avec succès:", savedPosteClient);
            res.send("posteClient créé avec succès");
        })
        .catch(error => {
            console.error("Erreur lors de la création du posteClient:", error);
            res.status(500).send("Erreur lors de la création du posteClient");
        });
});
router.get("/getPostesClient/:idclient", async (req,res) => {
    try {
        const idClient = req.params.idclient; // Utilisez idfreelancer avec la même casse que dans l'URL
        const poste = await PosteClient.find({ idclient: idClient}); // Utilisez idFreelancer avec la même casse que dans le schéma MongoDB

        if (poste.length > 0) {
            res.status(200).json(poste);
        } else {
            res.status(404).send("Aucun poste de client trouvé pour cet ID de client.");
        }
    } catch (error) {
        console.error("Erreur lors de la lecture des poste:", error);
        res.status(500).send("Une erreur s'est produite lors de la lecture des postes");
    }
});
router.delete("/deletePosteClient/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const posteClient = await PosteClient.findByIdAndDelete(id);
        if (posteClient) {
            console.log("posteClient deleted successfully:", posteClient);
            res.send("posteClient deleted with success");
        } else {
            console.log("posteClient not found");
            res.status(404).send("posteClient not found");
        }
    } catch (error) {
        console.error("Error while deleting posteClient:", error);
        res.status(500).send("An error occurred while deleting posteClient");
    }
});
router.patch("/updatePosteClient/:idposteclient", async (req, res) => {
    try {
        const updatedPosteClient = await PosteClient.findByIdAndUpdate(req.params.idposteclient, req.body, { new: true });
        if (updatedPosteClient) {
            res.send("Projet updated successfully");
        } else {
            res.status(404).send("Aucun projet de freelancer trouvé avec cet ID.");
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour du projet:", error);
        res.status(500).send("Une erreur s'est produite lors de la mise à jour du poste");
    }
});

//comment for the posts from the freelancers 
router.post("/clientAddCommentPoste/:idPost", async (req, res) => {
    try {
        const id = req.params.idPost;
        const  commentaire  = req.body; // Extracting the "commentaire" property from the request body

        let poste = await PosteFreelancer.findById(id);
        if (!poste) {
            console.log("Poste not found");
            return res.status(404).send("Poste not found");
        }

        // Vérifier que commentaire est défini et n'est pas null
        if (!commentaire) {
            console.log("Invalid or empty comment");
            return res.status(400).send("Invalid or empty comment");
        }

        // Ajouter le commentaire au champ "commentaire" du document
        poste.commentaire.push(commentaire);

        await poste.save();
        console.log("Comment added successfully for poste:", poste);
        res.status(200).send({ message: "Comment added successfully", id: poste._id });
    } catch (error) {
        console.error("Error while adding comment:", error);
        res.status(500).send("An error occurred while adding comment");
    }
});

router.get("/clientGetCommentsPoste/:idPoste", async (req, res) => {
    try {
        const idPoste = req.params.idPoste;

        // Trouver le poste de freelancer
        const poste = await PosteFreelancer.findById(idPoste);
        if (!poste) {
            console.log("Poste not found");
            return res.status(404).send("Poste not found");
        }

        // Extraire les commentaires du poste de freelancer
        const commentaires = poste.commentaire;

        console.log("Commentaires retrieved successfully:", commentaires);
        res.status(200).json(commentaires);
    } catch (error) {
        console.error("Error while retrieving comments:", error);
        res.status(500).send("An error occurred while retrieving comments");
    }
});
router.patch("/ClientUpdateCommentPoste/:idPoste/:idCommentaire", async (req, res) => {
    try {
        const idPoste = req.params.idPoste;
        const idCommentaire = req.params.idCommentaire;
        const { nom, contenu } = req.body; // Nouvelles données pour le commentaire

        // Trouver le poste de freelancer
        let poste = await PosteFreelancer.findById(idPoste);
        if (!poste) {
            console.log("Poste not found");
            return res.status(404).send("Poste not found");
        }

        // Trouver l'index du commentaire à mettre à jour dans le poste de freelancer
        const indexCommentaire = poste.commentaire.findIndex(commentaire => commentaire._id.toString() === idCommentaire);
        if (indexCommentaire === -1) {
            console.log("Commentaire not found");
            return res.status(404).send("Commentaire not found");
        }

        // Mettre à jour le commentaire
        poste.commentaire[indexCommentaire].nom = nom;
        poste.commentaire[indexCommentaire].contenu = contenu;

        // Sauvegarder les modifications du poste de freelancer
        await poste.save();
        
        console.log("Commentaire updated successfully:", poste.commentaire[indexCommentaire]);
        res.status(200).send("Commentaire updated successfully");
    } catch (error) {
        console.error("Error while updating commentaire:", error);
        res.status(500).send("An error occurred while updating commentaire");
    }
});
router.delete("/ClientDeleteCommentPoste/:idPoste/:idCommentaire", async (req, res) => {
    try {
        const idPoste = req.params.idPoste;
        const idCommentaire = req.params.idCommentaire;

        // Trouver le poste de freelancer
        let poste = await PosteFreelancer.findById(idPoste);
        if (!poste) {
            console.log("Poste not found");
            return res.status(404).send("Poste not found");
        }

        // Trouver l'index du commentaire à supprimer dans le poste de freelancer
        const indexCommentaire = poste.commentaire.findIndex(commentaire => commentaire && commentaire._id.toString() === idCommentaire);
        if (indexCommentaire === -1) {
            console.log("Commentaire not found");
            return res.status(404).send("Commentaire not found");
        }

        // Supprimer le commentaire du tableau
        poste.commentaire.splice(indexCommentaire, 1);

        // Sauvegarder les modifications du poste de freelancer
        await poste.save();
        
        console.log("Commentaire deleted successfully");
        res.status(200).send("Commentaire deleted successfully");
    } catch (error) {
        console.error("Error while deleting commentaire:", error);
        res.status(500).send("An error occurred while deleting commentaire");
    }
});
//comments for the  posts from the clients
router.post("/clientAddCommentPosteClient/:idPost", async (req, res) => {
    try {
        const id = req.params.idPost;
        const commentaire = req.body; // Extracting the "commentaire" property from the request body

        let poste = await PosteClient.findById(id);
        if (!poste) {
            console.log("Poste not found");
            return res.status(404).send("Poste not found");
        }

        // Vérifier que commentaire est défini et n'est pas null
        if (!commentaire) {
            console.log("Invalid or empty comment");
            return res.status(400).send("Invalid or empty comment");
        }

        // Ajouter le commentaire au champ "commentaire" du document
        poste.commentaire.push(commentaire);

        await poste.save();
        console.log("Comment added successfully for poste:", poste);
        res.status(200).send({ message: "Comment added successfully", id: poste._id });
    } catch (error) {
        console.error("Error while adding comment:", error);
        res.status(500).send("An error occurred while adding comment");
    }
});

router.get("/clientGetCommentsPosteClient/:idPoste", async (req, res) => {
    try {
        const idPoste = req.params.idPoste;

        // Trouver le poste de freelancer
        const poste = await PosteClient.findById(idPoste);
        if (!poste) {
            console.log("Poste not found");
            return res.status(404).send("Poste not found");
        }

        // Extraire les commentaires du poste de freelancer
        const commentaires = poste.commentaire;

        console.log("Commentaires retrieved successfully:", commentaires);
        res.status(200).json(commentaires);
    } catch (error) {
        console.error("Error while retrieving comments:", error);
        res.status(500).send("An error occurred while retrieving comments");
    }
});
router.patch("/ClientUpdateCommentPosteClient/:idPoste/:idCommentaire", async (req, res) => {
    try {
        const idPoste = req.params.idPoste;
        const idCommentaire = req.params.idCommentaire;
        const { nom, contenu } = req.body; // Nouvelles données pour le commentaire

        // Trouver le poste de freelancer
        let poste = await PosteClient.findById(idPoste);
        if (!poste) {
            console.log("Poste not found");
            return res.status(404).send("Poste not found");
        }

        // Trouver l'index du commentaire à mettre à jour dans le poste de freelancer
        const indexCommentaire = poste.commentaire.findIndex(commentaire => commentaire._id.toString() === idCommentaire);
        if (indexCommentaire === -1) {
            console.log("Commentaire not found");
            return res.status(404).send("Commentaire not found");
        }

        // Mettre à jour le commentaire
        poste.commentaire[indexCommentaire].nom = nom;
        poste.commentaire[indexCommentaire].contenu = contenu;

        // Sauvegarder les modifications du poste de freelancer
        await poste.save();
        
        console.log("Commentaire updated successfully:", poste.commentaire[indexCommentaire]);
        res.status(200).send("Commentaire updated successfully");
    } catch (error) {
        console.error("Error while updating commentaire:", error);
        res.status(500).send("An error occurred while updating commentaire");
    }
});
router.delete("/ClientDeleteCommentPosteClient/:idPoste/:idCommentaire", async (req, res) => {
    try {
        const idPoste = req.params.idPoste;
        const idCommentaire = req.params.idCommentaire;

        // Trouver le poste de freelancer
        let poste = await PosteClient.findById(idPoste);
        if (!poste) {
            console.log("Poste not found");
            return res.status(404).send("Poste not found");
        }

        // Trouver l'index du commentaire à supprimer dans le poste de freelancer
        const indexCommentaire = poste.commentaire.findIndex(commentaire => commentaire && commentaire._id.toString() === idCommentaire);
        if (indexCommentaire === -1) {
            console.log("Commentaire not found");
            return res.status(404).send("Commentaire not found");
        }

        // Supprimer le commentaire du tableau
        poste.commentaire.splice(indexCommentaire, 1);

        // Sauvegarder les modifications du poste de freelancer
        await poste.save();
        
        console.log("Commentaire deleted successfully");
        res.status(200).send("Commentaire deleted successfully");
    } catch (error) {
        console.error("Error while deleting commentaire:", error);
        res.status(500).send("An error occurred while deleting commentaire");
    }
});

//comments for the announcements from the trainers  
router.post("/clientAddCommentAnnonce/:idAnnonce", async (req, res) => {
    try {
        const id = req.params.idAnnonce;
        const commentaire  = req.body; // Extracting the "commentaire" property from the request body

        let annonce = await Annonce.findById(id);
        if (!annonce) {
            console.log("Annonce not found");
            return res.status(404).send("Annonce not found");
        }

        // Vérifier que commentaire est défini et n'est pas null
        if (!commentaire) {
            console.log("Invalid or empty comment");
            return res.status(400).send("Invalid or empty comment");
        }

        // Ajouter le commentaire au champ "commentaire" du document
        annonce.commentaire.push(commentaire);

        await annonce.save();
        console.log("Comment added successfully for annonce:", annonce);
        res.status(200).json({ message: "Comment added successfully", id: annonce._id });
    } catch (error) {
        console.error("Error while adding comment:", error);
        res.status(500).send("An error occurred while adding comment");
    }
});

router.get("/clientGetCommentsAnnonce/:idAnnonce", async (req, res) => {
    try {
        const idAnnonce = req.params.idAnnonce;

        // Trouver le poste de freelancer
        const annonce = await Annonce.findById(idAnnonce);
        if (!annonce) {
            console.log("annonce not found");
            return res.status(404).send("annonce not found");
        }

        // Extraire les commentaires du annonce de freelancer
        const commentaires = annonce.commentaire;

        console.log("Commentaires retrieved successfully:", commentaires);
        res.status(200).json(commentaires);
    } catch (error) {
        console.error("Error while retrieving comments:", error);
        res.status(500).send("An error occurred while retrieving comments");
    }
});
router.patch("/ClientUpdateCommentAnnonce/:idAnnonce/:idCommentaire", async (req, res) => {
    try {
        const idAnnonce = req.params.idAnnonce;
        const idCommentaire = req.params.idCommentaire;
        const { nom, contenu } = req.body; // Nouvelles données pour le commentaire

        // Trouver le Annonce de freelancer
        let annonce = await Annonce.findById(idAnnonce);
        if (!annonce) {
            console.log("Annonce not found");
            return res.status(404).send("Annonce not found");
        }

        // Trouver l'index du commentaire à mettre à jour dans le annonce de freelancer
        const indexCommentaire = annonce.commentaire.findIndex(commentaire => commentaire._id.toString() === idCommentaire);
        if (indexCommentaire === -1) {
            console.log("Commentaire not found");
            return res.status(404).send("Commentaire not found");
        }

        // Mettre à jour le commentaire
        annonce.commentaire[indexCommentaire].nom = nom;
        annonce.commentaire[indexCommentaire].contenu = contenu;

        // Sauvegarder les modifications du annonce de freelancer
        await annonce.save();
        
        console.log("Commentaire updated successfully:", annonce.commentaire[indexCommentaire]);
        res.status(200).send("Commentaire updated successfully");
    } catch (error) {
        console.error("Error while updating commentaire:", error);
        res.status(500).send("An error occurred while updating commentaire");
    }
});
router.delete("/ClientDeleteCommentAnnonce/:idAnnonce/:idCommentaire", async (req, res) => {
    try {
        const idAnnonce = req.params.idAnnonce;
        const idCommentaire = req.params.idCommentaire;

        let annonce = await Annonce.findById(idAnnonce);
        if (!annonce) {
            console.log("Annonce not found");
            return res.status(404).send("Annonce not found");
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
//comments for the projects from the clients 
router.post("/clientAddCommentProjet/:idProjet", async (req, res) => {
    try {
        const id = req.params.idProjet;
        const commentaire  = req.body; // Extracting the "commentaire" property from the request body

        let projet = await ProjetClient.findById(id);
        if (!projet) {
            console.log("projet not found");
            return res.status(404).send("projet not found");
        }

        // Vérifier que commentaire est défini et n'est pas null
        if (!commentaire) {
            console.log("Invalid or empty comment");
            return res.status(400).send("Invalid or empty comment");
        }

        // Ajouter le commentaire au champ "commentaire" du document
        projet.commentaire.push(commentaire);

        await projet.save();
        console.log("Comment added successfully for projet:", projet);
        res.status(200).json({ message: "Comment added successfully", id: projet._id });
    } catch (error) {
        console.error("Error while adding comment:", error);
        res.status(500).send("An error occurred while adding comment");
    }
});

router.get("/clientGetCommentsProjet/:idProjet", async (req, res) => {
    try {
        const idProjet = req.params.idProjet;

        // Trouver le poste de freelancer
        const projet = await ProjetClient.findById(idProjet);
        if (!projet) {
            console.log("projet not found");
            return res.status(404).send("projet not found");
        }

        // Extraire les commentaires du projet de freelancer
        const commentaires = projet.commentaire;

        console.log("Commentaires retrieved successfully:", commentaires);
        res.status(200).json(commentaires);
    } catch (error) {
        console.error("Error while retrieving comments:", error);
        res.status(500).send("An error occurred while retrieving comments");
    }
});
router.patch("/ClientUpdateCommentProjet/:idProjet/:idCommentaire", async (req, res) => {
    try {
        const idProjet = req.params.idProjet;
        const idCommentaire = req.params.idCommentaire;
        const { nom, contenu } = req.body; // Nouvelles données pour le commentaire

        // Trouver le Annonce de freelancer
        let projet = await ProjetClient.findById(idProjet);
        if (!projet) {
            console.log("projet not found");
            return res.status(404).send("projet not found");
        }

        // Trouver l'index du commentaire à mettre à jour dans le projet de freelancer
        const indexCommentaire = projet.commentaire.findIndex(commentaire => commentaire._id.toString() === idCommentaire);
        if (indexCommentaire === -1) {
            console.log("Commentaire not found");
            return res.status(404).send("Commentaire not found");
        }

        // Mettre à jour le commentaire
        projet.commentaire[indexCommentaire].nom = nom;
        projet.commentaire[indexCommentaire].contenu = contenu;

        // Sauvegarder les modifications du projet de freelancer
        await projet.save();
        
        console.log("Commentaire updated successfully:", projet.commentaire[indexCommentaire]);
        res.status(200).send("Commentaire updated successfully");
    } catch (error) {
        console.error("Error while updating commentaire:", error);
        res.status(500).send("An error occurred while updating commentaire");
    }
});
router.delete("/ClientDeleteCommentProjet/:idProjet/:idCommentaire", async (req, res) => {
    try {
        const idProjet = req.params.idProjet;
        const idCommentaire = req.params.idCommentaire;

        let projet = await ProjetClient.findById(idProjet);
        if (!projet) {
            console.log("projet not found");
            return res.status(404).send("projet not found");
        }

        const indexCommentaire = projet.commentaire.findIndex(commentaire => commentaire && commentaire._id.toString() === idCommentaire);
        if (indexCommentaire === -1) {
            console.log("Commentaire not found");
            return res.status(404).send("Commentaire not found");
        }

        projet.commentaire.splice(indexCommentaire, 1);

        await projet.save();
        
        console.log("Commentaire deleted successfully");
        res.status(200).send("Commentaire deleted successfully");
    } catch (error) {
        console.error("Error while deleting commentaire:", error);
        res.status(500).send("An error occurred while deleting commentaire");
    }
});


//What he will get on his home page 
router.get("/annoncesformations", async (req, res) => {
    try {
        let touteslesformations = await Annonce.find();
        console.log(touteslesformations);
        res.send(touteslesformations);
    } catch (error) {
        console.error("Erreur lors de la récupération des annonces de formations:", error);
        res.status(500).send("Erreur lors de la récupération des annonces de formations");
    }
});
router.get("/postesfreelancers", async (req, res) => {
    try {
        let touteslespostes = await PosteFreelancer.find();
        console.log(touteslespostes);
        res.send(touteslespostes);
    } catch (error) {
        console.error("Erreur lors de la récupération des postes freelancers:", error);
        res.status(500).send("Erreur lors de la récupération des postes freelancers");
    }
});
router.get("/clientGetPostesClients/:id", async (req, res) => {
    const idcl = req.params.id;

    try {
        const touteslespostesclients = await PosteClient.find({ idclient: { $ne: idcl } });
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

 //reviews for  the  freelancers 
router.post("/clientCreateReviewFreelancer/:id_utilisateur_cible", async (req, res) => {
    try {
        const idUtilisateurCible = req.params.id_utilisateur_cible;
        const { auteur, note, commentaire } = req.body;

        // Trouver l'utilisateur cible dans la base de données
        let utilisateurCible = await Freelancer.findById(idUtilisateurCible);

        if (!utilisateurCible) {
            return res.status(404).send("Utilisateur cible non trouvé.");
        }

        // Ajouter la review à l'utilisateur cible
        utilisateurCible.reviews.push({ auteur, note, commentaire });
        await utilisateurCible.save();

        console.log("Review ajoutée avec succès.");
        res.status(200).send("Review ajoutée avec succès.");
    } catch (error) {
        console.error("Erreur lors de l'ajout de la review :", error);
        res.status(500).send("Une erreur s'est produite lors de l'ajout de la review.");
    }
});

router.delete("/clientDeleteReviewFreelancer/:id_utilisateur_cible/:id_review", async (req, res) => {
try {
const idUtilisateurCible = req.params.id_utilisateur_cible;
const idReview = req.params.id_review;

// Trouver l'utilisateur cible dans la base de données
let utilisateurCible = await Freelancer.findById(idUtilisateurCible);

if (!utilisateurCible) {
    return res.status(404).send("Utilisateur cible non trouvé.");
}

// Trouver l'index de la review à supprimer dans le tableau des reviews de l'utilisateur cible
const indexReview = utilisateurCible.reviews.findIndex(review => review._id.toString() === idReview);

if (indexReview === -1) {
    return res.status(404).send("Review non trouvée.");
}

// Supprimer la review du tableau des reviews de l'utilisateur cible
utilisateurCible.reviews.splice(indexReview, 1);
await utilisateurCible.save();

console.log("Review supprimée avec succès.");
res.status(200).send("Review supprimée avec succès.");
} catch (error) {
console.error("Erreur lors de la suppression de la review :", error);
res.status(500).send("Une erreur s'est produite lors de la suppression de la review.");
}
});

router.get("/clientGetReviewsFreelancer/:id_utilisateur_cible", async (req, res) => {
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
router.put("/clientUpdateReviewFreelancer/:id_utilisateur_cible/:id_review", async (req, res) => {
try {
const idUtilisateurCible = req.params.id_utilisateur_cible;
const idReview = req.params.id_review;
const { auteur, note, commentaire } = req.body;

// Trouver l'utilisateur cible dans la base de données
let utilisateurCible = await Freelancer.findById(idUtilisateurCible);

if (!utilisateurCible) {
    return res.status(404).send("Utilisateur cible non trouvé.");
}

// Trouver la review à mettre à jour dans le tableau des reviews de l'utilisateur cible
const reviewToUpdate = utilisateurCible.reviews.find(review => review._id.toString() === idReview);

if (!reviewToUpdate) {
    return res.status(404).send("Review non trouvée.");
}

// Mettre à jour les champs de la review
reviewToUpdate.auteur = auteur;
reviewToUpdate.note = note;
reviewToUpdate.commentaire = commentaire;

// Enregistrer les modifications
await utilisateurCible.save();

console.log("Review mise à jour avec succès.");
res.status(200).send("Review mise à jour avec succès.");
} catch (error) {
console.error("Erreur lors de la mise à jour de la review :", error);
res.status(500).send("Une erreur s'est produite lors de la mise à jour de la review.");
}
});

//reviews for formateurs
  router.post("/clientCreateReviewFormateur/:id_utilisateur_cible", async (req, res) => {
    try {
        const idUtilisateurCible = req.params.id_utilisateur_cible;
        const { auteur, note, commentaire } = req.body;

        // Trouver l'utilisateur cible dans la base de données
        let utilisateurCible = await Formateur.findById(idUtilisateurCible);

        if (!utilisateurCible) {
            return res.status(404).send("Utilisateur cible non trouvé.");
        }

        // Ajouter la review à l'utilisateur cible
        utilisateurCible.reviews.push({ auteur, note, commentaire });
        await utilisateurCible.save();

        console.log("Review ajoutée avec succès.");
        res.status(200).send("Review ajoutée avec succès.");
    } catch (error) {
        console.error("Erreur lors de l'ajout de la review :", error);
        res.status(500).send("Une erreur s'est produite lors de l'ajout de la review.");
    }
});

router.delete("/clientDeleteReviewForamteur/:id_utilisateur_cible/:id_review", async (req, res) => {
try {
const idUtilisateurCible = req.params.id_utilisateur_cible;
const idReview = req.params.id_review;

// Trouver l'utilisateur cible dans la base de données
let utilisateurCible = await Formateur.findById(idUtilisateurCible);

if (!utilisateurCible) {
    return res.status(404).send("Utilisateur cible non trouvé.");
}

// Trouver l'index de la review à supprimer dans le tableau des reviews de l'utilisateur cible
const indexReview = utilisateurCible.reviews.findIndex(review => review._id.toString() === idReview);

if (indexReview === -1) {
    return res.status(404).send("Review non trouvée.");
}

// Supprimer la review du tableau des reviews de l'utilisateur cible
utilisateurCible.reviews.splice(indexReview, 1);
await utilisateurCible.save();

console.log("Review supprimée avec succès.");
res.status(200).send("Review supprimée avec succès.");
} catch (error) {
console.error("Erreur lors de la suppression de la review :", error);
res.status(500).send("Une erreur s'est produite lors de la suppression de la review.");
}
});

router.get("/clientGetReviewsForamteur/:id_utilisateur_cible", async (req, res) => {
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
router.put("/clientUpdateReviewForamteur/:id_utilisateur_cible/:id_review", async (req, res) => {
try {
const idUtilisateurCible = req.params.id_utilisateur_cible;
const idReview = req.params.id_review;
const { auteur, note, commentaire } = req.body;

// Trouver l'utilisateur cible dans la base de données
let utilisateurCible = await Foramteur.findById(idUtilisateurCible);

if (!utilisateurCible) {
    return res.status(404).send("Utilisateur cible non trouvé.");
}

// Trouver la review à mettre à jour dans le tableau des reviews de l'utilisateur cible
const reviewToUpdate = utilisateurCible.reviews.find(review => review._id.toString() === idReview);

if (!reviewToUpdate) {
    return res.status(404).send("Review non trouvée.");
}

// Mettre à jour les champs de la review
reviewToUpdate.auteur = auteur;
reviewToUpdate.note = note;
reviewToUpdate.commentaire = commentaire;

// Enregistrer les modifications
await utilisateurCible.save();

console.log("Review mise à jour avec succès.");
res.status(200).send("Review mise à jour avec succès.");
} catch (error) {
console.error("Erreur lors de la mise à jour de la review :", error);
res.status(500).send("Une erreur s'est produite lors de la mise à jour de la review.");
}
});


module.exports = router;
