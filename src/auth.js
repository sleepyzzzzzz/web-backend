const md5 = require('md5');
const cookieParser = require('cookie-parser');
const redis = require('redis').createClient(process.env.REDIS_URI);
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

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
            return console.error(err);
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
            res.cookie(cookieKey, sessionKey, { maxAge: 3600 * 1000, httpOnly: true, sameSite: 'None', secure: true });
            // res.cookie(cookieKey, sessionKey, { maxAge: 3600 * 1000, httpOnly: true });
            let msg = { username: username, result: 'success' };
            res.status(200).send(msg);
        }
        else {
            return res.status(401).send('Password is incorrect');
        }
    });
}

// 3rd Party===================================================================
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (user, done) {
    User.findById(id, function (err, user) {
        done(null, user);
    })
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    function (accessToken, refreshToken, profile, done) {
        let username = profile.username;
        // User.findOne({ username: username }).exec(function (err, user) {
        //     if (err) {
        //         return console.error(err);
        //     }
        //     if (!user || user.length === 0) {
        //         new User({ id: profile.id, username: username }).save(function (err) {
        //             if (err) {
        //                 return console.log(err)
        //             }
        //         })
        //         let displayname = profile.displayName;
        //         let email = profile.email;
        //         let dob = new Date();
        //         let zipcode = null;
        //         new Profile({ username, displayname, email, dob, zipcode }).save(function (err) {
        //             if (err) {
        //                 return console.error(err);
        //             }
        //         });
        //     }
        //     return done(null, profile)
        // })
        // console.log('profile');
        // console.log(profile);
        // return done(null, profile);
        let userProfile = profile;
        return done(null, userProfile);
    }
));
// ==============================================================================

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
    app.use(session({
        secret: mySecretMessage,
        resave: true,
        saveUninitialized: true
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }),
        function (req, res) {
        });

    app.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }),
        function (req, res) {
            res.redirect('/success');
        });
    app.get('/success', (req, res) => res.send(userProfile));

    app.post('/register', register);
    app.post('/login', login);
    app.use(isLoggedIn);
    app.put('/logout', logout);
    app.put('/password', putPassword);
}