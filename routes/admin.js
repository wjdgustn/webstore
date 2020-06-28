const express = require('express');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs');

const setting = require('../setting.json');

const utils = require('../utils');

const app = express.Router();

app.get('/admin', function(req, res, next) {
    var check = utils.checkPermission(req, res, "ACCESS_ADMIN_PAGE");
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

    res.render('admin', { user : req.user });
});

app.get('/admin/:page', function(req, res, next) {
    if(!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }

    parsedUrl = url.parse(req.url);
    parsedQuery = querystring.parse(parsedUrl.query,'&','=');

    var userdb = JSON.parse(fs.readFileSync(setting.userdatapath));
    var product = JSON.parse(fs.readFileSync('./data/product.json'));
    var cart = JSON.parse(fs.readFileSync('./data/user/cart.json'));
    var history = JSON.parse(fs.readFileSync('./data/user/history.json'));

    switch(req.params.page) {
        case 'product':
            var check = utils.checkPermission(req, res, "ACCESS_MANAGE_PRODUCT");
            if(!check.result) {
                res.redirect('/');
                return;
            }

            var product = JSON.parse(fs.readFileSync('./data/product.json'));
            res.render('admin-product', { user : req.user , product : product , IsMobile : utils.IsMobile(req) });
            break;
        case 'runcommand-help':
            var check = utils.checkPermission(req, res, "ACCESS_RUN_COMMAND_HELP");
            if(!check.result) {
                res.redirect('/');
                return;
            }

            res.render('runcommand-help');
            break;
        case 'user':
            var check = utils.checkPermission(req, res, "ACCESS_MANAGE_USER");
            if(!check.result) {
                res.redirect('/');
                return;
            }

            if(parsedQuery.id == null || parsedQuery.id == '') {
                res.render('admin-user-menu', { IsMobile : utils.IsMobile(req) });
            }
            else {
                var fakeuserdata = { "money" : 0 };
                res.render('admin-user-edit', { parsedQuery : parsedQuery , userdb : userdb , userdata : userdb[parsedQuery.id] || fakeuserdata , product : product , cart : cart , usercart : cart[parsedQuery.id] , history : history , userhistory : history[parsedQuery.id] , IsMobile : utils.IsMobile(req) });
            }
            break;
        default:
            res.redirect('/admin');
    }
    return;
});

app.get('/getuserinfo/:type/:id', function(req, res, next) {
    var check = utils.checkPermission(req, res, "ACCESS_USER_DATA");
    if(!check.result) {
        switch(check.msg) {
            case "LOGIN":
                res.status(403).send({ "code" : "error" , "message" : "로그인이 필요합니다." });
                break;
            default:
                res.status(403).send({ "code" : "error" , "message" : "권한이 없습니다." });
        }
        return;
    }

    var userdb = JSON.parse(fs.readFileSync(setting.userdatapath));
    var product = JSON.parse(fs.readFileSync('./data/product.json'));
    var cart = JSON.parse(fs.readFileSync('./data/user/cart.json'));
    var history = JSON.parse(fs.readFileSync('./data/user/history.json'));

    switch(req.params.type) {
        case 'cart':
            if(cart[req.params.id] == null) {
                res.json({ "code" : "error" , "message" : "존재하지 않는 유저입니다."});
            }
            else {
                res.json(cart[req.params.id]);
            }
            break;
        case 'history':
            if(history[req.params.id] == null) {
                res.json({ "code" : "error" , "message" : "존재하지 않는 유저입니다." });
            }
            else {
                res.json(history[req.params.id]);
            }
            break;
        default:
            res.json({ "code" : "error" , "message" : "존재하지 않는 타입입니다." });
    }
    return;
});

app.get('/setproduct/:itemcode', function(req, res, next) {
    var check = utils.checkPermission(req, res, "EDIT_PRODUCT");
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

    var product = JSON.parse(fs.readFileSync('./data/product.json'));
    var item_position = -1;
    for(var i in product) {
        if(product[i].code == req.params.itemcode) {
            item_position = i;
            break;
        }
    }
    if(item_position == -1) {
        res.send('<h1>설정에 실패하였습니다.</h1><h2>실패 사유 : 존재하지 않는 아이템 코드</h2><a href="/admin/product">돌아가기</a>');
    }

    parsedUrl = url.parse(req.url);
    parsedQuery = querystring.parse(parsedUrl.query,'&','=');

    product[item_position]['code'] = parsedQuery.code;
    product[item_position]['image'] = parsedQuery.image;
    product[item_position]['title'] = parsedQuery.title;
    product[item_position]['description'] = parsedQuery.description;
    product[item_position]['price'] = Number(parsedQuery.price);
    product[item_position]['buy_limit'] = Number(parsedQuery.buy_limit);
    product[item_position]['left_count'] = Number(parsedQuery.left_count);
    product[item_position]['buy_limit_per_user'] = Number(parsedQuery.buy_limit_per_user);
    product[item_position]['run_command_after_buy'] = parsedQuery.run_command_after_buy;
    product[item_position]['cart_limit'] = Number(parsedQuery.cart_limit);

    fs.writeFileSync('./data/product.json', JSON.stringify(product));
    res.redirect('/admin/product');
});

app.get('/createproduct/:itemcode', function(req, res, next) {
    var check = utils.checkPermission(req, res, "CREATE_PRODUCT");
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

    var product = JSON.parse(fs.readFileSync('./data/product.json'));
    product.push({});
    product[product.length - 1]['code'] = req.params.itemcode;
    product[product.length - 1]['image'] = `이미지 URL을 입력해 주세요.`;
    product[product.length - 1]['title'] = `상품 이름을 입력해 주세요.`;
    product[product.length - 1]['description'] = `상품 설명을 입력해 주세요.`;
    product[product.length - 1]['price'] = 0;
    product[product.length - 1]['buy_limit'] = 0;
    product[product.length - 1]['left_count'] = 0;
    product[product.length - 1]['buy_limit_per_user'] = -1;
    product[product.length - 1]['run_command_after_buy'] = ``;
    product[product.length - 1]['cart_limit'] = -1;

    fs.writeFileSync('./data/product.json', JSON.stringify(product));
    res.redirect('/admin/product');
    return;
});

app.get('/removeproduct/:itemcode', function(req, res, next) {
    var check = utils.checkPermission(req, res, "REMOVE_PRODUCT");
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

    var product = JSON.parse(fs.readFileSync('./data/product.json'));
    product.splice(Number(req.params.itemcode), 1);
    fs.writeFileSync('./data/product.json', JSON.stringify(product));
    res.redirect('/admin/product');
    return;
});

app.post('/adminuserapi/:id', function(req, res, next) {
    if(!req.isAuthenticated()) {
        res.json({ "code" : "error" , "message" : "로그인이 필요합니다." });
        return;
    }

    parsedUrl = url.parse(req.url);
    parsedQuery = querystring.parse(parsedUrl.query,'&','=');

    var userdb = JSON.parse(fs.readFileSync(setting.userdatapath));
    var product = JSON.parse(fs.readFileSync('./data/product.json'));
    var cart = JSON.parse(fs.readFileSync('./data/user/cart.json'));
    var history = JSON.parse(fs.readFileSync('./data/user/history.json'));

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
            var check = utils.checkPermission(req, res, "ADD_PRODUCT_TO_CART_USER");
            if(!check.result) {
                res.json({ "code" : "error" , "message" : "권한이 없습니다.\nADD_PRODUCT_TO_CART_USER 권한이 필요합니다." });
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
            if(utils.CountCart(cart[req.params.id], parsedQuery.itemcode) >= ProductById[parsedQuery.itemcode]['cart_limit'] && ProductById[parsedQuery.itemcode]['cart_limit'] != -1) {
                res.json({ "code" : "error" , "message" : "이 상품을 장바구니에 담을 수 있는 한도를 초과하였습니다." });
                break;
            }
            if(cart[req.params.id] == null) {
                cart[req.params.id] = [];
            }
            cart[req.params.id].push(parsedQuery.itemcode);
            fs.writeFileSync('./data/user/cart.json', JSON.stringify(cart));
            res.json({ "code" : "success" });
            break;
        case 'removecart':
            var check = utils.checkPermission(req, res, "REMOVE_PRODUCT_FROM_CART_USER");
            if(!check.result) {
                res.json({ "code" : "error" , "message" : "권한이 없습니다.\nREMOVE_PRODUCT_FROM_CART_USER 권한이 필요합니다." });
                return;
            }
            if(parsedQuery.itemcode == null) {
                res.json({ "code" : "error" , "message" : "아이템 코드가 누락되었습니다." });
                break;
            }
            if(cart[req.params.id].length <= Number(parsedQuery.itemcode)) {
                res.json({ "code" : "error" , "message" : "해당 아이템을 장바구니에서 찾을 수 없습니다." });
                break;
            }
            cart[req.params.id].splice(Number(parsedQuery.itemcode), 1);
            fs.writeFileSync('./data/user/cart.json', JSON.stringify(cart));
            res.json({ "code" : "success" });
            break;
        case 'buy':
            var check = utils.checkPermission(req, res, "BUY_PRODUCT_USER");
            if(!check.result) {
                res.json({ "code" : "error" , "message" : "권한이 없습니다.\nBUY_PRODUCT_USER 권한이 필요합니다." });
                return;
            }
            if(cart[req.params.id] == null || cart[req.params.id].length == 0) {
                res.json({ "code" : "error" , "message" : "장바구니가 비어 있습니다." });
                break;
            }

            var userdb = JSON.parse(fs.readFileSync(setting.userdatapath));
            var product = JSON.parse(fs.readFileSync('./data/product.json'));
            var cart = JSON.parse(fs.readFileSync('./data/user/cart.json'));
            var history = JSON.parse(fs.readFileSync('./data/user/history.json'));
            var usercart = cart[req.params.id];

            var total_price = 0;

            for(var i in usercart) {
                if((ProductById[usercart[i]]['left_count'] > 0 || ProductById[usercart[i]].buy_limit == -1) && (utils.CountHistory(history[req.params.id], usercart[i]) < ProductById[usercart[i]]['buy_limit_per_user'] || ProductById[usercart[i]]['buy_limit_per_user'] == -1)) {
                    total_price = total_price + ProductById[usercart[i]].price;
                }
                else {
                    cart[req.params.id].splice(i, 1);
                }
            }

            if(userdb[req.params.id]['money'] < total_price) {
                res.json({ "code" : "error" , "message" : `돈이 ${total_price - userdb[req.params.id]['money']}원 부족합니다.` });
                break;
            }
            userdb[req.params.id]['money'] = Number(userdb[req.params.id]['money'] - total_price);
            fs.writeFileSync(setting.userdatapath, JSON.stringify(userdb));

            if(history[req.params.id] == null) {
                history[req.params.id] = [];
            }

            for(var i in usercart) {
                var item_position = 0;
                for(var ii in product) {
                    if(product[ii]['code'] == usercart[i]) {
                        item_position = ii;
                        break;
                    }
                }

                history[req.params.id].unshift(usercart[i]);
                if(product[item_position]['left_count'] > 0) product[item_position]['left_count'] = Number(product[item_position]['left_count']) - 1;
                var command = ProductById[usercart[i]]['run_command_after_buy'];
                var command = command.split('%%name%%').join(req.user.username);
                var command = command.split('%%id%%').join(req.params.id);
                var command = command.split('%%email%%').join(req.user.email);
                if(command != '' && command != null) {
                    eval(command);
                }
            }
            fs.writeFileSync('./data/user/history.json', JSON.stringify(history));
            fs.writeFileSync('./data/product.json', JSON.stringify(product));

            cart[req.params.id] = [];
            fs.writeFileSync('./data/user/cart.json', JSON.stringify(cart));

            res.json({ "code" : "success" });

            break;
        case 'removehistory':
            var check = utils.checkPermission(req, res, "REMOVE_USER_HISTORY");
            if(!check.result) {
                res.json({ "code" : "error" , "message" : "권한이 없습니다.\nREMOVE_USER_HISTORY 권한이 필요합니다." });
                return;
            }
            if(parsedQuery.code == null) {
                res.json({ "code" : "error" , "message" : "코드가 누락되었습니다." });
                break;
            }
            if(history[req.params.id].length <= Number(parsedQuery.code)) {
                res.json({ "code" : "error" , "message" : "해당 코드를 구매 기록에서 찾을 수 없습니다." });
                break;
            }
            history[req.params.id].splice(Number(parsedQuery.code), 1);
            fs.writeFileSync('./data/user/history.json', JSON.stringify(history));
            res.json({ "code" : "success" });
            break;
        default:
            res.json({ "code" : "error" , "message" : "Action query가 누락되었습니다." });
    }
    return;
});

app.get('/editmoney/:id', function(req, res, next) {
    var check = utils.checkPermission(req, res, "CONTROL_USER_MONEY");
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

    parsedUrl = url.parse(req.url);
    parsedQuery = querystring.parse(parsedUrl.query,'&','=');

    var userdb = JSON.parse(fs.readFileSync(setting.userdatapath));

    if(userdb[req.params.id] == null) {
        userdb[req.params.id] = {};
    }

    userdb[req.params.id]['money'] = Number(parsedQuery.money);

    fs.writeFileSync(setting.userdatapath, JSON.stringify(userdb));

    res.redirect(`/admin/user?id=${req.params.id}`);
    return;
});

module.exports = app;