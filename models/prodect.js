const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        manufacturer: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true
        },stock: {
            type: Number,
            required: true,
          },
        image: {
            type: String,
            required: true
        },
        description: String,
    },
    { timestamps: true }
);

const Prodect = mongoose.model('Prodect', productSchema);
module.exports = Prodect;
