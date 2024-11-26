const env = require('./env');
const mongoose = require('mongoose');

function start_mongodb() {
    mongoose.connect(env.MONGO_CONNECTION_URL).then(() => {
        console.log('Connected to MongoDB');
    }).catch((error) => {
        console.error('MongoDB error: ', error);
    });
}

module.exports = { start_mongodb };