const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const connectionString = 'mongodb+srv://dbccc:1711@ctest.s3vxw.mongodb.net/Social?retryWrites=true&w=majority';
const corsOptions = { origin: 'http://localhost:8080', credentials: true, methods: "GET, POST, PUT, DELETE" };
// const corsOptions = { origin: 'https://yz166-hw6-frontend.surge.sh', credentials: true, methods: "GET, POST, PUT, DELETE" };

const auth = require('./src/auth');
const profile = require('./src/profile');
const following = require('./src/following');
const article = require('./src/articles');

mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true });

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors(corsOptions));
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
