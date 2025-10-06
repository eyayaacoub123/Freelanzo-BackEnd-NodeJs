// Assuming Freelancer model is set up with passport-local-mongoose
const express = require("express");
const passport = require("passport");
const multer = require('multer'); // Middleware for handling multipart/form-data
const path = require('path');
const LocalStrategy = require('passport-local').Strategy;
const session = require("express-session");
const Transaction = require("../models/Transaction");
const PosteFreelancer = require("../models/PosteFreelancer");
const Client = require("../models/Client");
const Formateur = require("../models/Formateur");
const ProjetClient = require("../models/ProjetClient");
const jwt = require('jsonwebtoken');
const secretKey = 'yourSecretKey';
const Projectdata = require("../models/Projectdata");
const Freelancer = require("../models/Freelancer"); // Assuming you've defined Freelancer model correctly
const router = express.Router();
const FreelancerS = require("../models/FreelancerSelcted");

const Annonce = require("../models/AnnonceFormation");

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/'); // Destination folder for uploaded files
    },
    filename: function(req, file, cb) {
        // Generate unique file name by appending current timestamp
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


passport.use('freelancer-local', new LocalStrategy(Freelancer.authenticate()));

router.use(session({
    secret: "our little secret.",
    resave: false,
    saveUninitialized: false
}));

router.use(passport.initialize());
router.use(passport.session());

passport.serializeUser(function (user, cb) {
    cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
    if (obj.type === 'freelancer') {
        Freelancer.findById(obj.id)
            .then(freelancer => {
                cb(null, freelancer);
            })
            .catch(err => {
                cb(err, null);
            });
    } else {
        // Handle other types of users if needed
    }
});



function authenticateFreelancer(req, res, next) {
    passport.authenticate('freelancer-local', function (err, freelancer, info) {
        if (err) {
            console.error(err);
            return res.status(500).send('Error occurred during login.');
        }
        if (!freelancer) {
            return res.status(401).send('Invalid username or password.');
        }
        req.login({ type: 'freelancer', id: freelancer._id }, function (err) {
            if (err) {
                console.error(err);
                return res.status(500).send('Error occurred during login.');
            }
            // Generate JWT token
            const token = jwt.sign({ type: 'freelancer', id: freelancer._id }, secretKey, { expiresIn: '1h' });
            // Send the token back in the response
            return res.status(200).json({ token, id: freelancer._id, nom: freelancer.name });
        });
    })(req, res, next);
}

router.post("/signinFreelancer", authenticateFreelancer, function (req, res) {
    // The JWT token will be sent in the response
    // You can handle it in your frontend to store it for subsequent authenticated requests
    res.status(200).send("Login successful.");
});

router.post("/signupFreelancer", (req, res) => {
    const { password, ...data } = req.body;
    const newFreelancer = new Freelancer(data);

    Freelancer.register(newFreelancer, password, function (err, freelancer) {
        if (err) {
            console.error(err);
            res.send("Error occurred during signup.");
        } else {
            res.send("Signup successful");
        }
    });
});

router.get("/logoutFreelancer", function (req, res) {
    req.logout(function (err) {
        if (err) {
            console.error(err);
            return res.send("Error occurred during logout.");
        }
        res.send("Logout successful!!");
    });
});





//get delete update freelancer 
router.get("/freelancerGetFreelancer/:idfreelancer", (req, res) => {
    Freelancer.findOne({ _id: req.params.idfreelancer })
        .then(foundFreelancer => {
            if (foundFreelancer) {
                res.send(foundFreelancer);
            } else {
                res.send("Aucun freelancer correspondant à cet id n'a été trouvé.");
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Une erreur s'est produite lors de la recherche du freelancer.");
        });
});

router.delete("/deleteFreelancer/:idfreelancer", (req, res) => {
    Freelancer.findOneAndDelete(
        { _id: req.params.idfreelancer }
    )
        .then(deletedFreelancer => {
            if (deletedFreelancer) {
                res.send("freelancer supprimé avec succès : ");
            } else {
                res.send("Aucun freelancer trouvé avec cet id.");
            }
        })
        .catch(err => {
            res.send(err);
        });
});

router.patch("/updateFreelancer/:idfreelancer", (req, res) => {
    Freelancer.findOneAndUpdate(
        { _id: req.params.idfreelancer },
        { $set: req.body },
        { new: true } // Pour renvoyer le document mis à jour
    )
        .then(updatedFreelancer => {
            res.send("Freelancer mis à jour avec succès . ");
        })
        .catch(err => {
            res.send(err);
        });
});
//get client 

router.get("/freelancerGetClient/:idclient", (req, res) => {
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
        });
});
//get formateur 
router.get("/freelancerGetFormateur/:idformateur", (req, res) => {
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

///les postes 
router.post("/createPoste/:idFreelancer", upload.array('files', 5), async (req, res) => {
    try {
        const idFreelancer = req.params.idFreelancer;
        const { activity, domain, description,auteur } = req.body;

        // Extract file URLs from uploaded files
        const files = req.files.map(file => ({
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
            url: `http://localhost:5000/uploads/${file.filename}` // Adjusted URL construction
        }))

        // Créer un nouveau poste en incluant l'ID du freelancer et les URLs des fichiers
        const newPoste = new PosteFreelancer({
            idfreelancer: idFreelancer,
            activity: activity,
            description: description,
            domain: domain,
            auteur: auteur, // Assuming this is static for now
            files: files,
            // Vous pouvez initialiser le tableau de commentaires ici si nécessaire
        });

        await newPoste.save();
        console.log("Poste added successfully:", newPoste);
        res.json(newPoste); // Sending the added PosteFreelancer object as response
    } catch (error) {
        console.error("Error while adding poste:", error);
        res.status(500).send("An error occurred while adding poste");
    }
});

router.get("/submittedprojects/:idfreelancer", async (req, res) => {
    const idfreelancer = req.params.idfreelancer;

    try {
        // Find all submitted projects for the specified freelancer
        const submittedProjects = await FreelancerS.find({ idfreelancer })
            .populate({
                path: 'idclient', // Populate the client details
                select: 'name email', // Select only name and email fields
                model: 'Client' // Name of the client model
            })
            .populate({
                path: 'idProjet', // Populate the project details
                select: 'titre description', // Select only titre and description fields
                model: 'postedata' // Name of the project model
            })
           

        res.json(submittedProjects);
    } catch (error) {
        console.error("Error fetching submitted projects:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



router.get("/getPostes/:idfreelancer", async (req, res) => {
    try {
        const idFreelancer = req.params.idfreelancer; // Utilisez idfreelancer avec la même casse que dans l'URL
        const postes = await PosteFreelancer.find({ idfreelancer: idFreelancer }); // Utilisez idFreelancer avec la même casse que dans le schéma MongoDB

        if (postes.length > 0) {
            res.status(200).json(postes);
        } else {
            res.status(404).send("Aucun poste de freelancer trouvé pour cet ID de freelancer.");
        }
    } catch (error) {
        console.error("Erreur lors de la lecture des postes:", error);
        res.status(500).send("Une erreur s'est produite lors de la lecture des postes");
    }
});

router.get("/getPoste/:idposte", async (req, res) => {
    try {
        const poste = await PosteFreelancer.findById(req.params.idposte);

        if (poste) {
            res.status(200).json(poste);
        } else {
            res.status(404).send("Aucun poste de freelancer trouvé avec cet ID.");
        }
    } catch (error) {
        console.error("Erreur lors de la lecture du poste:", error);
        res.status(500).send("Une erreur s'est produite lors de la lecture du poste");
    }
});

router.delete("/deletePoste/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const poste = await PosteFreelancer.findByIdAndDelete(id);
        if (poste) {
            console.log("Poste deleted successfully:", poste);
            res.send("Poste deleted with success");
        } else {
            console.log("Poste not found");
            res.status(404).send("Poste not found");
        }
    } catch (error) {
        console.error("Error while deleting poste:", error);
        res.status(500).send("An error occurred while deleting poste");
    }
});
router.patch("/updatePoste/:idposte", async (req, res) => {
    try {
        const updatedPoste = await PosteFreelancer.findByIdAndUpdate(req.params.idposte, req.body, { new: true });
        if (updatedPoste) {
            res.send("Poste updated successfully");
        } else {
            res.status(404).send("Aucun poste de freelancer trouvé avec cet ID.");
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour du poste:", error);
        res.status(500).send("Une erreur s'est produite lors de la mise à jour du poste");
    }
});


//comments aele posts
router.post("/freelancerAddCommentPoste/:idPoste", async (req, res) => {
    try {
        const id = req.params.idPoste;
        const commentaire = req.body; // Extracting the "commentaire" property from the request body
        console.log(commentaire);
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
        res.status(200).send("Comment added successfully");
    } catch (error) {
        console.error("Error while adding comment:", error);
        res.status(500).send("An error occurred while adding comment");
    }
});

router.get("/freelancerGetComments/:idPoste", async (req, res) => {
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
router.patch("/freelancerUpdateCommentPoste/:idPoste/:idCommentaire", async (req, res) => {
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
router.delete("/freelancerDeleteCommentPoste/:idPoste/:idCommentaire", async (req, res) => {
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

//comments aele annonce
router.post("/freelancerAddCommentAnnonce/:idAnnonce", async (req, res) => {
    try {
        const id = req.params.idAnnonce;
        const commentaire = req.body; // Extracting the "commentaire" property from the request body

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
        res.status(200).send("Comment added successfully");
    } catch (error) {
        console.error("Error while adding comment:", error);
        res.status(500).send("An error occurred while adding comment");
    }
});

router.get("/freelancerGetCommentsAnnonce/:idAnnonce", async (req, res) => {
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
router.patch("/freelancerUpdateCommentAnnonce/:idAnnonce/:idCommentaire", async (req, res) => {
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

router.delete("/freelancerDeleteCommentAnnonce/:idAnnonce/:idCommentaire", async (req, res) => {
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


//comments aele projets clients
router.post("/freelancerAddCommentProjet/:idProjet", async (req, res) => {
    try {
        const id = req.params.idProjet;
        const commentaire = req.body; // Extracting the "commentaire" property from the request body

        let projet = await ProjetClient.findById(id);
        if (!projet) {
            console.log("Projet not found");
            return res.status(404).send("Projet not found");
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
        res.status(200).send("Comment added successfully");
    } catch (error) {
        console.error("Error while adding comment:", error);
        res.status(500).send("An error occurred while adding comment");
    }
});

router.get("/freelancerGetCommentsProjet/:idProjet", async (req, res) => {
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
router.post('/submitproject/:projectId/:freelancerid', async (req, res) => {
    try {
        console.log(req.body);
        const projectId = req.params.projectId;
        const idfreelancer = req.params.freelancerid;
        const { price, duration, firstName, lastName, coverletter } = req.body;
        const nom=firstName+lastName;
        // Find the project by ID
        const project1= await ProjetClient.findById(projectId);

        const project = await Projectdata.findById(projectId);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        console.log(coverletter);

        // Add the new candidate to the listeCandidates array
        project.listeCandidates.push({
            idfreelancer,
            nom: `${firstName} ${lastName}`,
            duration,
            price,
            coverletter:{
                nomclient:project1.auteur,
                contenu:coverletter,
                nom:nom
            }
        });

        // Save the updated project
        await project.save();

        res.status(200).json({ message: 'Candidate added successfully', project });
    } catch (error) {
        console.error('Error adding candidate:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch("/freelancerUpdateCommentProjet/:idProjet/:idCommentaire", async (req, res) => {
    try {
        const idProjet = req.params.idProjet;
        const idCommentaire = req.params.idCommentaire;
        const { nom, contenu } = req.body; // Nouvelles données pour le commentaire

        // Trouver le poste de freelancer
        let projet = await PosteFreelancer.findById(idProjet);
        if (!projet) {
            console.log("Poste not found");
            return res.status(404).send("Poste not found");
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
}
);
router.delete("/freelancerDeleteCommentProjet/:idProjet/:idCommentaire", async (req, res) => {
    try {
        const idProjet = req.params.idProjet;
        const idCommentaire = req.params.idCommentaire;

        let projet = await ProjetClient.findById(idProjet);
        if (!projet) {
            console.log("Poste not found");
            return res.status(404).send("Poste not found");
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
// l acceuil chnouwa fyh
router.get("/annoncesformations", async (req, res) => {
    let touteslesformations = await Annonce.find();
    console.log(touteslesformations);
    if (touteslesformations) {
        res.send(touteslesformations)
    } else {
        res.send("error");
    }

});
router.get("/postesfreelancers/:id", async (req, res) => {
    const idfr = req.params.id;
    try {
        // Find all posts except those belonging to the specified user ID
        const touteslespostes = await PosteFreelancer.find({ idfreelancer: { $ne: idfr } });
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

router.get("/projetsclients", async (req, res) => {
    let touslesprojets = await ProjetClient.find();
    //console.log(touslesprojets);
    if (touslesprojets) {
        res.send(touslesprojets)
    } else {
        res.send("error");
    }

});



//get reviews freelancers


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





//reviews aele l formateurs
// Ensure this route is in your Express app
router.post("/freelancerCreateReviewFormateur/:id_utilisateur_cible", async (req, res) => {
    try {
        const idUtilisateurCible = req.params.id_utilisateur_cible;
        const { auteur, note, commentaire } = req.body;

        // Find the target user in the database
        let utilisateurCible = await Formateur.findById(idUtilisateurCible);

        if (!utilisateurCible) {
            return res.status(404).send("Utilisateur cible non trouvé.");
        }

        // Add the review to the target user
        utilisateurCible.reviews.push({ auteur, note, commentaire });
        await utilisateurCible.save();

        console.log("Review ajoutée avec succès.");
        res.status(200).send("Review ajoutée avec succès.");
    } catch (error) {
        console.error("Erreur lors de l'ajout de la review :", error);
        res.status(500).send("Une erreur s'est produite lors de l'ajout de la review.");
    }
});


// Freelancer Delete Review Formateur
router.delete("/freelancerDeleteReviewFormateur/:id_utilisateur_cible/:id_review", async (req, res) => {
    try {
        const idUtilisateurCible = req.params.id_utilisateur_cible;
        const idReview = req.params.id_review;

        // Find the target user in the database
        let utilisateurCible = await Formateur.findById(idUtilisateurCible);

        if (!utilisateurCible) {
            return res.status(404).send("Utilisateur cible non trouvé.");
        }

        // Find the index of the review to delete
        const indexReview = utilisateurCible.reviews.findIndex(review => review._id.toString() === idReview);

        if (indexReview === -1) {
            return res.status(404).send("Review non trouvée.");
        }

        // Remove the review
        utilisateurCible.reviews.splice(indexReview, 1);
        await utilisateurCible.save();

        console.log("Review supprimée avec succès.");
        res.status(200).send("Review supprimée avec succès.");
    } catch (error) {
        console.error("Erreur lors de la suppression de la review :", error);
        res.status(500).send("Une erreur s'est produite lors de la suppression de la review.");
    }
});



router.get("/freelancerGetReviewsForamteur/:id_utilisateur_cible", async (req, res) => {
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

router.patch("/freelancerUpdateReviewForamteur/:id_utilisateur_cible/:id_review", async (req, res) => {
    try {
        const idUtilisateurCible = req.params.id_utilisateur_cible;
        const idReview = req.params.id_review;
        const { auteur, note, commentaire } = req.body;

        // Trouver l'utilisateur cible dans la base de données
        let utilisateurCible = await Formateur.findById(idUtilisateurCible);

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



//reviews aele l client

router.post("/freelancerCreateReviewClient/:id_utilisateur_cible", async (req, res) => {
    try {
        const idUtilisateurCible = req.params.id_utilisateur_cible;
        const { auteur, note, commentaire } = req.body;

        // Trouver l'utilisateur cible dans la base de données
        let utilisateurCible = await Client.findById(idUtilisateurCible);

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

router.delete("/freelancerDeleteReviewClient/:id_utilisateur_cible/:id_review", async (req, res) => {
    try {
        const idUtilisateurCible = req.params.id_utilisateur_cible;
        const idReview = req.params.id_review;

        // Trouver l'utilisateur cible dans la base de données
        let utilisateurCible = await Client.findById(idUtilisateurCible);

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
router.get("/freelancerGetReviewsClient/:id_utilisateur_cible", async (req, res) => {
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
router.put("/freelancerUpdateReviewClient/:id_utilisateur_cible/:id_review", async (req, res) => {
    try {
        const idUtilisateurCible = req.params.id_utilisateur_cible;
        const idReview = req.params.id_review;
        const { auteur, note, commentaire } = req.body;

        // Find the user in the database
        let utilisateurCible = await Formateur.findById(idUtilisateurCible);

        if (!utilisateurCible) {
            return res.status(404).send("Utilisateur cible non trouvé.");
        }

        // Find the review to update
        const reviewToUpdate = utilisateurCible.reviews.find(review => review._id.toString() === idReview);

        if (!reviewToUpdate) {
            return res.status(404).send("Review non trouvée.");
        }

        // Update the review fields
        reviewToUpdate.auteur = auteur;
        reviewToUpdate.note = note;
        reviewToUpdate.commentaire = commentaire;

        // Save the changes
        await utilisateurCible.save();

        console.log("Review mise à jour avec succès.");
        res.status(200).send("Review mise à jour avec succès.");
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la review :", error);
        res.status(500).send("Une erreur s'est produite lors de la mise à jour de la review.");
    }
});
//get reviews freelancers 
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

//formations:
router.post("/freelancerInscritFormation/:idformation/:idfreelancer", async (req, res) => {
    try {
        const idformation = req.params.idformation;
        const idfreelancer = req.params.idfreelancer;
        const formation = await Annonce.findById(idformation);
        const freelancer = await Freelancer.findById(idfreelancer);
        console.log(formation);
        if (!formation || !freelancer) {
            return res.status(404).send("Aucun formation  ou freelancer trouvé avec cet ID.");
        }

        // Filter out the formation from freelancer.formationsinp
        freelancer.formationsinp = freelancer.formationsinp.filter(item => item._id.toString() !== idformation);

        // Push the formation to freelancer.formations
        freelancer.formations.push(formation);

        // Push the req.body to formation.listedesinscrits
        formation.listedesinscrits.push(freelancer);

        // Save both freelancer and formation
        await freelancer.save();
        await formation.save();

        res.status(200).json("vous etes inscrit");
    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).send("Une erreur.");
    }
});


router.post("/freelancerInscritFormationnonpayes/:idformation/:idfreelancer", async (req, res) => {
    try {
        const idformation = req.params.idformation;
        const idfreelancer= req.params.idfreelancer;
        const formation = await Annonce.findById(idformation);
        const freelancer= await Freelancer.findById(idfreelancer);
        console.log(formation);
        if (!formation || !freelancer) {
            return res.status(404).send("Aucun formation trouvé avec cet ID.");
        }

        // Retourner uniquement les détails des reviews
        freelancer.formationsinp.push(formation);
        await freelancer.save();

        res.status(200).json("vous etes inscrit");
    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).send("Une erreur.");
    }

});

router.get("/freelancerGetlistesFormations/:id", async (req, res) => {
    let id = req.params.id;
    try {
        const documents = await Annonce.find(
            { "listedesinscrits._id": id },
            { titre: 1, contenu: 1, auteur: 1, prix: 1, listedesinscrits: { $elemMatch: { _id: id } } }
        );
        // documents will contain all documents where the listedesinscrits array contains an object with the specified id
        console.log(documents);
        res.status(200).json(documents);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Une erreur.");
    }
});
router.get("/checkinscrit/:idinscrit/:idformation", async (req, res) => {
    const idInscrit = req.params.idinscrit;
    const idFormation = req.params.idformation;

    try {
        // Find the Annonce document with the given idFormation
        const annonce = await Annonce.findById(idFormation);

        if (!annonce) {
            return res.status(404).json({ error: "Annonce not found" });
        }

        // Check if the listedesinscrits field is defined and an array
        if (!annonce.listedesinscrits || !Array.isArray(annonce.listedesinscrits)) {
            return res.status(400).json({ error: "listedesinscrits is not properly defined" });
        }

        // Check if the idInscrit exists in the listedesinscrits array
        const isInscritExists = annonce.listedesinscrits.some(inscrit => inscrit._id === idInscrit);

        res.status(200).json({ isInscritExists });
    } catch (error) {
        console.error('Error checking idInscrit:', error);
        res.status(500).json({ error: 'An error occurred while checking idInscrit' });
    }
});


router.post('/freelancerPayeFormation/:idformation', upload.single('picture'), async (req, res) => {
    // If file is uploaded successfully, req.file will contain file details
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }


    let idinscrit = req.body.id_inscrit;
    let etas = false;

    let idformation = req.params.idformation;
    const fileUrl = req.protocol + '://' + req.get('host') + '/' + req.file.path.replace(/\\/g, '/');

    let transaction = new Transaction({ id_inscrit: idinscrit, id_formation: idformation, recu: fileUrl, etatpayment: etas });
    await transaction.save();
    if (transaction) {
        res.send("Transaction fait avec succes");
    }
    // File uploaded successfully


});


// Serve uploaded pictures statically
const uploadsDirectory = path.join(__dirname, '../uploads');

router.use('/uploads', express.static(uploadsDirectory));



module.exports = router;