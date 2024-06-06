const express = require('express');
const mongoose = require('mongoose');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const PORT = 4050;


dotenv.config();
app.use(cors());
app.use(express.json());
const pinroute = require('./routes/pinnedLocation');
const userroute = require('./routes/userController');
const pathRoute = require('./routes/pathRoute');
const MONGODB_URL="mongodb://localhost:27017/MapProjectDatabase";


app.use("/userController",userroute);
app.use("/pinnedLocation",pinroute);
app.use("/pathroute",pathRoute);

mongoose.connect(MONGODB_URL).then(() =>{
    console.log("Connection done");
}).catch((err)=>{console.log(err)});

app.listen(PORT,()=>{
    console.log("listening at port: ",PORT);
})