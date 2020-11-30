const md5 = require('md5');
const cookieParser = require('cookie-parser');
// const redis = require('redis').createClient('redis://h:pd4d2fe14cd32c8be1c2f67a2e58aab33de6a860ee73395f609cc45e3a7479d08@ec2-3-211-169-9.compute-1.amazonaws.com:8679');
const session = require('express-session');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;

const User = require('./Schema').User;
const Profile = require('./Schema').Profile;

const mySecretMessage = "comp531finalsleepyzzzzzzbackend";
const cookieKey = 'sid';
let sessionUser = {};
let userObj = {};

// 3rd Party
// app.use(session({
//     secret: mySecretMessage,
//     resave: true,
//     saveUninitialized: true
// }));

// app.use(passport.initialize());
// app.use(passport.session());

// passport.serializeUser(function (user, done) {
//     done(null, user);
// });

// passport.deserializeUser(function (user, done) {
//     done(null, user);
// });

// passport.use(new FacebookStrategy({
//     clientID: '1004131556774775',
//     clientSecret: 'f3045edcd4dd7bc7b2fa8d93233acb21',
//     callbackURL: "https://localhost:3000/auth/facebook/callback"
// },
//     function (accessToken, refreshToken, profile, done) {
//         let user = {
//             'id': profile.id,
//             'token': accessToken
//         };
//         return done(null, profile);
//     })
// );

// app.get('/auth/facebook', passport.authenticate('facebook'));

// app.get('/auth/facebook/callback',
//     passport.authenticate('facebook', {
//         successRedirect: 'https://localhost:3000/main',
//         failureRedirect: '/'
//     }));

const getHash = (salt, password) => {
    return md5(salt + password);
}

const isLoggedIn = (req, res, next) => {
    let sid = req.cookies[cookieKey];
    if (!sid) {
        return res.status(401).send('No session key for cookie key');
    }
    let user = sessionUser[sid];
    if (user) {
        req.user = user;
        next();
    }
    else {
        return res.status(401).send('No user login!');
    }
    // redis.hgetall(sid, function (err, userObj) {
    //     if (err) {
    //         throw err;
    //     }
    //     if (userObj) {
    //         req.user = userObj
    //         next()
    //     }
    //     else {
    //         return res.status(401).send('No user login!');
    //     }
    // })
}

const register = (req, res) => {
    let username = req.body.username;
    let displayname = req.body.displayname;
    let email = req.body.email;
    let dob = req.body.dob;
    let zipcode = req.body.zipcode;
    let phone = req.body.phone;
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
            new Profile({ username, displayname, email, dob, zipcode, phone }).save(function (err) {
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
            // redis.hmset(sessionKey, userObj)
            // res.cookie(cookieKey, sessionKey, { maxAge: 3600 * 1000, httpOnly: true, sameSite: 'None', secure: true });
            res.cookie(cookieKey, sessionKey, { maxAge: 3600 * 1000, httpOnly: true });
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