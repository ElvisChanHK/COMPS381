const env = require('./env');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const session_config = {
    secret: env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: env.MONGO_CONNECTION_URL }),
    cookie: { maxAge: env.COOKIE_MAXAGE * 1000}
}

module.exports = { session, session_config };