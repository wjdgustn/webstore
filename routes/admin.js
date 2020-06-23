const express = require('express');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs');

const setting = require('../setting.json');

const app = express.Router();

function IsMobile(req) {
    var ua = req.headers['user-agent'].toLowerCase();
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(ua)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0,4))) {
        return true;
    }
    else {
        return false;
    }
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

module.exports = app;