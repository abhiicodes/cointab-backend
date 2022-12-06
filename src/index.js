const express = require("express");
const app = express();
const cors = require("cors");
const connect = require("./configs/db");
require("dotenv").config();
const PORT = process.env.PORT || 8080;
const userController = require("./controllers/user.controller");


app.use(express.json());
app.use(cors());



app.use("", userController);


app.listen(PORT, async () => {
  try {
    await connect();
    console.log(`Connected to port ${PORT}`)
  } catch (error) {
    console.log(error)
  }
});


