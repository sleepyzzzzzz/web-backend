const User = require('./Schema').User;
const Profile = require('./Schema').Profile;

const getFollowing = (req, res) => {
    let username = req.params.user ? req.params.user : req.user.username;
    const query = Profile.find({ username: username });
    query.exec(function (err, profile) {
        if (err) {
            return console.error(err);
        }
        if (!profile || profile.length === 0) {
            return res.status(401).send('The user does not exist');
        }
        let follow = profile[0].following;
        let msg = { username: username, following: follow };
        res.status(200).send(msg);
    });
}

const putFollowing = (req, res) => {
    let new_follow = req.params.user;
    let username = req.user.username;
    if (!new_follow) {
        return res.status(400).send('Username is missing');
    }
    if (new_follow === username) {
        return res.status(401).send('Cannot follow yourself');
    }
    const query = Profile.find({ username: username });
    query.exec(function (err, profile) {
        if (err) {
            return console.error(err);
        }
        if (!profile || profile.length === 0) {
            return res.status(401).send('The user does not exist');
        }
        let exist = false;
        let following = profile[0].following;
        for (let i = 0; i < following.length; i++) {
            if (new_follow === following[i]) {
                exist = true;
                break;
            }
        }
        if (exist) {
            return res.status(401).send('You have already followed this user');
        }
        Profile.findOneAndUpdate(
            { username: username },
            { $addToSet: { following: new_follow } },
            { new: true, upsert: true },
            function (err, profile) {
                if (err) {
                    return console.error(err);
                }
                let msg = { username: username, following: profile.following };
                res.status(200).send(msg);
            });
    });
}

const deleteFollowing = (req, res) => {
    let delete_follow = req.params.user;
    let username = req.user.username;
    if (!delete_follow) {
        return res.status(400).send('Username is missing');
    }
    Profile.findOneAndUpdate(
        { username: username },
        { $pull: { following: delete_follow } },
        { new: true, upsert: true, safe: true },
        function (err, profile) {
            if (err) {
                return console.error(err);
            }
            let msg = { username: username, following: profile.following };
            res.status(200).send(msg);
        });
}

module.exports = (app) => {
    app.get('/following/:user?', getFollowing);
    app.put('/following/:user', putFollowing);
    app.delete('/following/:user', deleteFollowing);
}