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



const app = express();

// This is to prettify the json that are sent back in the REST services
app.set('json spaces', 3);

// This enables all the CORS request
app.use(cors());

//Log in the console incoming requests using morgan
app.use(morgan("short"));

// This is used to parse json received in the requests
app.use(express.json);

app.param('collectionName', function(req, res, next, collectionName) {
  req.collection = db.collection(collectionName);
  return next();
});

app.get('/collections/:collectionName', function(req, res, next){
  req.collection.find({}).toArray(function(err, results) {
    if(err) {
      return next(err);
    }
    res.send(results);
  })
});




app.use(function(req, res, next){
  console.log("Incoming request: " + req.url);
  next();
});

