const express = require('express');
const passport = require('passport');
const session = require('express-session');
const url = require('url');
const querystring = require('querystring');

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
    res.redirect('/');
    return;
});

app.get('/loginfail', function(req, res, next) {
    res.send('<h1>로그인 실패!</h1><h2>로그인에 실패하였습니다. <a href="/login">이곳</a>을 클릭해 다시 시도할 수 있습니다.</h2>');
    return;
});

module.exports = app;