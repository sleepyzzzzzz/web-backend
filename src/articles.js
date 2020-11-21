const Article = require('./Schema').Article;
const Comment = require('./Schema').Comment;
const Profile = require('./Schema').Profile;

const findbyUsername = (res, id) => {
    Article.find({ author: id }, function (err, article) {
        if (err) {
            return console.error(err);
        }
        if (!article || article.length === 0) {
            return res.status(401).send('The username does not exist');
        }
        let msg = { articles: article };
        return res.status(200).send(msg);
    });
}

const findall = (res, username) => {
    Profile.find({ username: username }, function (err, profile) {
        if (err) {
            return console.error(err);
        }
        if (!profile || profile.length === 0) {
            return res.status(401).send('The user does not exist');
        }
        let follow = profile[0].following;
        let all = [];
        follow.forEach(user => all.push(user));
        all.push(username);
        Article.find({ author: { $in: all } }, function (err1, article) {
            if (err1) {
                return console.error(err1);
            }
            if (article) {
                let msg = { articles: article };
                res.status(200).send(msg);
            }
        });
    });
}

const getArticles = (req, res) => {
    let username = req.user.username;
    let id = req.params.id;
    if (!id) {
        findall(res, username);
    }
    else {
        Article.find({ pid: id }, function (err, article) {
            if (err) {
                findbyUsername(res, id);
                return;
            }
            if (!article || article.length === 0) {
                return res.status(401).send('The post id does not exist');
            }
            let msg = { articles: article };
            return res.status(200).send(msg);
        });
    }
}

const putArticles = (req, res) => {
    let username = req.user.username;
    let id = req.params.id;
    if (!id) {
        return res.status(400).send('Post id is missing');
    }
    let text = req.body.text;
    let cid = req.body.commentId;
    Article.find({ pid: id }, function (err, article) {
        if (err) {
            return console.error(err);
        }
        if (!article || article.length === 0) {
            return res.status(401).send('The post id does not exist');
        }
        if (!cid && cid !== 0) {
            Article.find({ pid: id }, function (err, article) {
                if (err) {
                    return console.error(err);
                }
                if (!article || article.length === 0) {
                    return res.status(401).send('The post id does not exist');
                }
                if (article[0].author !== username) {
                    return res.status(401).send('You do not own the article');
                }
                Article.findOneAndUpdate(
                    { pid: id },
                    { $set: { text: text } },
                    { new: true, upsert: true },
                    function (err, article) {
                        if (err) {
                            return console.error(err);
                        }
                        findall(res, username);
                    });
            });
        }
        else {
            if (cid === -1) {
                new Comment({ author: username, date: new Date(), content: text }).save(function (err, comment) {
                    comment.setNext('id', function (err, comment) {
                        if (err) {
                            return console.error('Cannot increment the id');
                        }
                        Article.findOneAndUpdate(
                            { pid: id },
                            { $push: { comments: comment } },
                            { new: true, upsert: true },
                            function (err1, articles) {
                                if (err1) {
                                    return console.error(err1);
                                }
                                findall(res, username);
                            });
                    });
                });
            }
            else {
                Article.find({ pid: id, "comments.id": cid }, function (err, articles) {
                    if (err) {
                        return console.error(err);
                    }
                    if (!articles || articles.length === 0) {
                        return res.status(401).send('The comment id does not exist in this article');
                    }
                    let comments = articles[0].comments;
                    for (let i = 0; i < comments.length; i++) {
                        if (comments[i].id === cid && comments[i].author !== username) {
                            return res.status(401).send('You do not own the comment');
                        }
                    }
                    Article.findOneAndUpdate(
                        { pid: id, "comments.id": cid },
                        { $set: { "comments.$.content": text, "comments.$.date": new Date() } },
                        { new: true, upsert: true },
                        function (err, article) {
                            if (err) {
                                return console.error(err);
                            }
                            findall(res, username);
                        });
                });
            }
        }
    });
}

const addArticle = (req, res) => {
    let username = req.user.username;
    let text = req.body.text;
    if (!text) {
        return res.state(400).send('Article is missing');
    }
    new Article({ author: username, date: new Date(), text: text }).save(function (err, post) {
        if (err) {
            return console.error(err);
        }
        post.setNext('pid', function (err, post) {
            if (err) {
                return console.error('Cannot increment the pid');
            }
            else {
                const query = Article.find({ author: username });
                query.exec(function (err1, article) {
                    if (err1) {
                        return console.error(err1);
                    }
                    if (!article || article.length === 0) {
                        return res.status(401).send('The author does not exist');
                    }
                    let msg = { articles: article };
                    return res.status(200).send(msg);
                });
            }
        });
    });
}

module.exports = (app) => {
    app.get('/articles/:id?', getArticles);
    app.put('/articles/:id', putArticles);
    app.post('/article', addArticle);
}