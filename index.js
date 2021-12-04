
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 5000;

//middleware
app.use(cors());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
})

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

        io.on('connection', (socket) => {
            socket.emit('connection', null);

            socket.on('calculate', async (data) => {
                //if result is fraction value then set precision on it
                try {
                    let calculatedResult = ((calculateInput(data.input)) % 1) ?
                        calculateInput(data.input).toPrecision(3) : calculateInput(data.input);

                    const cursor = resultsCollection.find({});
                    const results = await cursor.toArray();
                    let result;

                    if (results.length > 0) {
                        const filter = { _id: results[0]._id };
                        const updateDoc = {
                            $set: {
                                allResults: [...results[0].allResults,
                                { title: data.title, result: calculatedResult, input: data.input }
                                ]
                            }
                        };
                        result = await resultsCollection.updateOne(filter, updateDoc);
                    }
                    else {
                        result = await resultsCollection.insertOne({
                            allResults:
                                [{ title: data.title, result: calculatedResult, input: data.input }]
                        });
                    }
                    setTimeout(function () {
                        io.emit('result', { status: 'ok', result: { title: data.title, result: calculatedResult, input: data.input } });
                    }, 15000);
                }
                catch {
                    io.emit('result', { status: 'error', result: { error: 'Invalid Expression' } })
                }
            });

            socket.on('updateResults', async (data) => {
                const cursor = resultsCollection.find({});
                const results = await cursor.toArray();
                let result;
                const filter = { _id: results[0]._id };
                const updateDoc = { $set: { allResults: data.results } };
                result = await resultsCollection.updateOne(filter, updateDoc);
                io.emit('allResults', await resultsCollection.find({}).toArray());
            });
        });

    } finally {
        //
    }
}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('running app')
});

http.listen(port, () => {
    console.log(`listening on *:${port}`);
});

function calculateInput(fn) {
    return new Function('return ' + fn)();
}

