health-check
---- 
Doing more than just a 200 and regex check, HealthCheck loads the application in phantomjs and use casperjs to navigate and verify elements on the page. 

# Installation Steps
1. Spin up an Ubuntu instance and access to its console as root
2. Install required software
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
3. Check out code from repository
```sh
$ git clone https://github.com/aduyng/health-check.git /var/www/node/health-check
```
3. Change to root folder of health-check
```sh
cd /var/www/node/health-check
```
3. Setting up the database
 * Connecting to database server
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
6. Install node dependencies
```sh
cd /var/www/node/health-check
npm install
```
7. Make changes on config.js
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
8. Start your server with forever
```sh
NODE_ENV=production forever start  server.js
```
9. Voila! 
