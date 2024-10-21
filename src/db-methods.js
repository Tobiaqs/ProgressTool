module.exports = (db) => {
    const sha256 = require('sha256');
    const uuid = require('uuid');
    const helpers = require('./helpers');

    return {
        verifyAuthToken (authToken, cb) {
            db.get('SELECT id, expiry_timestamp FROM auth_tokens WHERE auth_token = ?', authToken, (err, row) => {
                if (err) {
                    throw err;
                }
        
                if (!row) {
                    return cb(false);
                }
                
                if (row.expiry_timestamp > helpers.getTimestamp()) {
                    db.run('UPDATE auth_tokens SET expiry_timestamp = ? WHERE id = ?', helpers.getNewExpiryTimestamp(), row.id, (err) => {
                        if (err) {
                            throw err;
                        }
        
                        cb(true);
                    });
                } else {
                    cb(false);
                }
            });
        },
        
        createAuthToken (username, password, cb) {
            db.get('SELECT id FROM raters WHERE username = ? AND password_hash = ?', username, sha256(password), (err, row) => {
                if (err) {
                    throw err;
                }
        
                if (!row) {
                    return cb(null);
                }
        
                const authToken = uuid.v4();
        
                db.run('INSERT INTO auth_tokens (auth_token, expiry_timestamp, rater_id) VALUES (?, ?, ?)',
                                authToken, helpers.getNewExpiryTimestamp(), row.id, (err) => {
                    if (err) {
                        throw err;
                    }
        
                    cb(authToken)
                });
            });
        },
        
        changePassword (authToken, oldPassword, newPassword, cb) {
            if (newPassword.length < 7) {
                return cb(false);
            }
            
            db.get('SELECT id FROM raters WHERE id IN (SELECT rater_id FROM auth_tokens WHERE auth_token = ?) AND password_hash = ?',
                            authToken, sha256(oldPassword), (err, row) => {
                if (err) {
                    throw err;
                }
        
                if (!row) {
                    return cb(false);
                }
        
                db.run('UPDATE raters SET password_hash = ? WHERE id = ?',
                                sha256(newPassword), row.id, (err) => {
                    if (err) {
                        throw err;
                    }
        
                    cb(true);
                });
            });
        },

        getShareToken (memberId, cb) {
            db.get('SELECT share_token FROM members WHERE id = ?', memberId, (err, row) => {
                if (err) {
                    throw err;
                }
        
                if (!row) {
                    return cb(null);
                }
                
                if (row.share_token) {
                    cb(row.share_token);
                } else {
                    const shareToken = uuid.v4();

                    db.run('UPDATE members SET share_token = ? WHERE id = ?', shareToken, memberId, (err) => {
                        if (err) {
                            throw err;
                        }

                        cb(shareToken);
                    });
                }
            });
        },
        
        getRater (raterId, cb) {
            db.get('SELECT id, name FROM raters WHERE id = ?', raterId, (err, rater) => {
                if (err) {
                    throw err;
                }
        
                cb(rater);
            });
        },
        
        getMembers (cb) {
            db.all(`
                SELECT
                    m.id AS id,
                    m.name AS name,
                    raters.name AS rater_name,
                    (
                        SELECT r.rater_id
                        FROM ratings r
                        WHERE r.member_id = m.id
                        ORDER BY r.timestamp DESC
                        LIMIT 1
                    ) AS rater_id
                FROM members m
                LEFT JOIN raters
                ON raters.id = rater_id
            `, (err, rows) => {
                if (err) {
                    throw err;
                }
        
                cb(rows);
            });
        },
        
        getMember (id, cb) {
            db.get('SELECT * FROM members WHERE id = ?', id, (err, row) => {
                if (err) {
                    throw err;
                }

                delete row['share_token'];
        
                cb(row);
            });
        },

        getMemberByShareToken (share_token, cb) {
            db.get('SELECT * FROM members WHERE share_token = ?', share_token, (err, row) => {
                if (err) {
                    throw err;
                }

                delete row['share_token'];
        
                cb(row);
            });
        },
        
        addMember (name, cb) {
            db.run('INSERT INTO members (name) VALUES (?)', name, function (err) {
                if (err) {
                    throw err;
                }
        
                cb(this.lastID);
            });
        },
        
        updateMember (id, name, cb) {
            db.run('UPDATE members SET name = ? WHERE id = ?', name, id, (err) => {
                if (err) {
                    throw err;
                }
        
                cb();
            });
        },
        
        deleteMember (id, cb) {
            db.run('DELETE FROM members WHERE id = ?', id, (err) => {
                if (err) {
                    throw err;
                }
        
                cb();
            });
        },
        
        getCriteriaCaptionsWithCriteria (cb) {
            db.all('SELECT * FROM criteria_captions', (err, criteriaCaptions) => {
                if (err) {
                    throw err;
                }
                
                let count = 0;
                criteriaCaptions.forEach((criteriaCaption) => {
                    db.all('SELECT id, criterion FROM criteria WHERE criteria_caption_id = ?', criteriaCaption.id, (err, criteria) => {
                        count ++;
                        
                        criteriaCaption.criteria = criteria;
        
                        if (count === criteriaCaptions.length) {
                            cb(criteriaCaptions);
                        }
                    });
                });
            });
        },
        
        getCriterion (criterionId, cb) {
            db.get('SELECT criterion FROM criteria WHERE id = ?', criterionId, (err, criterion) => {
                if (err) {
                    throw err;
                }
        
                cb(criterion);
            });
        },
        
        getLatestRatings (memberId, cb) {
            db.all(`
                SELECT
                    x.criterion_id AS criterion_id,
                    x.level AS level,
                    x.remark AS remark,
                    x.timestamp AS timestamp,
                    r.name AS rater_name,
                    x.rater_id AS rater_id
                FROM (
                    SELECT *
                    FROM ratings
                    ORDER BY timestamp ASC
                ) AS x
                LEFT JOIN raters r ON x.rater_id = r.id
                WHERE x.member_id = ?
                GROUP BY x.criterion_id
            `, memberId, (err, latestRatings) => {
                if (err) {
                    throw err;
                }
                
                cb(latestRatings);
            });
        },
        
        getRatingsForCriterion (memberId, criterionId, cb) {
            db.all(`
                SELECT
                    ratings.id AS id,
                    ratings.level AS level,
                    ratings.remark AS remark,
                    ratings.timestamp AS timestamp,
                    raters.name AS rater_name,
                    ratings.rater_id AS rater_id
                FROM ratings
                LEFT JOIN raters ON ratings.rater_id = raters.id
                WHERE ratings.member_id = ?
                AND ratings.criterion_id = ?
                ORDER BY ratings.timestamp DESC
            `, memberId, criterionId, (err, ratings) => {
                if (err) {
                    throw err;
                }
                
                cb(ratings);
            });
        },
        
        updateRating (memberId, ratingId, raterId, rating, cb) {
            db.get('SELECT id FROM ratings WHERE rater_id = ? AND id = ? AND member_id = ?', raterId, ratingId, memberId, (err, row) => {
                if (err) {
                    throw err;
                }
        
                if (!row) {
                    return cb(false);
                }
        
                db.run('UPDATE ratings SET remark = ? WHERE id = ? AND member_id = ?', rating.remark, ratingId, memberId, (err) => {
                    if (err) {
                        throw err;
                    }
        
                    cb(true);
                });
            });
        },

        deleteRating (memberId, ratingId, raterId, cb) {
            db.get('DELETE FROM ratings WHERE rater_id = ? AND id = ? AND member_id = ?', raterId, ratingId, memberId, (err) => {
                if (err) {
                    throw err;
                }
        
                cb(true);
            });
        },
        
        addRatingForCriterion (memberId, criterionId, raterId, rating, cb) {
            db.run(`
                INSERT INTO ratings (
                    member_id,
                    criterion_id,
                    rater_id,
                    level,
                    remark,
                    timestamp
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, memberId, criterionId, raterId, rating.level, rating.remark, helpers.getTimestamp(), (err) => {
                if (err) {
                    throw err;
                }
        
                cb();
            });
        }
    };
};
