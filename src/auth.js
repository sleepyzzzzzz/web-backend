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

const suc_url = 'https://yz166-final-frontend.surge.sh';

const getHash = (salt, password) => {
    return md5(salt + password);
}

const isLoggedIn = (req, res, next) => {
    let sid = req.cookies[cookieKey];
    if (!sid) {
        return res.status(401).send('No session key for cookie key. Please login');
    }
    let user = sessionUser[sid];
    if (user) {
        req.user = user;
        next();
    }
    else {
        return res.status(401).send('No user login!');
    }
    // redis.hgetall(sid, function (err, user) {
    //     if (err) {
    //         throw err;
    //     }
    //     if (user) {
    //         req.user = user
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
            res.cookie(cookieKey, sessionKey, { maxAge: 3600 * 1000, httpOnly: true, sameSite: 'None', secure: true });
            // res.cookie(cookieKey, sessionKey, { maxAge: 3600 * 1000, httpOnly: true });
            // redis.hmset(sessionKey, userObj);
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

passport.deserializeUser(function (id, done) {
    User.findOne({ authId: id }).exec(function (err, user) {
        done(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    function (accessToken, refreshToken, profile, done) {
        return done(null, profile);
    }
));

const google_success = (req, res) => {
    let profile = req.user;
    console.log(profile);
    User.findOne({ 'third_party.provider': profile.provider, 'third_party.id': profile.id }).exec(function (err, user) {
        if (err) {
            return res.redirect(suc_url);
        }
        if (user) {
            let sessionKey = md5(mySecretMessage + new Date().getTime() + userObj.username);
            sessionUser[sessionKey] = userObj;
            // redis.hmset(sessionKey, userObj)
            res.cookie(cookieKey, sessionKey, { maxAge: 3600 * 1000, httpOnly: true, sameSite: 'None', secure: true });
            // res.cookie(cookieKey, sessionKey, { maxAge: 3600 * 1000, httpOnly: true });
            return res.redirect(suc_url);
        }
        console.log('in');
        console.log(profile);
        User.findOne({ username: profile.displayname }).exec(function (err, user) {
            if (err) {
                return res.redirect(suc_url);
            }
            if (user) {
                return res.redirect(suc_url);
            }
            let [year, month, day] = ['1997', '12', '24'];
            let dob = new Date(year, parseInt(month) - 1, day);
            let username = profile.displayname;
            let displayname = profile.displayname;
            let email = profile.emails[0].value;
            let zipcode = 77251;
            let avatar = profile.photos[0].value;

            let salt = username + new Date().getTime();
            let hash = getHash(salt, profile.id);
            let third = [{ id: profile.id, provider: profile.provider }]

            // new User({ username, salt, hash, third }).save(function (err) {
            //     if (err) {
            //         return res.redirect(suc_url);
            //     }
            //     let sessionKey = md5(mySecretMessage + new Date().getTime() + userObj.username);
            //     sessionUser[sessionKey] = userObj;
            //     // redis.hmset(sessionKey, userObj)
            //     // res.cookie(cookieKey, sessionKey, { maxAge: 3600 * 1000, httpOnly: true, sameSite: 'None', secure: true });
            //     res.cookie(cookieKey, sessionKey, { maxAge: 3600 * 1000, httpOnly: true });
            //     return res.redirect(suc_url);
            // });
            // new Profile({ username, displayname, email, dob, zipcode, avatar }).save(function (err) {
            //     if (err) {
            //         return res.redirect(suc_url);
            //     }
            // });
            return res.redirect(suc_url);
        })
    });
};
// ==============================================================================

const logout = (req, res) => {
    let sid = req.cookies[cookieKey];
    redis.srem('sessions', sid)
    userObj = {};
    sessionUser = {};
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

    app.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), google_success);
    app.get('/success', (req, res) => res.send(userProfile));

    app.post('/register', register);
    app.post('/login', login);
    app.use(isLoggedIn);
    app.put('/logout', logout);
    app.put('/password', putPassword);
}