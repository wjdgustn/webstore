const express = require('express');
const passport = require('passport');
const session = require('express-session');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs');

const setting = require('../setting.json');

const app = express.Router();

passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

app.use(session({
    secret: setting.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
require('../DiscordStrategy')(passport);

app.get('/login', passport.authenticate('discord'), function() {
    return;
});

app.get('/logout', function(req, res, next) {
    req.logout();
    res.redirect('/');
    return;
});

app.get(setting.DISCORD_CALLBACK_URL, passport.authenticate('discord', {
    failureRedirect: '/loginfail'
}), function(req, res) {
    parsedUrl = url.parse(req.url);
    parsedQuery = querystring.parse(parsedUrl.query,'&','=');

    var userdb = JSON.parse(fs.readFileSync('./data/user/user.json'));
    if(userdb[req.user.id] == null) {
        userdb[req.user.id] = {};
    }
    if(userdb[req.user.id]['money'] == null) {
        userdb[req.user.id]['money'] = 0;
    }
    if(userdb[req.user.id]['permission'] == null) {
        userdb[req.user.id]['permission'] = [];
    }
    if(userdb[req.user.id]['permission_group'] == null) {
        userdb[req.user.id]['permission_group'] = ["user"];
    }
    fs.writeFileSync('./data/user/user.json', JSON.stringify(userdb));

    res.redirect('/');
    return;
});

app.get('/loginfail', function(req, res, next) {
    res.send('<h1>로그인 실패!</h1><h2>로그인에 실패하였습니다. <a href="/login">이곳</a>을 클릭해 다시 시도할 수 있습니다.</h2>');
    return;
});

module.exports = app;
