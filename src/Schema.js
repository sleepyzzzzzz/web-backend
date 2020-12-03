const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const Third = new mongoose.Schema({
    id: {
        type: String,
        default: ''
    },
    provider: {
        type: String,
        default: ''
    }
})

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required']
    },
    salt: {
        type: String,
        required: [true, 'Created salt is required']
    },
    hash: {
        type: String,
        required: [true, 'Created hash is required']
    },
    googleId: {
        type: String,
        default: ''
    },
    third_party: {
        type: [Third],
        default: []
    },
    auth: {
        type: [],
        default: []
    }
}, { autoIndex: true });

const User = mongoose.model('User', userSchema);

const userprofileSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required']
    },
    displayname: {
        type: String
    },
    email: {
        type: String,
        required: [true, 'Email is required']
    },
    dob: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    zipcode: {
        type: Number,
        required: [true, 'Zipcode is required']
    },
    phone: {
        type: String,
        default: ''
    },
    headline: {
        type: String,
        default: "This is my headline!"
    },
    avatar: {
        type: String,
        default: ''
    },
    following: {
        type: [String],
        default: []
    }
}, { autoIndex: true });

const Profile = mongoose.model('Profile', userprofileSchema);

const commentSchema = new mongoose.Schema({
    id: {
        type: Number
    },
    author: {
        type: String,
        required: [true, 'Author is required']
    },
    avatar: {
        type: String
    },
    date: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    content: {
        type: String
    }
}, { autoIndex: true })
commentSchema.plugin(AutoIncrement, { inc_field: 'id', disable_hooks: true });

const Comment = mongoose.model('Comment', commentSchema);

const articleSchema = new mongoose.Schema({
    pid: {
        type: Number
    },
    author: {
        type: String,
        required: [true, 'Author is required']
    },
    avatar: {
        type: String
    },
    date: {
        type: Date,
        required: [true, 'Date of birth is required']
    },
    text: {
        type: String,
        default: ''
    },
    images: {
        type: String,
        default: ''
    },
    comments: {
        type: [commentSchema],
        default: []
    }
}, { autoIndex: true });
articleSchema.plugin(AutoIncrement, { inc_field: 'pid', disable_hooks: true });

const Article = mongoose.model('Article', articleSchema);

module.exports.User = User;
module.exports.Profile = Profile;
module.exports.Comment = Comment;
module.exports.Article = Article;