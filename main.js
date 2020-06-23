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