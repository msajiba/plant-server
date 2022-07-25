const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

const port = process.env.PORT || 5000;

//MIDDLE_WARE
app.use(cors());
app.use(express.json());


//MONGODB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wz62svu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){

    try{
        await client.connect();
        const plantCollections = client.db('product').collection('items');
        
        //GET PLANTS INVENTORY ITEM
        app.get('/plants', async(req, res) => {
            const query = {};
            const cursor = plantCollections.find(query);
            const plants = await cursor.toArray();
            res.send(plants);
        });

        //GET SINGLE PLANT INVENTORY ITEM
        app.get('/plant/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const plant = await plantCollections.findOne(query);
            res.send(plant);
        });

        // ALL PLANT POST 
        app.post('/plant', async(req, res) =>{
            const item = req.body.items;
            const result = await plantCollections.insertOne(item);
            res.send(result);
        });
        
        //PLANT QUANTITY UPDATE
        app.put('/plant/:id', async(req, res)=> {
            const id = req.params.id;
            const updateQuantity = req.body;

            console.log("quantity",updateQuantity);

            const filter = {_id:ObjectId(id)};
            const options = {upsert : true};

            const updateDoc = {
                $set : {
                    quantity : updateQuantity.newQuantity
                }
            };

            const updateFinalQuantity = await plantCollections.updateOne(filter, updateDoc, options);

            const query = {_id: ObjectId(id)};
            const plant=  await plantCollections.findOne(query);
            res.send({updateFinalQuantity,plant});

        });
    
    }
    finally{}
}
run().catch(console.dir);




app.get('/', (req, res)=> {
    res.send('server ok');
});

app.listen(port, ()=> {
    console.log('Listing to port', port);
});

