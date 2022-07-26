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


//AUTHENTICATION VERIFY
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        res.status(401).send({message:'unAuthorization'});
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
            res.status(403),send({message:'Forbidden'});
        }
        req.decoded = decoded;
        next();
    })
};



//MONGODB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wz62svu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){

    try{
        await client.connect();
        const plantCollections = client.db('product').collection('items');
        
        //GET PLANTS INVENTORY ITEM
        app.get('/plants', verifyJWT, async(req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const email = req.query.email;
            const decodedEmail = req.decoded.email;



            const query = {};
            const cursor = plantCollections.find(query);

            if(email === decodedEmail){
                let plants;
                if(page || size){
                    plants = await cursor.skip(page*size).limit(size).toArray();
                }
                else{
                    plants = await cursor.toArray();
                }
    
                res.send(plants);
            }
            else{
                res.status(401).send({message: 'unAuthorization'})
            }

           
        });

        //GET PLANTS COUNT
        app.get('/plantCount', async(req, res)=> {
            const count = await plantCollections.estimatedDocumentCount();
            res.send({count});
        });

        //GET EMAIL QUERY PLANTS INVENTORY ITEM
        app.get('/allPlants', verifyJWT, async(req, res) => {

           const decodeEmail = req.decoded.email;
            const email = req.query.email;
            if(email === decodeEmail){
                const query = {email:email};
                const cursor = plantCollections.find(query);
                const plants = await cursor.toArray();
                res.send(plants);
            }
            else{
                res.status(401).send({message: 'unAuthorization'})
            }
            
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

        //PLANT DELETE 
        app.delete('/delete-plant/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const plant =  await plantCollections.deleteOne(query);
            res.send(plant);
        });
        
        //PLANT QUANTITY UPDATE
        app.put('/plant/:id', async(req, res)=> {

            const id = req.params.id;
            const updateQuantity = req.body;

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

        //AUTHENTICATION
       app.post('/login', async(req, res)=>{
            const email = req.body.email;
    
            if(email){
                const accessToken = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn : '1d'});
                res.status(200).send({accessToken:accessToken});
            }
            else{
                res.status(401).send({message: 'unAuthorization'});
            }
       });



    
    }
    finally{}
}
run().catch(console.dir);


app.listen(port, ()=> {
    console.log('Listing to port', port);
});

