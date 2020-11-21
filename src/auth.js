const md5 = require('md5');
const cookieParser = require('cookie-parser');
const User = require('./Schema').User;
const Profile = require('./Schema').Profile;

const mySecretMessage = "comp531finalsleepyzzzzzzbackend";
const cookieKey = 'sid';
let sessionUser = {};
let userObj = {};

const getHash = (salt, password) => {
    return md5(salt + password);
}

const isLoggedIn = (req, res, next) => {
    let id = req.cookies[cookieKey];
    if (!id) {
        return res.status(401).send('No session key for cookie key');
    }
    let user = sessionUser[id];
    if (user) {
        req.user = user;
        next();
    }
    else {
        return res.status(401).send('No user login!');
    }
}

const register = (req, res) => {
    let username = req.body.username;
    let email = req.body.email;
    let dob = req.body.dob;
    let zipcode = req.body.zipcode;
    let password = req.body.password;

    if (!username || !email || !dob || !zipcode || !password) {
        return res.status(400).send('Username, email, dob, zipcode or password is missing');
    }

    const query = User.find({ username: username });
    query.exec(function (err, user) {
        if (err) {
            return console.error(err);
        }
        if (!user || user.length === 0) {
            let salt = username + new Date().getTime();
            let hash = getHash(salt, password);

            new User({ username, salt, hash }).save(function (err) {
                if (err) {
                    return console.error(err);
                }
            });
            new Profile({ username, email, dob, zipcode }).save(function (err) {
                if (err) {
                    return console.error(err);
                }
            });
            let msg = { result: 'success', username: username };
            return res.status(200).send(msg);
        }
        return res.status(401).send('The username has already been registered');
    });
}

const login = (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    if (!username || !password) {
        return res.status(400).send('Username or password is missing');
    }

    const query = User.find({ username: username });
    query.exec(function (err, user) {
        if (err) {
            return hanldleError(err);
        }
        if (!user || user.length === 0) {
            return res.status(401).send('This user has not registered');
        }
        userObj = { username: user[0].username, salt: user[0].salt, hash: user[0].hash };
        let hash = md5(userObj.salt + password);
        if (hash === userObj.hash) {
            let sessionKey = md5(mySecretMessage + new Date().getTime() + userObj.username);
            sessionUser[sessionKey] = userObj;
            res.cookie(cookieKey, sessionKey, { maxAge: 3600 * 1000, httpOnly: true, sameSite: 'None', secure: true });
            // res.cookie(cookieKey, sessionKey, { maxAge: 3600 * 1000, httpOnly: true })
            let msg = { username: username, result: 'success' };
            res.status(200).send(msg);
        }
        else {
            return res.status(401).send('Password is incorrect');
        }
    });
}

const logout = (req, res) => {
    userObj = {};
    sessionUser = {};
    res.cookie(cookieKey, null, { maxAge: -1, httpOnly: true });
    res.clearCookie(cookieKey, "", { expires: new Date(0) });
    res.status(200).send('OK');
}

const putPassword = (req, res) => {
    let username = req.user.username;
    let password = req.body.password;
    if (!password) {
        return res.state(400).send('Password is missing');
    }
    let salt = username + new Date().getTime();
    let hash = getHash(salt, password);
    let pwd = { salt: salt, hash: hash };
    User.findOneAndUpdate(
        { username: username },
        { $set: pwd },
        { new: true, upsert: true },
        function (err, user) {
            if (err) {
                return console.error(err);
            }
            let msg = { username: username, result: 'success' };
            res.status(200).send(msg);
        });
}

module.exports = (app) => {
    app.use(cookieParser());
    app.post('/register', register);
    app.post('/login', login);
    app.use(isLoggedIn);
    app.put('/logout', logout);
    app.put('/password', putPassword);
}