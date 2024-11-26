const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        p_id: {
            type: String,
            required: true,
            unique: true
        },
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
        },
        stock: {
            type: Number,
            required: true,
            validate : {
                validator : Number.isInteger,
                message   : '{VALUE} is not an integer value'
            }
          },
        image: {
            type: String
        },
        description: String,
    },
    { timestamps: true }
);

const Product = mongoose.model('products', productSchema);
module.exports = Product;
