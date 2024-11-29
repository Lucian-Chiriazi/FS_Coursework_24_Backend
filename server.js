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

const {MongoClient, ServerApiVersion, ObjectId} = require("mongodb");
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

// Create Express app
const app = express();
app.set('json spaces', 3);
app.use(cors());
app.use(morgan("short"));
app.use(express.json());

let db;

// Initialize database connection before starting the server
async function initializeDatabase() {
    try {
        await client.connect();
        db = client.db(dbName);
        console.log("Connected to MongoDB");
        
        // Start the server after database connection is established
        const PORT = 3000;
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    }
}

// Initialize collection parameter middleware
app.param("collectionName", function (req, res, next, collectionName) {
    if (!db) {
        console.error("Database connection is not initialized");
        return;
    }
    req.collection = db.collection(collectionName);
    return next();
});

app.get('/', function(req, res) { 
    res.send('Select a collection!');
});

// Route to get products
app.get("/collections/:collectionName", async (req, res, next) => {
    try {
        const results = await req.collection.find({}).toArray();
        res.json(results);
    } catch (err) {
        console.error("Error fetching data:", err);
        next(err);
    }
});

// Route to insert order
app.post("/collections/order", async (req, res, next) => {
  try {
      const order = req.body;

      // Validate the order data
      if (!order.name || !order.phone || !order.cart || order.cart.length === 0) {
          return res.send({ error: "Invalid order data" });
      }

      // Insert the order into the 'order' collection
      const result = await db.collection("order").insertOne(order);

      res.send({ message: "Order placed successfully", orderId: result.insertedId });
  } catch (err) {
      console.error("Error saving order:", err);
      next(err);
  }
});

// Route to update a product
app.put("/collections/lessons/:id", async (req, res, next) => {
    try {

        console.log("Received PUT request for ID:", req.params.id);
        console.log("Update Data:", req.body);


        const lessonId = req.params.id; // Get the product ID from the URL parameter
        const updateData = req.body;   // Get the update data from the request body

        // Validate the incoming data
        if (!lessonId) {
            return res.status(400).send({ error: "Invalid input: No data to update or missing product ID" });
        }

        // Use the products collection and update the document
        const result = await db.collection("products").updateOne(
            { _id: new ObjectId(lessonId) }, // Find the document by ID
            { $set: updateData }             // Update the specified fields
        );

        // // Check if any document was modified
        // if (result.matchedCount === 0) {
        //     return res.status(404).send({ error: "Lesson not found" });
        // }

        res.send({ message: "Lesson updated successfully" });
    } catch (err) {
        console.error("Error updating lesson:", err);
        next(err); // Pass the error to the Express error handler
    }
});

// Initialize the database and start the server
initializeDatabase().catch(console.error);