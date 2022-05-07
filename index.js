const express = require("express");
const app = express()
var jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const cors = require('cors');
const res = require("express/lib/response");
app.use(cors())
app.use(express.json())

function VerifyJot(req, res, next) {
    const AuthHeader = req.headers.authorization

    if (!AuthHeader) {
        return res.status(401).send({ message: "unauthorized access" });
    }
    const token = AuthHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: "forbidden access" })
        }
        req.decoded = decoded;
    })

    next()

}




const uri = `mongodb+srv://inventoryManagementDb:${process.env.PASS}@cluster0.074ez.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const InventoryCollection = client.db("inventoryManagementDb").collection("Inventory");

        app.post('/login', (req, res) => {
            const user = req.body
            var accesToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "1d"
            });

            res.send({ accesToken })
        })



        app.get('/limitedInventory', async (req, res) => {
            const query = {};
            const cursor = InventoryCollection.find(query).limit(6);
            const result = await cursor.toArray()
            res.send(result)
        })

        //    all inventory
        app.get('/inventory', async (req, res) => {
            const query = {};
            const cursor = InventoryCollection.find(query);
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/myinventory', VerifyJot, async (req, res) => {
            const decodedEmail = req.decoded.email
            const email = req.query.email
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = InventoryCollection.find(query);
                const result = await cursor.toArray()
                res.send(result)
            }
            else {
                res.status(403).send({ message: "forbidden access" })
            }

        })
        // one inventory base on id
        app.get('/inventory/:id', async (req, res) => {
            const id = req.params.id
            console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await InventoryCollection.findOne(query);
            res.send(result)
        })
        //add invetory one
        app.post('/addInventory', async (req, res) => {
            const data = req.body
            const result = await InventoryCollection.insertOne(data);
            res.send(result)
        })
        // delete inventory base on id
        app.delete('/deleteInventory/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) };
            const result = await InventoryCollection.deleteOne(query);
            res.send(result)
        })
        //   update quantity
        app.put('/updateQuantity/:id', async (req, res) => {
            const id = req.params.id
            const data = req.body
            const newQuantity = data.Quantity
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    Quantity: newQuantity,
                },
            };
            const result = await InventoryCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        
    } finally {
    }
}
run().catch(console.dir);

app.get('/', (req, res) => { res.send('hey bro i am here') })
app.listen(port, () => { console.log('listen to port', port) })