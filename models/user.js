const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        hash: {
            type: String
        },
        salt: {
            type: String
        },
        apikey: {
            type: String,
            unique: [true, 'API Key is conflict with other user']
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        }
    },
    { timestamps: true }
);

// Method to set salt and hash the password for a user 
userSchema.methods.setPassword = function(password) { 
     
    // Creating a unique salt for a particular user 
    this.salt = crypto.randomBytes(16).toString('hex'); 
     
    // Hashing user's salt and password with 1000 iterations,     
    this.hash = crypto.pbkdf2Sync(password, this.salt,  
       1000, 64, `sha512`).toString(`hex`); 
}; 
     
// Method to check the entered password is correct or not 
userSchema.methods.validPassword = function(password) { 
    var hash = crypto.pbkdf2Sync(password,  
    this.salt, 1000, 64, `sha512`).toString(`hex`); 
    return this.hash === hash; 
};

userSchema.methods.genAPIKey = function() {
    return [...Array(30)]
    .map((e) => ((Math.random() * 36) | 0).toString(36))
    .join('');
}

const User = mongoose.model('User', userSchema);
module.exports = User;
