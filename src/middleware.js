module.exports = (db) => {
    const helpers = require('./helpers');

    return {
        authToken (req, res, next) {
            const authToken = req.headers['x-auth-token'];
        
            if (!authToken) {
                return res.sendStatus(403);
            }
        
            db.get('SELECT id, rater_id, expiry_timestamp FROM auth_tokens WHERE auth_token = ?', authToken, (err, row) => {
                if (err) {
                    throw err;
                }
        
                if (!row) {
                    return res.sendStatus(403);
                }
        
                const raterId = row.rater_id;
        
                if (row.expiry_timestamp > helpers.getTimestamp()) {
                    db.run('UPDATE auth_tokens SET expiry_timestamp = ? WHERE id = ?', helpers.getNewExpiryTimestamp(), row.id, (err) => {
                        if (err) {
                            throw err;
                        }
        
                        req.$authToken = req.headers['x-auth-token'];
                        req.$raterId = raterId;
                        next();
                    });
                } else {
                    res.sendStatus(403);
                }
            });
        },
        
        needBodyId (req, res, next) {
            if ((typeof req.body.id) !== 'number') {
                res.sendStatus(500);
            } else {
                next();
            }
        },
        
        needParamId (req, res, next) {
            if ((typeof req.params.id) === 'string') {
                req.params.id = req.params.id * 1;
            }
        
            if ((typeof req.params.id) !== 'number') {
                res.sendStatus(500);
            } else {
                next();
            }
        },
        
        needParamCriterionId (req, res, next) {
            if ((typeof req.params.criterionId) === 'string') {
                req.params.criterionId = req.params.criterionId * 1;
            }
        
            if ((typeof req.params.criterionId) !== 'number') {
                res.sendStatus(500);
            } else {
                next();
            }
        },
        
        needParamRatingId (req, res, next) {
            if ((typeof req.params.ratingId) === 'string') {
                req.params.ratingId = req.params.ratingId * 1;
            }
        
            if ((typeof req.params.ratingId) !== 'number') {
                res.sendStatus(500);
            } else {
                next();
            }
        },
        
        needMemberWithName (req, res, next) {
            if (!req.body.member
                || (typeof req.body.member) !== 'object'
                || (typeof req.body.member.name) !== 'string'
                || req.body.member.name.length === 0) {
        
                res.sendStatus(500);
            } else {
                next();
            }
        },
        
        needRating (req, res, next) {
            if (!req.body.rating
                || (typeof req.body.rating) !== 'object'
                || (typeof req.body.rating.level) !== 'number'
                || Math.floor(req.body.rating.level) !== req.body.rating.level
                || req.body.rating.level > 6
                || req.body.rating.level < 1
                || !(req.body.rating.remark === null || (typeof req.body.rating.remark) === 'string')) {
        
                res.sendStatus(500);
            } else {
                next();
            }
        }
    };
};
