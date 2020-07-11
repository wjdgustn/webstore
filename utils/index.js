const fs = require('fs');
const nodemailer = require('nodemailer');
const axios = require('axios');

const setting = require('../setting.json');

module.exports.CountHistory = function(history, code) {
    var count = 0;
    for(var i in history) {
        if(code == history[i]){
            count++;
        }
    }
    return count;
}

module.exports.CountCart = function(cart, code) {
    var count = 0;
    for(var i in cart) {
        if(code == cart[i]){
            count++;
        }
    }
    return count;
}

module.exports.IsMobile = function(req) {
    var ua = req.headers['user-agent'].toLowerCase();
    if(/(android|bb\d+|meego).+mobile|avantgo|b(ada\/|l(ackberry|azer))|compal|elaine|fennec|hiptop|i(emobile|p(hone|od)|ris)|kindle|lge |m(aemo|(id|m)p|obile.+firefox)|netfront|opera m(ob|in)i|p(alm( os)?|hone|(ixi|re)\/lucker|ocket|sp)|s(eries(4|6)0|ymbian)|treo|up\.(browser|link)|vodafone|wap|windows ce|x(da|iino)/i.test(ua)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a( wa|bac|c(er|oo|s\-)|i(ko|rn)|l(av|ca|co)|moi|n(ex|ny|yw)|ptu|r(ch|go)|s(te|us)|ttw|u(di|\-m|r |s )|van)|b(e(ck|ll|nq)|i(lb|rd)|l(ac|az)|r(e|v)w|umb|w\-(n|u))|c(55\/|api|cwa|dm\-|ell|htm|ldc|md\-|o(mp|nd)|raw)|d(a(it|ll|ng)|bte|c\-s|evi|ica|mob|o(c|p)o|s(12|\-d))|e(l(49|ai)|m(l2|ul)|r(ic|k0)|sl8|z([4-7]0|os|wa|ze))|f(etc|ly(\-|_))|g(1 u|560|ene|f\-5|\-mo|o(\.w|od)|r(ad|un))|haie|hcit|hd\-(m|p|t)|h(ei\-|i(pt|ta)|p( i|ip)|s\-c|t(c(\-| |_|a|g|p|s|t)|tp)|u(aw|tc))|i(\-(20|go|ma)|230|ac( |\-|\/)|bro|dea|g01|kom|m1k|nno|paq|ris)|j(a(t|v)a|bro|emu|igs)|k(ddi|eji|gt( |\/)|lon|pt |wc\-|yo(c|k))|l(e(no|xi)|g( g|\/(k|l|u)|50|54|\-[a-w])|ibw|ynx)|m(1\-w|3ga|50\/|a(te|ui|xo)|c(01|21|ca)|\-cr|e(rc|ri)|i(o8|oa|ts)|mef|o(01|02|bi|de|do|t(\-| |o|v)|zz)|t(50|p1|v )|wbp|ywa)|n(10[0-2]|20[2-3]|30(0|2)|50(0|2|5)|7(0(0|1)|10)|e((c|m)\-|on|tf|wf|wg|wt)|ok(6|i)|zph)|o(2im|p(ti|wv)|ran|wg1)|p(800|an(a|d|t)|dxg|g(13|\-([1-8]|c))|hil|ire|l(ay|uc)|n\-2|o(ck|rt|se)|rox|sio|t\-g)|q(a\-a|c(07|12|21|32|60|\-[2-7]|i\-)|tek)|r((38|60)0|aks|im9|o(ve|zo))|s(55\/|a(ge|m(a|m|s)|ny|va)|c(01|h\-|oo|p\-)|dk\/|e(c(\-|0|1)|47|mc|nd|ri)|gh\-|har|ie(\-|m)|k\-0|l(45|id)|m(al|ar|b3|it|t5)|o(ft|ny)|p(01|h\-|v\-|v )|y(01|mb))|t(2(18|50)|6((0|1)0|18)|a(gt|lk)|cl\-|dg\-|el(i|m)|im\-|\-mo|o(pl|sh)|s(70|m\-|m3|m5)|x\-9)|u(p(\.b|g1|si)|tst)|v(400|750|eri|i(rg|te)|k(40|5[0-3]|\-v)|m40|oda|ulc|x(5(2|3)|6(0|1)|(7|8)0|8(1|3|5)|98))|w(3c(\-| )|ebc|hit|i(g |nc|nw)|mlb|onu)|x700|y(as\-|our)|z(eto|te)\-/i.test(ua.substr(0,4))) {
        return true;
    } else {
        return false;
    }
}

module.exports.sendmail = function(address, title, text) {
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
        } else {
            return info.response;
        }
    });
}

module.exports.checkPermission = function(req, res, permission) {
    if(!req.isAuthenticated()) {
        return { result : false , msg : "LOGIN" };
    }

    var userdb = JSON.parse(fs.readFileSync(setting.userdatapath));
    var permission_group = JSON.parse(fs.readFileSync('./data/permission.json'));

    var user_permission = userdb[req.user.id]['permission'];
    var user_permission_group = userdb[req.user.id]['permission_group'];

    if(setting.admin.indexOf(req.user.id) != -1) {
        return { "result" : true , "msg" : "GLOBAL_ADMIN" };
    }
    for(var i in user_permission_group) {
        if(permission_group[user_permission_group[i]]['permission'].indexOf(permission) != -1) {
            return { "result" : true , "msg" : "HAVE_PERMISSION_IN_GROUP" };
        }
    }
    for(var i in user_permission) {
        if(user_permission[i] == permission) {
            return { "result" : true , "msg" : "HAVE_PERMISSION_IN_USER" };
        }
    }
    return { "result" : false , "msg" : "NO_PERMISSION" };
}

module.exports.http = function(method, url) {
    let result;

    return axios({
        method: method,
        url: url
    });
}