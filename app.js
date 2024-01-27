const express = require('express')
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const cors=require("cors")
const cookieParser = require('cookie-parser')
const app = express()
dotenv.config()

const PORT = process.env.PORT || 4014;
app.set(express.static('public'))
app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin:["http://localhost:5173"],
  credentials:true,
}
))

app.use('/profileimages',express.static('public/assets'))
app.use("/", require("./routers/userRouter"))
app.use("/admin",require('./routers/adminRouter'))
mongoose
  .connect(process.env.DB_URL, {

  })
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error);
  });
app.listen(PORT, (error) => console.log("connected to the port"));
