//jshint esversion:6
const express = require("express");
const app = express();
const cors = require("cors");
const path = require('path');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const FreelancersRoutes = require("./routes/freelancers");
const FormateursRoutes = require("./routes/formateurs");
const ClientsRoutes = require("./routes/clients");
const AdminRoutes = require("./routes/admin");

app.use(cors()); // Apply CORS middleware first

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

app.use(FreelancersRoutes);
app.use(ClientsRoutes);
app.use(FormateursRoutes);
app.use(AdminRoutes);

mongoose.connect("mongodb://localhost:27017/projetpfedb", { useNewUrlParser: true, useUnifiedTopology: true });

app.listen(5000, function () {
    console.log("server is running");
});
