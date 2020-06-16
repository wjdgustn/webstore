const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;

const setting = require('./setting.json');

module.exports = (passport) => {
    passport.use(new DiscordStrategy({
        clientID: setting.DISCORD_CLIENT_ID,
        clientSecret: setting.DISCORD_CLIENT_SECRET,
        callbackURL: setting.DISCORD_CALLBACK_URL,
        scope: setting.DISCORD_SCOPE
    }, (accessToken, refreshToken, profile, done) => {
        process.nextTick(() => {
            return done(null, profile);
        });
    }));
};