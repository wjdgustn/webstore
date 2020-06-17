const express = require('express');
const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');
const passport = require('passport');
const fs = require('fs');
const session = require('express-session');
const nodemailer = require('nodemailer');

const setting = require('./setting.json');

const app = express();

if(setting.usessl) {
    protocol = "https://"
    options = {
        cert: fs.readFileSync(setting.ssl_cert),
        key: fs.readFileSync(setting.ssl_key)
    }
}
else {
    protocol = "http://"
}

function CountHistory(history, code) {
    var count = 0;
    for(var i in history) {
        if(code == history[i]) count++;
    }
    return count;
}

function CountCart(cart, code) {
    var count = 0;
    for(var i in cart) {
        if(cart[i] == code) {
            count++;
        }
    }
    return count;
}

function sendmail(address, title, text) {
    var transport =  nodemailer.createTransport(setting.smtp_info);

    var mailOptions = {
        from: setting.smtp_mail_address,
        to: address,
        subject: title,
        text: text
    }
    
    transport.sendMail(mailOptions, function(error, info) {
        if(error) {
            return error;
        }
        else {
            return info.response;
        }
    });
}

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
require('./DiscordStrategy')(passport);

const staticoptions = {
    index: setting.index
}
app.use(express.static(__dirname + "/public/", staticoptions));
app.use(express.static(__dirname + "/upload/", staticoptions));

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(function(req, res, next) {
    if(setting.testmode && req.isAuthenticated() && setting.admin.indexOf(req.user.id) == -1) {
        res.send('<h1>현재 테스트 모드이므로 사용이 불가능합니다.</h1>');
        return;
    }
    else {
        next();
    }
});

app.get('/', function(req, res, next) {
    var userdb = JSON.parse(fs.readFileSync(setting.userdatapath));
    var product = JSON.parse(fs.readFileSync('./data/product.json'));
    var history = JSON.parse(fs.readFileSync('./data/user/history.json'));

    if(req.isAuthenticated() && userdb[req.user.id] == null) {
        userdb[req.user.id] = {};
    }
    if(req.isAuthenticated() && userdb[req.user.id]['money'] == null) {
        userdb[req.user.id]['money'] = 0;
    }
    fs.writeFileSync(setting.userdatapath, JSON.stringify(userdb));

    res.render('main', { user : req.user , logined : req.isAuthenticated() , userdb : userdb , setting : setting , product : product , history : history });
    return;
});

app.get('/profile', function(req, res, next) {
    if(!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }
    var userdb = JSON.parse(fs.readFileSync(setting.hyonsubotdatapath));

    res.render('profile', { user : req.user , logined : req.isAuthenticated() , userdb : userdb , setting : setting });
    return;
});

app.get('/cart', function(req, res, next) {
    if(!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }
    var userdb = JSON.parse(fs.readFileSync(setting.userdatapath));
    var cart = JSON.parse(fs.readFileSync('./data/user/cart.json'));
    var product = JSON.parse(fs.readFileSync('./data/product.json'));
    var history = JSON.parse(fs.readFileSync('./data/user/history.json'));

    if(cart[req.user.id] == null) {
        res.redirect('/');
        return;
    }
    if(cart[req.user.id].length == 0) {
        res.redirect('/');
        return;
    }

    ProductById = {};
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
        if (cart[req.user.id] != null && (ProductById[cart[req.user.id][i]]['left_count'] <= 0 && ProductById[cart[req.user.id][i]]['left_count'] != -1) || (CountHistory(history[req.user.id], cart[req.user.id][i]) >= ProductById[cart[req.user.id][i]]['buy_limit_per_user'] && ProductById[cart[req.user.id][i]]['buy_limit_per_user'] != -1)) {
            cart[req.user.id].splice(i, 1);
        }
    }
    for(var i in cart[req.user.id]) {
        if(cart[req.user.id][i] == null) {
            cart[req.user.id].splice(i, 1);
        }
    }
    fs.writeFileSync('./data/user/cart.json', JSON.stringify(cart));

    res.render('cart', { user : req.user , logined : req.isAuthenticated() , userdb : userdb , setting : setting , cart : cart , product : product });
    return;
});

app.get('/history', function(req, res, next) {
    if(!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }
    var userdb = JSON.parse(fs.readFileSync(setting.userdatapath));
    var history = JSON.parse(fs.readFileSync('./data/user/history.json'));
    var product = JSON.parse(fs.readFileSync('./data/product.json'));

    if(history[req.user.id] == null) {
        history[req.user.id] = [];
        fs.writeFileSync('./data/user/history.json', JSON.stringify(history));
    }

    res.render('history', { user : req.user , logined : req.isAuthenticated() , userdb : userdb , setting : setting , history : history , product : product });
    return;
});

app.get('/admin', function(req, res, next) {
    if(!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }
    if(setting.admin.indexOf(req.user.id) == -1) {
        res.redirect('/');
        return;
    }

    res.render('admin', { user : req.user });
});

app.get('/admin/:page', function(req, res, next) {
    if(!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }
    if(setting.admin.indexOf(req.user.id) == -1) {
        res.redirect('/');
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
            var product = JSON.parse(fs.readFileSync('./data/product.json'));
            res.render('admin-product', { user : req.user , product : product });
            break;
        case 'runcommand-help':
            res.render('runcommand-help');
            break;
        case 'user':
            if(parsedQuery.id == null || parsedQuery.id == '') {
                res.render('admin-user-menu');
            }
            else {
                res.render('admin-user-edit', { parsedQuery : parsedQuery , userdb : userdb , userdata : userdb[parsedQuery.id] , product : product , cart : cart , usercart : cart[parsedQuery.id] , history : history , userhistory : history[parsedQuery.id] });
            }
            break;
        default:
            res.redirect('/admin');
    }
    return;
});

app.get('/getuserinfo/:type/:id', function(req, res, next) {
    if(!req.isAuthenticated()) {
        res.status(403).send({ "code" : "error" , "message" : "로그인이 필요합니다." });
        return;
    }
    if(setting.admin.indexOf(req.user.id) == -1) {
        res.status(403).send({ "code" : "error" , "message" : "권한이 없습니다." });
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
    if(!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }
    if(setting.admin.indexOf(req.user.id) == -1) {
        res.redirect('/');
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
    if(!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }
    if(setting.admin.indexOf(req.user.id) == -1) {
        res.redirect('/');
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
    if(!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }
    if(setting.admin.indexOf(req.user.id) == -1) {
        res.redirect('/');
        return;
    }

    var product = JSON.parse(fs.readFileSync('./data/product.json'));
    console.log(JSON.stringify(product));
    product.splice(Number(req.params.itemcode), 1);
    console.log(JSON.stringify(product));
    fs.writeFileSync('./data/product.json', JSON.stringify(product));
    res.redirect('/admin/product');
    return;
});

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
            if(!(ProductById[parsedQuery.itemcode]['left_count'] > 0 || ProductById[parsedQuery.itemcode]['buy_limit'] == -1) || !CountHistory(ProductById[parsedQuery.itemcode]['code']) < ProductById[parsedQuery.itemcode]['buy_limit_per_user']) {
                res.json({ "code" : "error" , "message" : "잘못된 접근입니다.\n버그라고 생각된다면 관리자에게 문의하세요." });
                break;
            }
            if(CountCart(cart[req.user.id], parsedQuery.itemcode) >= ProductById[parsedQuery.itemcode]['cart_limit'] && ProductById[parsedQuery.itemcode]['cart_limit'] != -1) {
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
                if((ProductById[usercart[i]]['left_count'] > 0 || ProductById[usercart[i]].buy_limit == -1) && (CountHistory(history[req.user.id], usercart[i]) < ProductById[usercart[i]]['buy_limit_per_user'] || ProductById[usercart[i]]['buy_limit_per_user'] == -1)) {
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
        default:
            res.json({ "code" : "error" , "message" : "Action query가 누락되었습니다." });
    }
    return;
});

app.post('/adminuserapi/:id', function(req, res, next) {
    if(!req.isAuthenticated()) {
        res.json({ "code" : "error" , "message" : "로그인이 필요합니다." });
        return;
    }
    if(setting.admin.indexOf(req.params.id) == -1) {
        res.redirect('/');
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
            if(!(ProductById[parsedQuery.itemcode]['left_count'] > 0 || ProductById[parsedQuery.itemcode]['buy_limit'] == -1) || !CountHistory(ProductById[parsedQuery.itemcode]['code']) < ProductById[parsedQuery.itemcode]['buy_limit_per_user']) {
                res.json({ "code" : "error" , "message" : "잘못된 접근입니다.\n버그라고 생각된다면 관리자에게 문의하세요." });
                break;
            }
            if(CountCart(cart[req.params.id], parsedQuery.itemcode) >= ProductById[parsedQuery.itemcode]['cart_limit'] && ProductById[parsedQuery.itemcode]['cart_limit'] != -1) {
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
                if((ProductById[usercart[i]]['left_count'] > 0 || ProductById[usercart[i]].buy_limit == -1) && (CountHistory(history[req.params.id], usercart[i]) < ProductById[usercart[i]]['buy_limit_per_user'] || ProductById[usercart[i]]['buy_limit_per_user'] == -1)) {
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

app.get('/edituser/:id', function(req, res, next) {
    if(!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }
    if(setting.admin.indexOf(req.user.id) == -1) {
        res.redirect('/');
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

app.use(function(req, res, next) {
    res.status(404).send(`<h1>${url.parse(req.url).pathname}을(를) 찾을 수 없습니다.</h1>`);
    return;
});

if(setting.usessl) {
    https.createServer(options, app).listen(setting.port, function () {
        console.log('서버가 구동중입니다!');
    });
}
else {
    http.createServer(app).listen(setting.port, function() {
        console.log("서버가 구동중입니다!");
    });
}