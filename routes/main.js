const express = require('express');
const fs = require('fs');

const setting = require('../setting.json');

const utils = require('../utils');

const app = express.Router();

app.get('/', function(req, res, next) {
    var userdb = JSON.parse(fs.readFileSync(setting.userdatapath));
    var product = JSON.parse(fs.readFileSync('./data/product.json'));
    var history = JSON.parse(fs.readFileSync('./data/user/history.json'));

    if(req.isAuthenticated()) {
        if(userdb[req.user.id] == null) {
            userdb[req.user.id] = {};
        }
        if(userdb[req.user.id]['money'] == null) {
            userdb[req.user.id]['money'] = 0;
        }
    }

    fs.writeFileSync(setting.userdatapath, JSON.stringify(userdb));

    if(utils.IsMobile(req)) {
        res.render('main-mobile', { user : req.user , logined : req.isAuthenticated() , userdb : userdb , setting : setting , product : product , history : history });
    }
    else {
        res.render('main', { user : req.user , logined : req.isAuthenticated() , userdb : userdb , setting : setting , product : product , history : history });
    }
    return;
});

module.exports = app;
