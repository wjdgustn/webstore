console.log('서버 시작을 준비하고 있습니다...\n');

console.log('모듈 불러오는 중...');
const express = require('express');
const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');
const passport = require('passport');
const session = require('express-session');
const fs = require('fs');
const nodemailer = require('nodemailer');
console.log('모듈을 불러왔습니다.\n');

console.log('설정 불러오는 중...');
const setting = require('./setting.json');
console.log('설정을 불러왔습니다.\n');

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

function IsMobile(req) {
    var ua = req.headers['user-agent'].toLowerCase();
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(ua)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0,4))) {
        return true;
    }
    else {
        return false;
    }
}

app.use(session({
    secret: setting.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

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
        case 'allclearcart':
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

console.log('라우터를 불러오는 중...');
var filelist = fs.readdirSync('./routes');
for(var i in filelist) {
    app.use(require('./routes/' + filelist[i]));
    console.log(`${filelist[i]} 라우터를 불러왔습니다.`);
}
console.log('라우터를 모두 불러왔습니다.\n')

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