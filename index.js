const { MongoClient, ServerApiVersion } = require('mongodb');
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
        
        app.get('/plants', async(req, res) => {
            const query = {};
            const cursor = plantCollections.find(query);
            const plants = await cursor.toArray();
            res.send(plants);
        })

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

