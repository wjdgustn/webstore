const express = require('express');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs');

const setting = require('../setting.json');

const utils = require('../utils');

const app = express.Router();

app.post('/userapi', function(req, res, next) {
    if(!req.isAuthenticated()) {
        res.json({ "code" : "error" , "message" : "로그인이 필요합니다." });
        return;
    }

    parsedUrl = url.parse(req.url);
    parsedQuery = querystring.parse(parsedUrl.query,'&','=');

    var userdb = JSON.parse(fs.readFileSync(setting.userdatapath));
    var product = JSON.parse(fs.readFileSync('./data/product.json'));
    var cart = JSON.parse(fs.readFileSync('./data/user/cart.json'));

    var ProductById = {};
    for(var i in product) {
        ProductById[product[i].code] = {};
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

    switch(parsedQuery.action) {
        case 'addcart':
            var check = utils.checkPermission(req, res, "ADD_PRODUCT_TO_CART");
            if(!check.result) {
                res.json({ "code" : "error" , "message" : "권한이 없습니다.\nADD_PRODUCT_TO_CART 권한이 필요합니다." });
                return;
            }
            itemcode_list = [];
            for(var i in product) {
                itemcode_list.push(product[i].code);
            }

            if(parsedQuery.itemcode == null) {
                res.json({ "code" : "error" , "message" : "아이템 코드가 누락되었습니다." });
                break;
            }
            if(itemcode_list.indexOf(parsedQuery.itemcode) == -1) {
                res.json({ "code" : "error" , "message" : "잘못된 아이템 코드입니다." });
                break;
            }
            if(!(ProductById[parsedQuery.itemcode]['left_count'] > 0 || ProductById[parsedQuery.itemcode]['buy_limit'] == -1) || !utils.CountHistory(ProductById[parsedQuery.itemcode]['code']) < ProductById[parsedQuery.itemcode]['buy_limit_per_user']) {
                res.json({ "code" : "error" , "message" : "잘못된 접근입니다.\n버그라고 생각된다면 관리자에게 문의하세요." });
                break;
            }
            if(utils.CountCart(cart[req.user.id], parsedQuery.itemcode) >= ProductById[parsedQuery.itemcode]['cart_limit'] && ProductById[parsedQuery.itemcode]['cart_limit'] != -1) {
                res.json({ "code" : "error" , "message" : "이 상품을 장바구니에 담을 수 있는 한도를 초과하였습니다." });
                break;
            }
            if(cart[req.user.id] == null) {
                cart[req.user.id] = [];
            }
            cart[req.user.id].push(parsedQuery.itemcode);
            fs.writeFileSync('./data/user/cart.json', JSON.stringify(cart));
            res.json({ "code" : "success" });
            break;
        case 'removecart':
            var check = utils.checkPermission(req, res, "REMOVE_PRODUCT_FROM_CART");
            if(!check.result) {
                res.json({ "code" : "error" , "message" : "권한이 없습니다.\nREMOVE_PRODUCT_FROM_CART 권한이 필요합니다." });
                return;
            }
            if(parsedQuery.itemcode == null) {
                res.json({ "code" : "error" , "message" : "아이템 코드가 누락되었습니다." });
                break;
            }
            if(cart[req.user.id].length <= Number(parsedQuery.itemcode)) {
                res.json({ "code" : "error" , "message" : "해당 아이템을 장바구니에서 찾을 수 없습니다." });
                break;
            }
            cart[req.user.id].splice(Number(parsedQuery.itemcode), 1);
            fs.writeFileSync('./data/user/cart.json', JSON.stringify(cart));
            res.json({ "code" : "success" });
            break;
        case 'buy':
            var check = utils.checkPermission(req, res, "BUY_PRODUCT");
            if(!check.result) {
                res.json({ "code" : "error" , "message" : "권한이 없습니다.\nBUY_PRODUCT 권한이 필요합니다." });
                return;
            }
            if(cart[req.user.id] == null || cart[req.user.id].length == 0) {
                res.json({ "code" : "error" , "message" : "장바구니가 비어 있습니다." });
                break;
            }

            var userdb = JSON.parse(fs.readFileSync(setting.userdatapath));
            var product = JSON.parse(fs.readFileSync('./data/product.json'));
            var cart = JSON.parse(fs.readFileSync('./data/user/cart.json'));
            var history = JSON.parse(fs.readFileSync('./data/user/history.json'));
            var usercart = cart[req.user.id];

            var total_price = 0;

            for(var i in usercart) {
                if((ProductById[usercart[i]]['left_count'] > 0 || ProductById[usercart[i]].buy_limit == -1) && (utils.CountHistory(history[req.user.id], usercart[i]) < ProductById[usercart[i]]['buy_limit_per_user'] || ProductById[usercart[i]]['buy_limit_per_user'] == -1)) {
                    total_price = total_price + ProductById[usercart[i]].price;
                }
                else {
                    cart[req.user.id].splice(i, 1);
                }
            }

            if(userdb[req.user.id]['money'] < total_price) {
                res.json({ "code" : "error" , "message" : `돈이 ${total_price - userdb[req.user.id]['money']}원 부족합니다.` });
                break;
            }
            userdb[req.user.id]['money'] = Number(userdb[req.user.id]['money'] - total_price);
            fs.writeFileSync(setting.userdatapath, JSON.stringify(userdb));

            if(history[req.user.id] == null) {
                history[req.user.id] = [];
            }

            for(var i in usercart) {
                var item_position = 0;
                for(var ii in product) {
                    if(product[ii]['code'] == usercart[i]) {
                        item_position = ii;
                        break;
                    }
                }

                history[req.user.id].unshift(usercart[i]);
                if(product[item_position]['left_count'] > 0) product[item_position]['left_count'] = Number(product[item_position]['left_count']) - 1;
                var command = ProductById[usercart[i]]['run_command_after_buy'];
                var command = command.split('%%name%%').join(req.user.username);
                var command = command.split('%%id%%').join(req.user.id);
                var command = command.split('%%email%%').join(req.user.email);
                if(command != '' && command != null) {
                    eval(command);
                }
            }
            fs.writeFileSync('./data/user/history.json', JSON.stringify(history));
            fs.writeFileSync('./data/product.json', JSON.stringify(product));

            cart[req.user.id] = [];
            fs.writeFileSync('./data/user/cart.json', JSON.stringify(cart));

            res.json({ "code" : "success" });

            break;
        case 'allclearcart':
            var check = utils.checkPermission(req, res, "CLEAR_CART");
            if(!check.result) {
                res.json({ "code" : "error" , "message" : "권한이 없습니다.\nCLEAR_CART 권한이 필요합니다." });
                return;
            }
            cart[req.user.id] = [];
            fs.writeFileSync('./data/user/cart.json', JSON.stringify(cart));
            res.json({ "code" : "success" });
            break;
        default:
            res.json({ "code" : "error" , "message" : "Action query가 누락되었습니다." });
    }
    return;
});

module.exports = app;
