module.exports = (db) => {
    const sha256 = require('sha256');
    const fs = require('fs');
    const helpers = require('./helpers');

    db.serialize(() => {
        db.exec(`
            CREATE TABLE criteria_captions (
                id INTEGER PRIMARY KEY,
                caption TEXT
            );
            CREATE TABLE criteria (
                id INTEGER PRIMARY KEY,
                criterion TEXT,
                criteria_caption_id INTEGER,
                FOREIGN KEY(criteria_caption_id) REFERENCES criteria_captions(id) ON UPDATE CASCADE ON DELETE RESTRICT
            );
            CREATE TABLE members (
                id INTEGER PRIMARY KEY,
                name TEXT,
                share_token TEXT
            );
            CREATE TABLE ratings (
                id INTEGER PRIMARY KEY,
                member_id INTEGER,
                criterion_id INTEGER,
                rater_id INTEGER,
                level INTEGER,
                remark TEXT,
                timestamp INTEGER,
                FOREIGN KEY(member_id) REFERENCES members(id) ON UPDATE CASCADE ON DELETE RESTRICT,
                FOREIGN KEY(criterion_id) REFERENCES criteria(id) ON UPDATE CASCADE ON DELETE RESTRICT,
                FOREIGN KEY(rater_id) REFERENCES raters(id) ON UPDATE CASCADE ON DELETE SET NULL
            );
            CREATE TABLE raters (
                id INTEGER PRIMARY KEY,
                name TEXT,
                email TEXT,
                password_hash TEXT,
                superuser INTEGER
            );
            CREATE TABLE auth_tokens (
                id INTEGER PRIMARY KEY,
                rater_id INTEGER,
                auth_token TEXT,
                expiry_timestamp INTEGER,
                FOREIGN KEY(rater_id) REFERENCES raters(id) ON UPDATE CASCADE ON DELETE SET NULL
            );
        `);
    
        const criteria = [
            {
                caption: 'Schip gereedmaken voor toekomstige omstandigheden',
                criteria: [
                    'Schip zeilklaar maken',
                    'Schip nachtklaar maken',
                    'Verhalen van het schip',
                    'Stilliggend hijsen van de zeilen',
                    'Stilliggend strijken van de zeilen',
                    'Varend hijsen van de zeilen',
                    'Varend strijken van de zeilen',
                    'Afmeren van schip op eigen ligplaats',
                    'Noodzaak van reven onderkennen',
                    'Stilliggend reven op eigen schip',
                    'Varend reven op eigen schip',
                    'Schiemanswerk'
                ]
            },
            {
                caption: 'Het bedienen van het schip + meest frequente manoeuvres',
                criteria: [
                    'Stand en bediening van de zeilen',
                    'Sturen: roer- en schootbediening',
                    'Koersvaren',
                    'Overstag gaan',
                    'Opkruisen in breed vaarwater',
                    'Opkruisen in nauw vaarwater',
                    'Gijpen',
                    'Gijpen kunnen vermijden',
                    'Afkruisen',
                    'Stormrondje'
                ]
            },
            {
                caption: 'Het schip veilig en gecontroleerd van of naar wal of kade manoeuvreren',
                criteria: [
                    'Boven- en benedenwindspunt herkennen',
                    'Bovenwindspunt bevaren',
                    'Afvaren van hogerwal',
                    'Aankomen op hogerwal',
                    'Benedenwindspunt bevaren',
                    'Afvaren van lagerwal',
                    'Aankomen op lagerwal',
                    'Ankeren'
                ]
            }
        ];
    
        // -- from here on: test data
    
        db.run('INSERT INTO raters (name, email, password_hash, superuser) VALUES (?, ?, ?, ?)', 'Schipper Thimo', 'thimo', sha256('thimo123'), 1);
        db.run('INSERT INTO raters (name, email, password_hash, superuser) VALUES (?, ?, ?, ?)', 'Schipper Frederike', 'frederike', sha256('frederike123'), 1);
        db.run('INSERT INTO raters (name, email, password_hash, superuser) VALUES (?, ?, ?, ?)', 'Schipper Eva', 'eva', sha256('eva123'), 1);
        db.run('INSERT INTO raters (name, email, password_hash, superuser) VALUES (?, ?, ?, ?)', 'Thijs', 'thijs', sha256('thijs123'), 1);
        db.run('INSERT INTO raters (name, email, password_hash, superuser) VALUES (?, ?, ?, ?)', 'Laurence', 'laurence', sha256('laurence123'), 1);
        db.run('INSERT INTO raters (name, email, password_hash, superuser) VALUES (?, ?, ?, ?)', 'Tobias', 'tobias', sha256('tobias123'), 1);
        
        let members = [];
        
        if (fs.existsSync(__dirname + '/member_seed.txt')) {
            members = fs.readFileSync(__dirname + '/member_seed.txt', 'utf8').trim().split('\n').map((name) => name.trim());
        }
    
        members.forEach((name) => db.run('INSERT INTO members (name) VALUES (?)', name));
    
        criteria.forEach((captionSet) => {
            db.run('INSERT INTO criteria_captions (caption) VALUES (?)', captionSet.caption, function (err, row) {
                if (err) {
                    throw err;
                }
    
                const captionID = this.lastID;
    
                let timestamp = helpers.getTimestamp() - 200000;
    
                captionSet.criteria.forEach((criterion) => {
                    db.run('INSERT INTO criteria (criterion, criteria_caption_id) VALUES (?, ?)', criterion, captionID, function (err) {
                        if (err) {
                            throw err;
                        }
    
                        const lastID = this.lastID;
                        members.forEach((v, k) => {
                            db.run('INSERT INTO ratings (member_id, criterion_id, rater_id, level, remark, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
                            k + 1, lastID, Math.floor(Math.random() * 3) + 1, Math.floor(Math.random() * 2) + 1, Math.random() > 0.5 ? "Just doesn't get it" : null, timestamp - 36000000);
                            timestamp ++;
                            db.run('INSERT INTO ratings (member_id, criterion_id, rater_id, level, remark, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
                            k + 1, lastID, Math.floor(Math.random() * 3) + 1, Math.floor(Math.random() * 4) + 3, Math.random() > 0.5 ? "Can keep the boat afloat" : null, timestamp);
                            timestamp ++;
                        });
                    });
                });
            });
        });
    });
};