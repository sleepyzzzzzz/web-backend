const User = require('./Schema').User;
const Profile = require('./Schema').Profile;
const Article = require('./Schema').Article;
const uploadImage = require('./uploadCloudinary');

const getHeadline = (req, res) => {
    let username = req.params.user ? req.params.user : req.user.username;
    const query = Profile.find({ username: username });
    query.exec(function (err, profile) {
        if (err) {
            return console.error(err);
        }
        if (!profile || profile.length === 0) {
            return res.status(401).send('The user does not exist');
        }
        let headline = profile[0].headline;
        let msg = { username: username, headline: headline };
        res.status(200).send(msg);
    });
}

const putHeadline = (req, res) => {
    let username = req.user.username;
    let headline = req.body.headline;
    if (!headline) {
        return res.state(400).send('Headline is missing');
    }
    Profile.findOneAndUpdate(
        { username: username },
        { $set: { headline: headline } },
        { new: true, upsert: true },
        function (err, profile) {
            if (err) {
                return console.error(err);
            }
            let msg = { username: username, headline: profile.headline };
            res.status(200).send(msg);
        });
}

const getEmail = (req, res) => {
    let username = req.params.user ? req.params.user : req.user.username;
    const query = Profile.find({ username: username });
    query.exec(function (err, profile) {
        if (err) {
            return console.error(err);
        }
        if (!profile || profile.length === 0) {
            return res.status(401).send('The user does not exist');
        }
        let email = profile[0].email;
        let msg = { username: username, email: email };
        res.status(200).send(msg);
    });
}

const putEmail = (req, res) => {
    let username = req.user.username;
    let email = req.body.email;
    if (!email) {
        return res.state(400).send('Email is missing');
    }
    Profile.findOneAndUpdate(
        { username: username },
        { $set: { email: email } },
        { new: true, upsert: true },
        function (err, profile) {
            if (err) {
                return console.error(err);
            }
            let msg = { username: username, email: profile.email };
            res.status(200).send(msg);
        });
}

const getDob = (req, res) => {
    let username = req.params.user ? req.params.user : req.user.username;
    const query = Profile.find({ username: username });
    query.exec(function (err, profile) {
        if (err) {
            return console.error(err);
        }
        if (!profile || profile.length === 0) {
            return res.status(401).send('The user does not exist');
        }
        let dob = profile[0].dob;
        let msg = { username: username, dob: dob };
        res.status(200).send(msg);
    });
}

const getZipcode = (req, res) => {
    let username = req.params.user ? req.params.user : req.user.username;
    const query = Profile.find({ username: username });
    query.exec(function (err, profile) {
        if (err) {
            return console.error(err);
        }
        if (!profile || profile.length === 0) {
            return res.status(401).send('The user does not exist');
        }
        let zipcode = profile[0].zipcode;
        let msg = { username: username, zipcode: zipcode };
        res.status(200).send(msg);
    });
}

const putZipcode = (req, res) => {
    let username = req.user.username;
    let zipcode = req.body.zipcode;
    if (!zipcode) {
        return res.state(400).send('Zipcode is missing');
    }
    Profile.findOneAndUpdate(
        { username: username },
        { $set: { zipcode: zipcode } },
        { new: true, upsert: true },
        function (err, profile) {
            if (err) {
                return console.error(err);
            }
            let msg = { username: username, zipcode: profile.zipcode };
            res.status(200).send(msg);
        });
}

const getPhone = (req, res) => {
    let username = req.params.user ? req.params.user : req.user.username;
    const query = Profile.find({ username: username });
    query.exec(function (err, profile) {
        if (err) {
            return console.error(err);
        }
        if (!profile || profile.length === 0) {
            return res.status(401).send('The user does not exist');
        }
        let phone = profile[0].phone;
        let msg = { username: username, phone: phone };
        res.status(200).send(msg);
    });
}

const putPhone = (req, res) => {
    let username = req.user.username;
    let phone = req.body.phone;
    if (!phone) {
        return res.state(400).send('Phone is missing');
    }
    Profile.findOneAndUpdate(
        { username: username },
        { $set: { phone: phone } },
        { new: true, upsert: true },
        function (err, profile) {
            if (err) {
                return console.error(err);
            }
            let msg = { username: username, phone: profile.phone };
            res.status(200).send(msg);
        });
}

const getAvatar = (req, res) => {
    let username = req.params.user ? req.params.user : req.user.username;
    const query = Profile.find({ username: username });
    query.exec(function (err, profile) {
        if (err) {
            return console.error(err);
        }
        if (!profile || profile.length === 0) {
            return res.status(401).send('The user does not exist');
        }
        let avatar = profile[0].avatar;
        let msg = { username: username, avatar: avatar };
        res.status(200).send(msg);
    });
}

const putAvatar = (req, res) => {
    let username = req.user.username;
    let avatar = req.fileurl;
    if (!avatar) {
        return res.state(400).send('Avatar is missing');
    }
    Profile.findOneAndUpdate(
        { username: username },
        { $set: { avatar: avatar } },
        { new: true, upsert: true },
        function (err, profile) {
            if (err) {
                return console.error(err);
            }
            Article.updateMany(
                { author: username },
                { $set: { avatar: avatar } },
                { new: true, upsert: true },
                function (err, article) {
                }
            );
            let msg = { username: username, avatar: profile.avatar };
            res.status(200).send(msg);
        });
}

const getUsername = (req, res) => {
    let username = req.user.username;
    let msg = { username: username };
    res.status(200).send(msg);
}

const getUsers = (req, res) => {
    Profile.find({}, ['username', 'avatar'], function (err, users) {
        if (err) {
            return console.error(err);
        }
        if (!users || users.length === 0) {
            return res.status(400).send('No user registered');
        }
        let msg = { users: users };
        res.status(200).send(msg);
    })
}

module.exports = (app) => {
    app.get('/headline/:user?', getHeadline);
    app.put('/headline', putHeadline);
    app.get('/email/:user?', getEmail);
    app.put('/email', putEmail);
    app.get('/dob/:user?', getDob);
    app.get('/zipcode/:user?', getZipcode);
    app.put('/zipcode', putZipcode);
    app.get('/phone/:user?', getPhone);
    app.put('/phone', putPhone);
    app.get('/avatar/:user?', getAvatar);
    app.put('/avatar', uploadImage('avatars'), putAvatar);
    app.get('/username', getUsername);
    app.get('/users', getUsers);
}