const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

// MongoDB configuration
let propertiesReader = require("properties-reader");
let propertiesPath = path.resolve(__dirname, "conf/db.properties");
let properties = propertiesReader(propertiesPath);

let dbPrefix = properties.get("db.prefix");
let dbUsername = encodeURIComponent(properties.get("db.user"));
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");

const uri = dbPrefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;

// Connecting to MongoDB with Stable API. In this way we do not use deprecated methods
const {MongoClient, ServerApiVersion, ObjectId} = require("mongodb");
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1});
let db = client.db(dbName);



let app = express();

app.use(cors());
app.set('json spaces', 3);

app.use(function(req, res, next){
  console.log("Incoming request: " + req.url);
  next();
});

