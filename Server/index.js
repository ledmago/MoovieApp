const express = require("express");
// const Port = process.env.Port || 1337
const Port = 8000;
const connectDB = require("./consts/dbconnection");
const app = express();
const config = require("./config.json");
var jwt = require("jsonwebtoken");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
const server = require("http").Server(app);
const axios = require("axios");
app.use(cookieParser());
connectDB();
app.use(express.json({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));


app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
// ---------------------------------------- //
const path = require("path");
app.use(express.static(path.join(__dirname, "build")));
app.use((req, res, next) => {
  req.body = { ...req.body, ...req.query };
  if (req.body.token) {
    req.cookies.token = req.body.token;
  }
  next();
});

global.SOCKET_STATE = null; // diğer dosyalardan socket'e ulaşmak için
global.socketUsers = [];
global.exchangeRate = null;


app.use(express.static('./'))
app.use("/api/auth", require("./routes/auth"));
app.use("/api/recommend", require("./routes/recommend"));


// const socketInit = require("./socket/index.js");
// app.get("/", function (req, res) {
//   // res.sendFile(__dirname + "/Socket/html/index.html");
//   res.send("cuzdanapp")
// });



server.listen(Port, () => console.log("Server started"));