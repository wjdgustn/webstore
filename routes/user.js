const express = require('express');
const fs = require('fs');

const setting = require('../setting.json');

const utils = require('../utils');

const app = express.Router();

app.get('/cart', function(req, res, next) {
    var check = utils.checkPermission(req, res, "ACCESS_CART");
    if(!check.result) {
        switch(check.msg) {
            case "LOGIN":
                res.redirect('/login');
                break;
            default:
                res.redirect('/');
        }
        return;
    }
    var userdb = JSON.parse(fs.readFileSync(setting.userdatapath));
    var cart = JSON.parse(fs.readFileSync('./data/user/cart.json'));
    var product = JSON.parse(fs.readFileSync('./data/product.json'));
    var history = JSON.parse(fs.readFileSync('./data/user/history.json'));

    if(cart[req.user.id] == null || cart[req.user.id].length == 0) {
        res.redirect('/');
        return;
    }

    var ProductById = {};

    for(var i in product) {
        ProductById[product[i].code] = {};
        ProductById[product[i].code]['code'] = product[i].code;
        ProductById[product[i].code]['title'] = product[i].title;
        ProductById[product[i].code]['description'] = product[i].description;
        ProductById[product[i].code]['image'] = product[i].image;
        ProductById[product[i].code]['price'] = product[i].price;
        ProductById[product[i].code]['buy_limit'] = product[i].buy_limit;
        ProductById[product[i].code]['buy_limit_per_user'] = product[i].buy_limit_per_user;
        ProductById[product[i].code]['left_count'] = product[i].left_count;
        ProductById[product[i].code]['run_command_after_buy'] = product[i].run_command_after_buy;
        ProductById[product[i].code]['cart_limit'] = product[i].cart_limit;
    }

    for(var i in cart[req.user.id]) {
        if (cart[req.user.id] != null && (ProductById[cart[req.user.id][i]]['left_count'] <= 0 && ProductById[cart[req.user.id][i]]['left_count'] != -1) || (utils.CountHistory(history[req.user.id], cart[req.user.id][i]) >= ProductById[cart[req.user.id][i]]['buy_limit_per_user'] && ProductById[cart[req.user.id][i]]['buy_limit_per_user'] != -1)) {
            cart[req.user.id].splice(i, 1);
        }
    }
    for(var i in cart[req.user.id]) {
        if(cart[req.user.id][i] == null) {
            cart[req.user.id].splice(i, 1);
        }
    }

    fs.writeFileSync('./data/user/cart.json', JSON.stringify(cart));

    res.render('cart', { user : req.user , logined : req.isAuthenticated() , userdb : userdb , setting : setting , cart : cart , product : product , IsMobile : utils.IsMobile(req) , checkAdmin : utils.checkPermission(req, res, "ACCESS_ADMIN_PAGE").result });
    return;
});

app.get('/history', function(req, res, next) {
    var check = utils.checkPermission(req, res, "ACCESS_HISTORY");
    if(!check.result) {
        switch(check.msg) {
            case "LOGIN":
                res.redirect('/login');
                break;
            default:
                res.redirect('/');
        }
        return;
    }
    var userdb = JSON.parse(fs.readFileSync(setting.userdatapath));
    var history = JSON.parse(fs.readFileSync('./data/user/history.json'));
    var product = JSON.parse(fs.readFileSync('./data/product.json'));

    if(history[req.user.id] == null) {
        history[req.user.id] = [];
        fs.writeFileSync('./data/user/history.json', JSON.stringify(history));
    }

    res.render('history', { user : req.user , logined : req.isAuthenticated() , userdb : userdb , setting : setting , history : history , product : product , IsMobile : utils.IsMobile(req) , checkAdmin : utils.checkPermission(req, res, "ACCESS_ADMIN_PAGE").result });
    return;
});

module.exports = app;
