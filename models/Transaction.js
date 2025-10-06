const mongoose=require("mongoose");
const transactionSchema = new mongoose.Schema({
   id_inscrit:String,
   date_transaction:Date,
   id_formation:String,
   recu:String,
   etatpayment:Boolean
   });
   const Transaction = mongoose.model("Transaction",transactionSchema);
module.exports= Transaction;