# **School Mini Project**

********************************************
## How to install

```
npm install
cp models/env.js.example models/env.js
```
Then [set up ENV](models/env.js), fill in the mongoDB URL and set the session secret

```
gulp
```
********************************************
## Login
Open https://localhost:3999/ , it should be redirect to login page.

After login, user can edit the product stock and change their initial password.

The default user are:
|username|password|role |apikey       |
|--------|--------|-----|-------------|
|admin   |admin   |admin|*View Inside*|
|demo    |demo    |user |*View Inside*|

## Logout
In the upper part, user can click the avater to logout.

********************************************
## CRUD service
- Create
User who is admin role can add user or add product info from dashboard.

- Read
User can read all the product detail from the product list. Moreover, User who is admin role can view all user list.

- Update
User can edit the product stock and update their password from the dashboard. Moreover, user who is admin role can force reset the user password.

- Delete
User who is admin role can delete user and product info from the dashboard.

********************************************
## Restful
- Create
1. Add user (Role: Admin, Method: POST)
    domain.ltd/api/user/add
        ?apikey=[View in Profile]
        ?username=A_USER_NAME
        ?role=[admin or user]

2. Add product info (Role: Admin, Method: POST)
    domain.ltd/api/product/add
        ?apikey=[View in Profile]
        ?p_id=[INTEGER ONLY]
        ?name=[String]
        ?manufacturer=[String]
        ?price=[NUMBER]
        ?stock=[INTEGER ONLY]

- Read
1. List all user (Role: Admin, Method: GET)
    domain.ltd/api/user/list
        ?apikey=[View in Profile]

2. List all product (Role: User/Admin, Method: GET)
    domain.ltd/api/product/list
        ?apikey=[View in Profile]

- Update
1. Update product stock (Role: User/Admin, Method: POST)
    domain.ltd/api/product/update/stock
        ?apikey=[View in Profile]
        ?p_id=[INTEGER ONLY]
        ?stock=[INTEGER ONLY]

2. Update product info (Role: Admin, Method: POST)
    domain.ltd/api/product/update/a;;
        ?apikey=[View in Profile]
        ?p_id=[INTEGER ONLY]
        ?name=[String]
        ?manufacturer=[String]
        ?price=[NUMBER]
        ?stock=[INTEGER ONLY]

3. Force reset user password (Role: Admin, Method: POST)
    domain.ltd/api/user/edit/all
        ?apikey=[View in Profile]
        ?username=A_USER_NAME
        ?new_pw=[PASSWORD]
        ?role=[admin or user]

- Delete
1. Delete product info (Role: Admin, Method: POST)
    domain.ltd/api/product/delete
        ?apikey=[View in Profile]
        ?p_id=[INTEGER]

2. Delete user
    domain.ltd/api/user/delete (Role: Admin, Method: POST)
        ?apikey=[View in Profile]
        ?username=A_USER_NAME
