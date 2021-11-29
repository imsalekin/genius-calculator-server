const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//skipped using env variables here
const uri = `mongodb+srv://mongodb02:VwsSjJNEcX1rQH5x@cluster0.fiuyj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const db = client.db('genius-calculator');
        const resultsCollection = db.collection('results');

        app.get('/results', async (req, res) => {
            const cursor = resultsCollection.find({});
            const results = await cursor.toArray();
            res.send(results[0]);
        });

        app.post('/results', async (req, res) => {
            const cursor = resultsCollection.find({});
            const results = await cursor.toArray();
            let result;

            if (results.length > 0) {
                const filter = { _id: results[0]._id };
                const updateDoc = { $set: { allResults: [...results[0].allResults, req.body.result] } };
                result = await resultsCollection.updateOne(filter, updateDoc);
            }
            else
                result = await resultsCollection.insertOne({ allResults: [req.body.result] });

            res.json(result)
        })
        app.put('/results', async (req, res) => {
            const cursor = resultsCollection.find({});
            const results = await cursor.toArray();
            let result;
            const filter = { _id: results[0]._id };
            const updateDoc = { $set: { allResults: req.body.results } };
            result = await resultsCollection.updateOne(filter, updateDoc);
            res.json(result)
        })

    } finally {
        //
    }
}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('running app')
});

app.listen(port, () => {
    console.log('running on port ', port);
});