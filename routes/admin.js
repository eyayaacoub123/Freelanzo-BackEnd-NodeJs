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
const Admin=require("../models/Admin");
const Freelancer = require("../models/Freelancer"); 
const router = express.Router();
const Annonce = require("../models/AnnonceFormation");
const PosteClient = require("../models/PosteClient");
const jwt = require('jsonwebtoken');
const secretKey = 'yourSecretKey';

passport.use('admin-local', new LocalStrategy(Admin.authenticate()));
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
    if (obj.type === 'admin') {
        Admin.findById(obj.id)
            .then(admin => {
                cb(null, admin);
            })
            .catch(err => {
                cb(err, null);
            });
    } else {
        // Handle other types of users if needed
    }
});
// Middleware for authenticating admin
function authenticateAdmin(req, res, next) {
    passport.authenticate('admin-local', function(err, admin, info) {
        if (err) {
            console.error(err);
            return res.status(500).send('Error occurred during login.');
        }
        if (!admin) {
            return res.status(401).send('Invalid username or password.');
        }
        req.login({type: 'admin', id: admin._id}, function(err) {
            if (err) {
                console.error(err);
                return res.status(500).send('Error occurred during login.');
            }
            const token = jwt.sign({ type: 'admin', id: admin._id._id }, secretKey, { expiresIn: '1h' });
            // Send the token back in the response
            return res.status(200).json({ token, id: admin._id, nom: admin.name });
      
        });
    })(req, res, next);
}



router.post("/signinAdmin", authenticateAdmin, function(req, res) {
    res.status(200).send("Login successful.");
});
//this is only works in the postman , where we can add an admin (there is no interface for it)
router.post("/signupAdmin", (req, res) => {
    const { username, email, password } = req.body;
    const newAdmin = new Admin({ username, email });

    Admin.register(newAdmin, password, function(err, Admin) {
        if (err) {
            console.error(err);
            res.send("Error occurred during signup.");
        } else {
            res.send("Signup successful");
        }
    });
});

router.get("/logoutAdmin", function(req, res) {
    req.logout(function(err) {
        if (err) {
            console.error(err);
            return res.send("Error occurred during logout.");
        }
        res.send("Logout successful!!");
    });
});
//get users 
router.get("/adminGetAllFreelancers", (req, res) => {
    Freelancer.find()
        .then(allFreelancers => {
            if (allFreelancers.length > 0) {
                res.send(allFreelancers);
            } else {
                res.send("Aucun freelancer n'a été trouvé.");
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Une erreur s'est produite lors de la recherche des freelancers.");
        });
});
router.get("/adminGetAllClients", (req, res) => {
    Client.find()
        .then(allClients => {
            if (allClients.length > 0) {
                res.send(allClients);
            } else {
                res.send("Aucun Client n'a été trouvé.");
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Une erreur s'est produite lors de la recherche des freelancers.");
        });
});
router.get("/adminGetAllFormateurs", (req, res) => {
    Formateur.find()
        .then(allFormateur => {
            if (allFormateur.length > 0) {
                res.send(allFormateur);
            } else {
                res.send("Aucun Formateur n'a été trouvé.");
            }
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Une erreur s'est produite lors de la recherche des freelancers.");
        });
});

//delete users
router.delete("/deleteFreelancer/:idfreelancer",(req,res)=>{
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
});});


router.delete("/adminDeleteClient/:clientId", (req, res) => {
    const clientId = req.params.clientId;
    Client.findByIdAndDelete(clientId)
        .then(deletedClient => {
            if (!deletedClient) {
                return res.status(404).send("Client non trouvé.");
            }
            res.send("Client supprimé avec succès.");
        })
        .catch(err => {
            console.error(err);
            res.status(500).send("Une erreur s'est produite lors de la suppression du client.");
        });
});


router.delete("/deleteFormateur/:idformateur",(req,res)=>{
    Formateur.findOneAndDelete(
    { _id: req.params.idformateur }
)
.then(deletedformateur => {
    if (deletedformateur) {
        res.send("formateur supprimé avec succès : ");
    } else {
        res.send("Aucun formateur trouvé avec cet id.");
    }
})
.catch(err => {
    res.send(err);
});});

//get publications 
router.get("/adminGetPostes",async (req,res)=>{
    try {
      // Utilisez idfreelancer avec la même casse que dans l'URL
        const postes = await PosteFreelancer.find(); // Utilisez idFreelancer avec la même casse que dans le schéma MongoDB

        if (postes.length > 0) {
            res.status(200).json(postes);
        } else {
            res.status(404).send("Aucun poste trouvé ");
        }
    } catch (error) {
        console.error("Erreur lors de la lecture des projets:", error);
        res.status(500).send("Une erreur s'est produite lors de la lecture des postes");
    }


});
router.get("/adminGetProjetsClient",async (req,res)=>{
    try {
      // Utilisez idfreelancer avec la même casse que dans l'URL
        const postes = await ProjetClient.find(); // Utilisez idFreelancer avec la même casse que dans le schéma MongoDB

        if (postes.length > 0) {
            res.status(200).json(postes);
        } else {
            res.status(404).send("Aucun projet trouvé ");
        }
    } catch (error) {
        console.error("Erreur lors de la lecture des projets:", error);
        res.status(500).send("Une erreur s'est produite lors de la lecture des postes");
    }


});

router.get("/adminGetAnnonces",async (req,res)=>{
    try {
      // Utilisez idfreelancer avec la même casse que dans l'URL
        const postes = await Annonce.find(); // Utilisez idFreelancer avec la même casse que dans le schéma MongoDB

        if (postes.length > 0) {
            res.status(200).json(postes);
        } else {
            res.status(404).send("Aucun projet trouvé ");
        }
    } catch (error) {
        console.error("Erreur lors de la lecture des projets:", error);
        res.status(500).send("Une erreur s'est produite lors de la lecture des postes");
    }


});

router.get("/adminGetPostesClient",async (req,res)=>{
    try {
      // Utilisez idfreelancer avec la même casse que dans l'URL
        const postes = await PosteClient.find(); // Utilisez idFreelancer avec la même casse que dans le schéma MongoDB

        if (postes.length > 0) {
            res.status(200).json(postes);
        } else {
            res.status(404).send("Aucun projet trouvé ");
        }
    } catch (error) {
        console.error("Erreur lors de la lecture des projets:", error);
        res.status(500).send("Une erreur s'est produite lors de la lecture des postes");
    }


});

//delete publications
router.delete("/adminDeletePoste/:id", async (req, res) => {
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
router.delete("/adminDeleteAnnonce/:id", async (req, res) => {
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
router.delete("/adminDeleteProjet/:id", async (req, res) => {
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
router.delete("/adminDeletePosteClient/:id", async (req, res) => {
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

module.exports=router;