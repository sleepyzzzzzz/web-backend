const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const connectionString = 'mongodb+srv://dbccc:1711@ctest.s3vxw.mongodb.net/Testing?retryWrites=true&w=majority';
const corsOptions = { origin: 'http://localhost:8080', credentials: true, methods: "GET, POST, PUT, DELETE" };
// const corsOptions = { origin: 'https://yz166-final-frontend.surge.sh', credentials: true, methods: "GET, POST, PUT, DELETE" };

const auth = require('./src/auth');
const profile = require('./src/profile');
const following = require('./src/following');
const article = require('./src/articles');

mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true }).then(con => {
}).catch(err => {
    return console.error(err);
});

const app = express();
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

auth(app);
profile(app);
following(app);
article(app);

// Get the port from the environment, i.e., Heroku sets it
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    const addr = server.address();
    console.log(`Server listening at http://${addr.address}:${addr.port}`)
});
