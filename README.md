# What is it?
Doing more than just a 200 and regex check, HealthCheck loads the application in phantomjs and use casperjs to navigate and verify elements on the page. 

# Why? 
Most of the web applications today use are single page applications. Most of the content is generated by javascript or template framework. Therefore, to ensure that the application is still functioning, we need to load the application in a browser and verify. That is exactly what HealthCheck is doing. 

#Overview of Architecture
Primary technologies used: 
* Backend: NodeJS, ExpressJs, PhantomJs, CasperJS, KnexJS, BookshelfJS
* Frontend: BackboneJS, RequireJS, UnderscoreJS, JQuery, and Handlebars

![Overview](https://www.lucidchart.com/publicSegments/view/54ff22f1-ac18-4a37-b665-234c0a00494a/image.jpeg)

# Installation Steps
* Spin up an Ubuntu instance and access to its console as root
* Update apt package registry
```sh
$ apt-get update
```
* Install mysql-server and specify root password
```sh
$ apt-get install mysql-server
```
* Install nodejs
```sh
$ apt-get install nodejs
```
* Create alias for nodejs as node
```sh
$ ln -s /usr/bin/nodejs /usr/bin/node
```
* Install node package manager (NPM)
```sh
$ apt-get install npm
```
* Install git client
```sh
$ apt-get install git
```
* Install libfontconfig (phantomjs secret dependency)
```sh
$ apt-get install libfontconfig
```
* Install forever globally for executing node as daemon
```sh
$ npm install -g forever
```
* Install phantomjs globally
```sh
$ npm install -g phantomjs
```
* Install casperjs globally and record the executable location
```sh
$ npm install -g casperjs
$ whereis casperjs
# casperjs: /usr/local/bin/casperjs
```
* Check out code from repository
```sh
$ git clone https://github.com/aduyng/health-check.git /var/www/node/health-check
```
* Change to root folder of health-check
```sh
cd /var/www/node/health-check
```
* Connecting to database server and set up database
```sh
mysql -u root -p<root password>
```
* Create a new database & user
```sql
create database healthcheck;
create user healthcheck;
grant all on healthcheck.* to healthcheck@localhost identified by '<database password>';
exit;
```
* Log in as the newly created user and import data
```sh
mysql -u healthcheck -p<database password>
```
```sql
use healthcheck;
source ./db.sql
exit;
```
* Install node dependencies
```sh
cd /var/www/node/health-check
npm install
```
* Make changes on config.js
```sh
vim config.js
```
```javascript 
var path = require('path'),
    pkg = require('./package.json'),
    env = process.env.NODE_ENV || 'development';
module.exports = {
    production: {
       rootPath: __dirname,
        app: {
            name: pkg.name,
            fullName: 'Health Check',
            version: pkg.version
        },
        db: {
            client: 'mysql',
            connection: {
                host: '127.0.0.1',
                user: 'healthcheck',
                password: '<database password>',
                database: 'healthcheck'
            },
            debug: false
        },
        casper: {
            absolutePath: '<casperjs absolute path>'
        }
    }
};
```
* Start your server with forever
```sh
PORT=80 NODE_ENV=production forever start server.js
```
* Access to your server via http with username=cssmobile, password=mobile10 and VOILA!

# NOTES
The application is still buggy.

# LICENSE
All rights reserved (for now)
