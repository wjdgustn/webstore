const express = require('express');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs');

const setting = require('../setting.json');

const app = express.Router();

function IsMobile(req) {
    var ua = req.headers['user-agent'].toLowerCase();
    if(/(android|bb\d+|meego).+mobile|avantgo|b(ada\/|l(ackberry|azer))|compal|elaine|fennec|hiptop|i(emobile|p(hone|od)|ris)|kindle|lge |m(aemo|(id|m)p|obile.+firefox)|netfront|opera m(ob|in)i|p(alm( os)?|hone|(ixi|re)\/lucker|ocket|sp)|s(eries(4|6)0|ymbian)|treo|up\.(browser|link)|vodafone|wap|windows ce|x(da|iino)/i.test(ua)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a( wa|bac|c(er|oo|s\-)|i(ko|rn)|l(av|ca|co)|moi|n(ex|ny|yw)|ptu|r(ch|go)|s(te|us)|ttw|u(di|\-m|r |s )|van)|b(e(ck|ll|nq)|i(lb|rd)|l(ac|az)|r(e|v)w|umb|w\-(n|u))|c(55\/|api|cwa|dm\-|ell|htm|ldc|md\-|o(mp|nd)|raw)|d(a(it|ll|ng)|bte|c\-s|evi|ica|mob|o(c|p)o|s(12|\-d))|e(l(49|ai)|m(l2|ul)|r(ic|k0)|sl8|z([4-7]0|os|wa|ze))|f(etc|ly(\-|_))|g(1 u|560|ene|f\-5|\-mo|o(\.w|od)|r(ad|un))|haie|hcit|hd\-(m|p|t)|h(ei\-|i(pt|ta)|p( i|ip)|s\-c|t(c(\-| |_|a|g|p|s|t)|tp)|u(aw|tc))|i(\-(20|go|ma)|230|ac( |\-|\/)|bro|dea|g01|kom|m1k|nno|paq|ris)|j(a(t|v)a|bro|emu|igs)|k(ddi|eji|gt( |\/)|lon|pt |wc\-|yo(c|k))|l(e(no|xi)|g( g|\/(k|l|u)|50|54|\-[a-w])|ibw|ynx)|m(1\-w|3ga|50\/|a(te|ui|xo)|c(01|21|ca)|\-cr|e(rc|ri)|i(o8|oa|ts)|mef|o(01|02|bi|de|do|t(\-| |o|v)|zz)|t(50|p1|v )|wbp|ywa)|n(10[0-2]|20[2-3]|30(0|2)|50(0|2|5)|7(0(0|1)|10)|e((c|m)\-|on|tf|wf|wg|wt)|ok(6|i)|zph)|o(2im|p(ti|wv)|ran|wg1)|p(800|an(a|d|t)|dxg|g(13|\-([1-8]|c))|hil|ire|l(ay|uc)|n\-2|o(ck|rt|se)|rox|sio|t\-g)|q(a\-a|c(07|12|21|32|60|\-[2-7]|i\-)|tek)|r((38|60)0|aks|im9|o(ve|zo))|s(55\/|a(ge|m(a|m|s)|ny|va)|c(01|h\-|oo|p\-)|dk\/|e(c(\-|0|1)|47|mc|nd|ri)|gh\-|har|ie(\-|m)|k\-0|l(45|id)|m(al|ar|b3|it|t5)|o(ft|ny)|p(01|h\-|v\-|v )|y(01|mb))|t(2(18|50)|6((0|1)0|18)|a(gt|lk)|cl\-|dg\-|el(i|m)|im\-|\-mo|o(pl|sh)|s(70|m\-|m3|m5)|x\-9)|u(p(\.b|g1|si)|tst)|v(400|750|eri|i(rg|te)|k(40|5[0-3]|\-v)|m40|oda|ulc|x(5(2|3)|6(0|1)|(7|8)0|8(1|3|5)|98))|w(3c(\-| )|ebc|hit|i(g |nc|nw)|mlb|onu)|x700|y(as\-|our)|z(eto|te)\-/i.test(ua.substr(0,4)))
        return true;
    else
        return false;
}

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
            res.render('admin-product', { user : req.user , product : product , IsMobile : IsMobile(req) });
            break;
        case 'runcommand-help':
            res.render('runcommand-help');
            break;
        case 'user':
            if(parsedQuery.id == null || parsedQuery.id == '') {
                res.render('admin-user-menu', { IsMobile : IsMobile(req) });
            }
            else {
                var fakeuserdata = { "money" : 0 };
                res.render('admin-user-edit', { parsedQuery : parsedQuery , userdb : userdb , userdata : userdb[parsedQuery.id] || fakeuserdata , product : product , cart : cart , usercart : cart[parsedQuery.id] , history : history , userhistory : history[parsedQuery.id] , IsMobile : IsMobile(req) });
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

module.exports = app;