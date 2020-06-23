const express = require('express');
const url = require('url');
const querystring = require('querystring');
const fs = require('fs');

const setting = require('../setting.json');

const app = express.Router();

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

function IsMobile(req) {
    var ua = req.headers['user-agent'].toLowerCase();
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(ua)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0,4))) {
        return true;
    }
    else {
        return false;
    }
}

app.get('/profile', function(req, res, next) {
    if(!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }
    var userdb = JSON.parse(fs.readFileSync(setting.hyonsubotdatapath));

    res.render('profile', { user : req.user , logined : req.isAuthenticated() , userdb : userdb , setting : setting , IsMobile : IsMobile(req) });
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

    res.render('cart', { user : req.user , logined : req.isAuthenticated() , userdb : userdb , setting : setting , cart : cart , product : product , IsMobile : IsMobile(req) });
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

    res.render('history', { user : req.user , logined : req.isAuthenticated() , userdb : userdb , setting : setting , history : history , product : product , IsMobile : IsMobile(req) });
    return;
});

module.exports = app;