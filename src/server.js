/**
 * TODO
 * - super admin
 * - db migrations
 */

const env = require('./env');
const fs = require('fs');
const uuid = require('uuid');
const sqlite3 = require('sqlite3');
const express = require('express');
const app = express();
const server = require('http').Server(app);

const helpers = require('./helpers');

const isDatabaseNew = !fs.existsSync(env.db);
const db = new sqlite3.Database(env.db, function() {
    // Periodic cleanup
    setInterval(() => {
        db.run('DELETE FROM auth_tokens WHERE expiry_timestamp < ?', helpers.getTimestamp());
    }, 3600000);

    // Initialize DB if it is new
    if (isDatabaseNew) {
        console.log("initializing db");
        require('./db-init')(db);
    }
});

const dbMethods = require('./db-methods')(db);
const middleware = require('./middleware')(db);

const api = require('./api-methods')(dbMethods, middleware);

app.use('/api', api);
app.use('/lib', express.static(__dirname + '/node_modules'));
app.use('/', express.static(__dirname + '/static'));

server.listen(env.port, env.ip);
