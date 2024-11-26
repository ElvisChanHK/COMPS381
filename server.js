const express = require('express');
const bodyParser = require('body-parser');
//const engine = require('ejs-locals');
const cors = require('cors');

const app = express()
const corsOptions = {
    methods: 'GET,POST',
  };
app.use(cors(corsOptions));
app.disable('x-powered-by');
app.use(bodyParser.urlencoded({ extended: true }));

//app.engine('ejs',engine)
app.set('views','./views')
app.set('view engine','ejs')

//Models

const Product = require('./models/product');
const User = require('./models/user');

//Setup MongoDB & Session
const { start_mongodb } = require('./models/mongodb');
const { session, session_config } = require('./models/session');
start_mongodb();
app.use(session(session_config));

/**
 * Insert user from mongoDB
 * @param {string} username
 * @param {string} password
 * @param {string} role
 */
async function insertUser(username, password, role) {
    const userinfo = await getUser(username);
    const newUser = new User();
    flag = false;

    if (userinfo == null) {
        console.log('null');
        newUser.username = username;
        newUser.password = password;
        newUser.role = role;
        newUser.setPassword(password);
        newUser.apikey = newUser.genAPIKey();
        flag = true;
    }
        
    if (flag) {
        await newUser.save();
        msg = `${username} added successfully`;
        console.log(msg);
        return flag;
    } else {
        msg = `Failed to add ${username}`;
        console.log(`Failed to add ${username}`);
        console.log('fai');
        return flag;
    }
}

/**
 * Change password from user request
 * @param {string} username
 * @param {string} old_pw Old Password
 * @param {string} new_pw New Password
 * @param {string} role
 * @returns {boolean}
 */
async function updateUser(username, old_pw, new_pw, role) {
    const userinfo = await getUser(username);
    
    if (userinfo != null) {

        // Check wherever the old password is the same
        if (userinfo.validPassword(old_pw)) {
            new_pw = userinfo.setPassword(new_pw);
            role = userinfo.role;
        } else {
            msg = `Failed to update ${username} password`;
            console.log(msg);
            return false;
        }

        try {
            await User.findOneAndUpdate({ username: username },
                { password: new_pw, role: role },
                { new: true });
            await userinfo.save();
            msg = `${username} password updated`;
            console.log(msg);
            return true;
        } catch(err) {
            console.log(err);
            msg = `Failed to update ${username} password`;
            console.log(msg);
            return false;
        }    
    } else {
        msg = `Failed to update ${username} password`;
        console.log(msg);
        return false;
    }
}

/**
 * Force Reset Password
 * @param {string} username
 * @param {string} new_pw
 * @param {string} role
 * @returns {boolean}
 */
async function updateUser_admin(username, new_pw, role) {
    const userinfo = await getUser(username);
    
    if (userinfo != null) {

        // Force Reset Password
        userinfo.setPassword(new_pw);
        userinfo.role = role;

        try {
            await User.findOneAndUpdate({ username: username },
                { role: role },
                { new: true });
            await userinfo.save();
            console.log(`${username} password force reseted`);
            return true;
        } catch(err) {
            console.log(err);
            console.log(`Failed to reset ${username} password`);
            return false;
        }    
    } else {
        console.log(`Failed to reset ${username} password`);
        return false;
    }
}

/**
 * Delete user from mongoDB
 * @param {string} username
 * @returns {boolean}
 */
async function deleteUser(username) {
    try {
        const userinfo = await User.findOneAndDelete({ username: username });
        console.log(userinfo);
        if (!userinfo) {
            msg = "User not found!";
            console.log(msg);
            return false;
        }
        msg = `${username} deleted`;
        console.log(msg);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}

/**
 * Get All Users
 * @returns {Array}
 */
async function listUsers() {
    const users = await User.find().select('username role -_id').sort({ username: 1 });;
    return users;
}

/**
 * Get user info from mongoDB
 * @param {string} username 
 * @returns {string}
 */
async function getUser(username) {
    const foundUser = await User.findOne({ username: username });
    return foundUser;
}

/**
 * (API) Find user is valid
 * @param {string} apikey 
 * @returns {boolean} Check the user is valid
 */
async function findUser_API(apikey) {
    const foundUser = await User.findOne({ apikey: apikey });
    //console.log('function api: ' + apikey);
    //console.log('function founduser: ' + foundUser);
    if (foundUser == null) {
        return false;
    } else if (foundUser.apikey != apikey) {
        return false;
    } else if (foundUser.apikey == apikey) {
        return true;
    } else {
        return false;
    }
}

/**
 * (API) Find admin user is valid
 * @param {string} apikey 
 * @returns {boolean} Check the admin user is valid
 */
async function findAdmin_API(apikey) {
    const foundUser = await User.findOne({ apikey: apikey });
    //console.log('function api: ' + apikey);
    //console.log('function founduser: ' + foundUser);
    if (foundUser == null) {
        return false;
    } else if (foundUser.apikey != apikey) {
        return false;
    } else if (foundUser.apikey == apikey) {
        if (foundUser.role == 'admin') {
            return true;
        }
        return false;
    } else {
        return false;
    }
}

/**
 * Get user role from mongoDB
 * @param {string} username 
 * @returns the user name or null
 */
async function getUserRole(username) {
    const foundUser = await User.findOne({ username: username });
    role = foundUser.role;
    return role;
}

/**
 * Get user apikey from mongoDB
 * @param {string} username 
 * @returns the user apikey
 */
//async function getUserAPIKey(username) {
//    const foundUser = await User.findOne({ username: username });
//    apikey = foundUser.apikey;
//    return apikey;
//}

/**
 * Login user
 * @param {string} username
 * @param {string} password
 * @returns {boolean}
 */
async function login(username, password) {
    const userinfo = await getUser(username);
    if (userinfo == null) {
        return false;
    }
    //console.log(userinfo.validPassword(password));
    return userinfo.validPassword(password);
}

/**
 * Add / Edit Product
 * @param {String} p_id Internal ID
 * @param {String} name Product Name
 * @param {String} manufacturer Product Manufacturer
 * @param {String} price Product Price
 * @param {String} stock Product Stock
 * @returns {boolean}
 */
async function insert_Product(p_id, name, manufacturer, price, stock) {
    console.log(p_id, name, manufacturer, price, stock);
    if (p_id == null || name == null || manufacturer == null || price == null || stock == null) {
        return false;
    }

    try {
        const newProduct = new Product();
        newProduct.p_id = p_id;
        newProduct.name = name;
        newProduct.manufacturer = manufacturer;
        newProduct.price = price;
        newProduct.stock = stock;
        newProduct.image = 'Not used';
        newProduct.description = 'Not used';
        //newProduct.image = image;
        //newProduct.description = description;
        await newProduct.save();
        return true;
    } catch (err) {
        const existProduct = await get_Product(p_id);
        existProduct.p_id = p_id;
        existProduct.name = name;
        existProduct.manufacturer = manufacturer;
        existProduct.price = price;
        existProduct.stock = stock;
        //existProduct.image = image;
        //existProduct.description = description;
        await existProduct.save();
        return true;
    }
}

/**
 * Get All Products
 * @returns {Array}
 */
async function list_Product() {
    const Products = await Product.find().select('p_id name manufacturer price stock -_id').sort({ p_id: 1 });
    return Products;
}

/**
 * Get Product
 * @param {String} p_id Internal ID
 * @returns {Object}
 */
async function get_Product(p_id) {
    const product = await Product.findOne({ p_id: p_id });
    //console.log(product);
    return product;
}

/**
 * Count Products
 * @returns {Number}
 */
async function count_Product() {
    const count = await Product.countDocuments('products');
    return count;
}

/**
 * Edit Product Stock
 * @param {String} p_id Internal ID
 * @param {Number} stock Product Stock
 * @returns {boolean}
 */
async function update_Product_shock(p_id, stock) {
    console.log(typeof(stock));
    if (stock < 0 || stock == null) {
        return false;
    }

    try {
        updateProduct = await Product.findOneAndUpdate({ p_id: p_id },
            { stock: stock },
            { new: true });
        //console.log(updateProduct);
        return true;
    } catch (err) {
        console.log(err);
    }
    return false;
}

/**
 * Delete Product
 * @param {String} p_id Internal ID
 * @returns {boolean}
 */
async function delete_Product(p_id) {
    try {
        const productinfo = await Product.findOneAndDelete({ p_id: p_id });
        console.log(productinfo);
        if (productinfo == null) {
            console.log("Product not found!");
            return false;
        }
        console.log(`${p_id} deleted`);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}

function pathsplit(req) {
    const path = req.path;
    var path_split = path.split('/').filter(Boolean);

    //console.log(path_split[path_split.length - 1]);
    path_split[path_split.length] = parseInt(path_split[path_split.length - 1], 10);
    //console.log(path_split);
    
    if (isNaN(path_split[path_split.length])) {
        if (Number.isInteger(path_split[path_split.length - 1])) {
            path_split.pop();
        }
        path_split.pop();
    }

    //console.log(path_split);
    return path_split;
}

function dashboard_element(req) {
    const role = req.session.role;
    const username = req.session.username;
    const pathname = pathsplit(req);
    
    element = [role, username, pathname];
    return element;
}

//Middleware: Authentication (Role: user)
function auth(req, res, next) {
    if (req.session.username) {
        console.log('authenticated');
        next();
    } else {
        console.log('not authenticated');
        return res.redirect('/auth/login');
    }
}

//Middleware: Authentication (Role: admin)
function auth_admin(req, res, next) {
    if (req.session.role == 'admin') {
        console.log('authenticated');
        next();
    } else {
        console.log('not authenticated');
        return res.redirect('/auth/login');
    }
}

//Middleware: API Key Authentication (Role: user)
async function authapi(req, res, next) {
    console.log('incomed apikey: ' + req.query.apikey);
    flag = await findUser_API(req.query.apikey);
    console.log(flag);
    if (flag) {
        console.log('API authenticated');
        next();
    } else {
        console.log('API not authenticated');
        return res.status(401).json({ message: 'Unauthorized', status: 401 });
    }
}

//Middleware:API Key Authentication (Role: admin)
async function authapi_admin(req, res, next) {
    if (req.method == "POST") {
        //console.log(req.query);
        //console.log('POST incomed apikey_admin: ' + req.query.apikey);
        flag = await findAdmin_API(req.query.apikey);
        //console.log(flag);
        if (flag) {
            console.log('API authenticated');
            next();
        } else {
            console.log('API not authenticated');
            return res.status(401).json({ message: 'Unauthorized', status: 401 });
        }
    }
    
    if (req.method == "GET") {
        console.log('GET incomed apikey_admin: ' + req.body.apikey);
        flag = await findAdmin_API(req.query.apikey);
        console.log(flag);
        if (flag) {
            console.log('API authenticated');
            next();
        } else {
            console.log('API not authenticated');
            return res.status(401).json({ message: 'Unauthorized', status: 401 });
        }
    }
}

//Route
app.use(express.static('public'));

app.get('/', (req, res, next) => {
    return res.redirect('/auth/login');
});

app.get('/dashboard', auth, (req, res, next) => {
    const element = dashboard_element(req);
    const role = element[0];
    const username = element[1];
    const pathname = element[2];

    return res.render('dashboard.ejs', {role, username, pathname});
})

app.get('/profile', auth, async (req, res, next) => {
    const element = dashboard_element(req);
    const pathname = element[2];

    const userinfo = await getUser(req.session.username);
    return res.render('profile.ejs', { "username": userinfo.username, "role": userinfo.role, "apikey": userinfo.apikey, pathname });
});

app.route('/profile/changepassword')
    .get(auth, async (req, res, next) => {
        const element = dashboard_element(req);
        const role = element[0];
        const pathname = element[2];

        const userinfo = await getUser(req.session.username);
        return res.render('changePW_new.ejs', { "username": userinfo.username, role, pathname });
    })
    .post(auth, async (req, res, next) => {
        const userinfo = await getUser(req.session.username);
        flag = await updateUser(req.session.username, req.body.old_pw, req.body.new_pw, userinfo.role);
        try{
            if (flag) {
                console.log('Password updated');
                return res.status(200).json({ msg: 'Your password updated' });
            } else {
                console.log('Invalid old password');
                return res.status(401).json({ msg: 'Invalid old password' });
            }
        } catch (err) {
            console.log(err);
            return res.status(500).json({ msg: 'Internal Server Error' });
        }
    });

app.route('/user/add')
    .get(auth_admin, async (req, res, next) => {
        const element = dashboard_element(req);
        const role = element[0];
        const username = element[1];
        const pathname = element[2];

        return res.render('user_add.ejs', { role, username, pathname });
    })
    .post(auth_admin, async (req, res, next) => {
        password = req.body.username;
        role = '';
        if (req.body.role == 'Role Menu') {
            console.log('a');
            return res.status(400).json({ msg: 'You may missing some parameters' });
        }
        if (req.body.role == '1') {
            role = 'user';
        }
        if (req.body.role == '2') {
            role = 'admin';
        }

        console.log(role);
        console.log(req.body.username, password, role);
        flag = await insertUser(req.body.username, password, role);
        console.log(flag);
        if (flag) {
            console.log('User added');
            return res.status(200).json({ msg: 'User added' });
        } else {
            console.log('Failed to add user');
            return res.status(400).json({ msg: 'Failed to add user' });
        }
    })

app.route('/user/reset/:username')
    .get(auth_admin, async (req, res, next) => {
        const element = dashboard_element(req);
        const role = element[0];
        const username = element[1];
        const pathname = element[2];

        const userinfo = await getUser(req.params.username);

        return res.render('user_reset.ejs', { role, username, pathname, userinfo });
    })
    .post(auth_admin, async (req, res, next) => {
        password = req.body.password;
        role = req.body.role;

        console.log('username: ' + req.body.username);
        console.log('password: ' + password);
        console.log('role: ' + role);

        flag = await updateUser_admin(req.body.username, password, role);
        console.log(flag);
        if (flag) {
            console.log('User had been reset');
            return res.status(200).json({ msg: 'User had been reset' });
        } else {
            console.log('Failed to reset user');
            return res.status(400).json({ msg: 'Failed to reset user' });
        }
    })

app.get('/user/list', auth, async (req, res, next) => {
    const element = dashboard_element(req);
    const role = element[0];
    const username = element[1];
    const pathname = element[2];
    const user_list = await listUsers();;
    
    return res.render('user_list.ejs', { user_list, role, username, pathname});
})

app.post('/user/delete/:username', auth_admin, async (req, res, next) => {
        if (req.params.username == req.session.username) {
            console.log('You can\'t delete youself');
            return res.status(401).json({ msg: 'You can\'t delete youself' });
        }
        flag = await deleteUser(req.params.username);
        console.log(flag);
        try{
            if (flag) {
                console.log('User deleted');
                return res.status(200).json({ msg: 'User deleted' });
            } else {
                console.log('User not found');
                return res.status(401).json({ msg: 'User not found' });
            }
        } catch (err) {
            console.log(err);
            return res.status(500).json({ msg: 'Internal Server Error' });
        }
    });

app.route('/auth/login')
    .get((req, res, next) => {
        if (req.session.username) {
            console.log('authenticated');
            return res.redirect('/dashboard');
        } else {
            console.log('not authenticated');
            return res.render('login_new.ejs');
        }
    })
    .post(async (req, res, next) => {
        try {
            if (req.body.username && req.body.password) {
                const username = req.body.username;
                const password = req.body.password;
                if (await login(username, password)) {
                    req.session.username = username;
                    req.session.role = await getUserRole(username);
                    //console.log(req.session);
                    //console.log("done");
                    return res.status(200).send({ 'redirect': '/dashboard' });
                } else {
                    return res.status(401).json({ msg: 'Invalid username or password' });
                }
            } else {
                return res.status(401).json({ msg: 'Invalid username or password' });
            }
        } catch (err) {
            console.log(err);
            return res.status(500).json({ msg: 'Internal Server Error'});
        }
    });

app.get('/auth/logout', auth, async (req, res, next) => {
    req.session.destroy(() => {
        console.log('session destroyed');
    });
    return res.redirect('/auth/login');
});

app.get('/auth/*', (req, res, next) => {
    return res.redirect('/auth/login');
});

app.get('/product', auth, async (req, res, next) => {
    return res.redirect('/product/list');
});

app.get('/product/list', auth, async (req, res, next) => {
        const element = dashboard_element(req);
        const role = element[0];
        const username = element[1];
        const pathname = element[2];

        const product_list = await list_Product();;
        
        return res.render('product_list_new.ejs', { product_list, role, username, pathname});
    })

app.route('/product/view/:p_id')
    .get(auth, async (req, res, next) => {
        const element = dashboard_element(req);
        const role = element[0];
        const username = element[1];
        const pathname = element[2];

        const p_id = req.params.p_id;
        const product_info = await get_Product(p_id);
        
        if (product_info == null) {
            return res.status(404).send( 'Product not found' );
        }
        return res.render('product_info.ejs', { product_info, p_id, role, username, pathname });
    })
    .post(auth, async (req, res, next) => {
        if (!Number(req.body.stock) || !Number.isInteger(Number(req.body.stock))) {
            console.log('Not integer number');
            return res.status(401).json({ msg: 'Please type integer number' });
        } else {
            stock = Number(req.body.stock);
        }

        if (req.session.role == 'users') {
            flag = await update_Product_shock(req.params.p_id, stock);
            try{
                if (flag) {
                    console.log('Product updated');
                    return res.status(200).json({ msg: 'Product updated', nowStock: req.body.stock });
                } else {
                    console.log('Invalid shock number');
                    return res.status(401).json({ msg: 'Invalid shock number' });
                }
            } catch (err) {
                console.log(err);
                return res.status(500).json({ msg: 'Internal Server Error' });
            }
        }

        if (req.session.role == 'admin') {
            flag = await insert_Product(req.params.p_id, req.body.name, req.body.manufacturer, req.body.price, req.body.stock);
            try{
                if (flag) {
                    console.log('Product updated');
                    return res.status(200).json({ msg: 'Product updated', nowStock: req.body.stock });
                } else {
                    console.log('Invalid shock number');
                    return res.status(401).json({ msg: 'Invalid shock number' });
                }
            } catch (err) {
                console.log(err);
                return res.status(500).json({ msg: 'Internal Server Error' });
            }
        }
        
    })

app.route('/product/add')
    .get(auth_admin, async (req, res, next) => {
        const element = dashboard_element(req);
        const role = element[0];
        const username = element[1];
        const pathname = element[2];

        return res.render('product_add.ejs', { role, username, pathname });
    })
    .post(auth_admin, async (req, res, next) => {
        try {
            console.log(req.body);
            flag = await insert_Product(req.body.p_id, req.body.name, req.body.manufacturer, req.body.price, req.body.stock);
            if (flag) {
                return res.status(200).json({ msg: 'Product added' });
            } else {
                return res.status(400).json({ msg: 'You may missing some parameters' });
            }
        } catch (err) {
            if (err.code == 11000) {
                return res.status(400).json({ msg: 'Product already exists' });
            } else if (err.errors.stock.kind == 'user defined') {
                return res.status(400).json({ msg: err.errors.stock.message });
            } else {
            return res.status(500).json({ msg: 'Internal Server Error' });
            }
        }
    })

app.post('/product/delete/:p_id', auth_admin, async (req, res, next) => {
    flag = await delete_Product(req.params.p_id);
    console.log(flag);
    try{
        if (flag) {
            console.log('Product deleted');
            return res.status(200).json({ msg: 'Product deleted' });
        } else {
            console.log('Product not found');
            return res.status(401).json({ msg: 'Product not found' });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ msg: 'Internal Server Error' });
    }
});

// Error handler
app.route(['/product/**', '/product/**/*'])
    .get((req, res, next) => {
        return res.status(400).send( 'Not available now' );
    })
    .post((req, res, next) => {
        return res.status(400).send( 'Not available now' );
    });

//API
// Product API
app.route('/api/product/list')
    .get(authapi, async (req, res, next) => {
        const product_list = await list_Product();
        return res.status(200).json(product_list);
    })
    .post((req, res, next) => {
        return res.status(405).json({ message: 'Method Not Allowed', status: 405 });
    });

app.route('/api/product/add')
    .post(authapi_admin, async (req, res, next) => {
        try {
            flag = await insert_Product(req.query.p_id, req.query.name, req.query.manufacturer, req.query.price, req.query.stock);
            if (flag) {
                return res.status(200).json({ message: 'Product added', status: 200 });
            } else {
                return res.status(400).json({ message: 'You may missing some parameters', status: 400 });
            }
        } catch (err) {
            if (err.code == 11000) {
                return res.status(400).json({ message: 'Product already exists', status: 400 });
            } else if (err.errors.stock.kind == 'user defined') {
                return res.status(400).json({ message: err.errors.stock.message, status: 400 });
            } else {
            return res.status(500).json({ message: 'Internal Server Error', status: 500 });
            }
        }
    })
    .get((req, res, next) => {
        return res.status(405).json({ message: 'Method Not Allowed', status: 405 });
    });

app.route('/api/product/update/all')
    .post(authapi_admin, async (req, res, next) => {
        try {
            flag = await insert_Product(req.query.p_id, req.query.name, req.query.manufacturer, req.query.price, req.query.stock);
            if (flag) {
                return res.status(200).json({ message: 'Product Updated', status: 200 });
            } else {
                return res.status(400).json({ message: 'You may missing some parameters', status: 400 });
            }
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: 'Internal Server Error', status: 500 });
        }
    })
    .get((req, res, next) => {
        return res.status(405).json({ message: 'Method Not Allowed', status: 405 });
    });

app.route('/api/product/update/stock')
    .post(authapi, async (req, res, next) => {
        try {
            flag = await update_Product_shock(req.query.p_id, req.query.stock);
            if (flag) {
                return res.status(200).json({ message: 'Product Stock Updated', status: 200 });
            } else {
                return res.status(400).json({ message: 'You may missing some parameters', status: 400 });
            }
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: 'Internal Server Error', status: 500 });
        }
    })
    .get((req, res, next) => {
        return res.status(405).json({ message: 'Method Not Allowed', status: 405 });
    });

app.route('/api/product/delete')
    .post(authapi_admin, async (req, res, next) => {
        try {
            flag = await delete_Product(req.query.p_id);
            if (flag) {
                return res.status(200).json({ message: 'Product Deleted', status: 200 });
            } else {
                return res.status(400).json({ message: 'You may missing some parameters', status: 400 });
            }
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: 'Internal Server Error', status: 500 });
        }
    })
    .get((req, res, next) => {
        return res.status(405).json({ message: 'Method Not Allowed', status: 405 });
    });

// User API
app.route('/api/user/list')
    .get(authapi_admin, async (req, res, next) => {
        const product_list = await listUsers();
        return res.status(200).json(product_list);
    })
    .post((req, res, next) => {
        return res.status(405).json({ message: 'Method Not Allowed', status: 405 });
    });

app.route('/api/user/add')
    .post(authapi_admin, async (req, res, next) => {
        try {
            password = req.query.username;
            console.log(password);
            flag = await insertUser(req.query.username, password, req.query.role);
            if (flag) {
                return res.status(200).json({ message: 'User added', status: 200 });
            } else {
                return res.status(400).json({ message: 'You may missing some parameters', status: 400 });
            }
        } catch (err) {
            console.log(err);
            if (err.code == 11000) {
                return res.status(400).json({ message: 'User already exists', status: 400 });
            } else {
            return res.status(500).json({ message: 'Internal Server Error', status: 500 });
            }
        }
    })
    .get((req, res, next) => {
        return res.status(405).json({ message: 'Method Not Allowed', status: 405 });
    });

app.route('/api/user/delete')
    .post(authapi_admin, async (req, res, next) => {
        try {  
            flag = await deleteUser(req.query.username);
            if (flag) {
                return res.status(200).json({ message: 'User Deleted', status: 200 });
            } else {
                return res.status(400).json({ message: 'You may missing some parameters', status: 400 });
            }
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: 'Internal Server Error', status: 500 });
        }
    })
    .get((req, res, next) => {
        return res.status(405).json({ message: 'Method Not Allowed', status: 405 });
    });

app.route('/api/user/edit/all')
    .post(authapi_admin, async (req, res, next) => {
        try {  
            flag = await updateUser_admin(req.query.username, req.query.new_pw, req.query.role);
            if (flag) {
                return res.status(200).json({ message: 'User Password Force Reseted', status: 200 });
            } else {
                return res.status(400).json({ message: 'You may missing some parameters', status: 400 });
            }
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: 'Internal Server Error', status: 500 });
        }
    })
    .get((req, res, next) => {
        return res.status(405).json({ message: 'Method Not Allowed', status: 405 });
    });

// Error handler
app.route(['/api/*', '/api/**/*'])
    .get((req, res, next) => {
        return res.status(400).json({ message: 'Bad request', status: 400 });
    })
    .post((req, res, next) => {
        return res.status(400).json({ message: 'Bad request', status: 400 });
    });

// Catch 404 and forward to error handler
app.use((req, res, next) => {
    return res.status(404).render('404');
});

// error handler
// define as the last app.use callback
app.use((err, req, res, next) => {
  res.status(500).render('500');
});

//Initialize User Data
//deleteUser('admin');
//deleteUser('demo');
//Insert default user
//insertUser('admin', 'admin', 'admin');
//insertUser('demo', 'demo', 'user');

//insert_Product('1', 'Coke', 'Swire Coca-Cola', '1', '2');
//insert_Product('2', 'Pepsi', 'Pepsi', '1', '1');
//insert_Product('3', 'Fanta', 'Swire Coca-Cola', '1', '1');

//Start server
app.listen(3999, () => {
    console.log('server is listening on port 3999')
})