const md5 = require('md5');
const cookieParser = require('cookie-parser');
const redis = require('redis').createClient(process.env.REDIS_URI);
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const User = require('./Schema').User;
const Profile = require('./Schema').Profile;
const Article = require('./Schema').Article;

const mySecretMessage = "comp531finalsleepyzzzzzzbackend";
const cookieKey = 'sid';
let sessionUser = {};
let userObj = {};

// const server = 'http://localhost:3000';
// const client = 'http://localhost:8080';
const server = 'https://yz166-final-backend.herokuapp.com';
const client = 'https://yz166-final-frontend.surge.sh';
const sub_pwd = '111';


const getHash = (salt, password) => {
    return md5(salt + password);
}

const generate_session = (res, user, username) => {
    let sessionKey = md5(mySecretMessage + new Date().getTime() + username);
    sessionUser[sessionKey] = user;
    // redis.hmset(sessionKey, user);
    res.cookie(cookieKey, sessionKey, { maxAge: 3600 * 1000, httpOnly: true, sameSite: 'None', secure: true });
    // res.cookie(cookieKey, sessionKey, { maxAge: 3600 * 1000, httpOnly: true });
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

            new User({ username: username, salt: salt, hash: hash }).save(function (err) {
                if (err) {
                    return console.error(err);
                }
            });
            new Profile({
                username: username,
                displayname: displayname,
                email: email,
                dob: dob,
                zipcode: zipcode,
                phone: phone
            }).save(function (err) {
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
            generate_session(res, userObj, userObj.username);
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
    User.findOne({ googleId: id }).exec(function (err, user) {
        done(null, user)
    })
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
    done(null, profile);
}));

const success = (req, res) => {
    let profile = req.user;
    let googleId = profile.id;
    let username = profile.displayName;
    User.find({ googleId: googleId }).exec(function (err, user) {
        if (err) {
            return console.error(err);
        }
        if (!user || user.length === 0) {
            let displayname = profile.displayname;
            let email = profile.emails[0].value;
            let dob = new Date(1997, 12, 24);
            let zipcode = 77251;
            let avatar = profile.photos[0].value;
            new Profile({
                username: username,
                displayname: displayname,
                email: email,
                dob: dob,
                zipcode: zipcode,
                avatar: avatar
            }).save(function (err) {
                if (err) {
                    return console.error(err);
                }

            });
            let password = sub_pwd;
            let salt = username + new Date().getTime();
            let hash = getHash(salt, password);
            let provider = profile.provider;
            let third_party = [{ id: googleId, provider: provider }];
            new User({
                username: username,
                salt: salt,
                hash: hash,
                googleId: googleId,
                third_party: third_party
            }).save().then((newUser) => {
                generate_session(res, newUser, username);
                res.redirect(client + '/main');
            });
        }
        else {
            generate_session(res, user[0], username);
            res.redirect(client + '/main');
        }
    });
}
// ==============================================================================

const logout = (req, res) => {
    let sid = req.cookies[cookieKey];
    userObj = {};
    sessionUser = {};
    // redis.del(sid);
    // res.cookie(cookieKey, null, { maxAge: -1, httpOnly: true });
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

const updateLinkFollow = (link_username, username, google_user) => {
    Profile.find({ username: link_username }).exec(function (err, profile) {
        if (err) {
            return console.error(err);
        }
        if (!profile || profile.length === 0) {
            return res.status(401).send('The user does not exist');
        }
        let link_follow = profile[0].following;
        Profile.find({ username: username }).exec(function (err1, profile1) {
            if (err1) {
                return console.error(err1);
            }
            if (!profile1 || profile1.length === 0) {
                return res.status(401).send('The user does not exist');
            }
            let cur_follow = profile1[0].following;
            let tmp_link_follow = new Set(cur_follow.concat(link_follow));
            let add_link_follow = Array.from(tmp_link_follow);
            Profile.findOneAndUpdate(
                { username: username },
                { $set: { following: add_link_follow } },
                { new: true, upsert: true },
                function (err, user) {
                    if (err) {
                        return console.error(err);
                    }
                    if (!google_user) {
                        Profile.findOneAndUpdate(
                            { username: link_username },
                            { $set: { following: [] } },
                            { new: true, upsert: true },
                            function (err1, user1) {
                                if (err1) {
                                    return console.error(err1);
                                }
                            });
                    }
                });
        })
    })
}

const addLink = (req, res) => {
    let google_user = req.user.googleId ? true : false;
    let username = req.body.username;
    let password = req.body.password;
    if (!username || !password) {
        return res.status(400).send('Username or password is missing');
    }
    if (username === req.user.username) {
        return res.status(401).send('Cannot link yourself');
    }
    User.find({ username: username }).exec(function (err, user) {
        if (err) {
            return console.error(err);
        }
        if (!user || user.length === 0) {
            return res.status(401).send('The user has not registered');
        }
        if (google_user) {
            let salt = user[0].salt;
            let hash = md5(salt + password);
            if (hash === user[0].hash) {
                let google_username = req.user.username;
                let linked = { google: google_username };
                User.findOneAndUpdate(
                    { username: username },
                    { $set: { auth: linked } },
                    { new: true, upsert: true },
                    function (err, user1) {
                        if (err) {
                            return console.error(err);
                        }
                        updateLinkFollow(google_username, username, google_user);
                        let msg = { username: username, auth: user1.auth };
                        res.status(200).send(msg);
                    });
            }
            else {
                return res.status(401).send('Password is not correct');
            }
        }
        else {
            let linked = { google: username };
            User.findOneAndUpdate(
                { username: req.user.username },
                { $addToSet: { auth: linked } },
                { new: true, upsert: true },
                function (err1, user1) {
                    if (err1) {
                        return console.error(err1);
                    }
                    updateLinkFollow(username, req.user.username, google_user);
                    let msg = { username: req.user.username, auth: user1.auth };
                    res.status(200).send(msg);
                });
        }
    })
}

const unLink = (req, res) => {
    let username = req.user.username;
    let unlink_user = req.params.user;
    let provider = 'google';
    if (!username) {
        return res.status(400).send('Username is missing');
    }
    User.find({ username: username }).exec(function (err, user) {
        if (err) {
            return console.error(err);
        }
        if (!user || user.length === 0) {
            return res.status(401).send('No such user');
        }
        if (user[0].googleId) {
            return res.status(401).send('Only Site user can unlink an account');
        }
        let auth = user[0].auth;
        let unlinked = { google: unlink_user };
        let exist = false;
        for (let key in auth) {
            if (auth[key]['google'] === unlink_user) {
                exist = true;
                break;
            }
        }
        if (exist) {
            User.findOneAndUpdate(
                { username: username },
                { $set: { auth: [] } },
                { new: true, upsert: true, safe: true },
                function (err, user) {
                    if (err) {
                        return console.error(err);
                    }
                    let msg = { username: username, auth: user.auth };
                    return res.status(200).send(msg);
                });
        }
        else {
            return res.status(401).send('You are not linking this account');
        }
    })
}

const linkAccountUpdate = (req, res) => {
    let username = req.user.username;
    User.find({ username: username }).exec(function (err, user) {
        if (err) {
            return console.error(err);
        }
        if (!user || user.length === 0) {
            return res.status(401).send('No such user');
        }
        let auth = user[0].auth;
        if (auth.length !== 0) {
            let linked = auth[0]['google'];
            Profile.find({ username: linked }).exec(function (err1, user1) {
                if (err1) {
                    return console.error(err1);
                }
                if (!user1 || user1.length === 0) {
                    return res.status(401).send('No such user');
                }
                let follow = user1[0].following;
                if (follow.length > 0) {
                    Profile.findOneAndUpdate(
                        { username: linked },
                        { $set: { following: [] } },
                        { new: true, upsert: true },
                        function (err2, user2) {
                            if (err2) {
                                return console.error(err2);
                            }
                            let msg = { username: username, result: 'update link account succeess' };
                            res.status(200).send(msg);
                        });
                }
            })
        }
    })
}

const getLink = (req, res) => {
    let username = req.user.username;
    User.find({ username: username }).exec(function (err, user) {
        if (err) {
            return console.error(err);
        }
        if (!user || user.length === 0) {
            return res.status(401).send('No such user');
        }
        if (user[0].googleId !== '') {
            User.find({}, ['username', 'auth'], function (err1, users) {
                if (err1) {
                    return console.error(err1);
                }
                if (!users || users.length === 0) {
                    return res.status(400).send('No linked account');
                }
                for (let i = 0; i < users.length; i++) {
                    if (users[i].auth.length > 0 && users[i].auth[0]['google'] === username) {
                        let msg = { username: users[i].username, auth: users[i].auth };
                        res.status(200).send(msg);
                    }
                }
            })
        }
        else {
            let auth = user[0].auth;
            let msg = { username: username, auth: auth };
            res.status(200).send(msg);
        }
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

    app.get('/google/callback', passport.authenticate('google', { failureRedirect: client }), success);

    app.post('/register', register);
    app.post('/login', login);
    app.use(isLoggedIn);
    app.put('/logout', logout);
    app.put('/password', putPassword);
    app.post('/link', addLink);
    app.put('/link', linkAccountUpdate);
    app.get('/unlink/:user', unLink);
    app.get('/link', getLink);
}