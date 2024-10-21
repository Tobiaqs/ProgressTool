module.exports = (dbMethods, middleware) => {
    const express = require('express');

    const api = express();
    api.use('/', require('body-parser').json());

    api.post('/create_auth_token', (req, res) => {
        dbMethods.createAuthToken(req.body.username, req.body.password, (authToken) => {
            res.json({ auth_token: authToken });
        });
    });
    
    api.post('/verify_auth_token', (req, res) => {
        dbMethods.verifyAuthToken(req.body.auth_token, (isValid) => {
            res.json({ is_valid: isValid });
        });
    });
    
    api.post('/change_password', middleware.authToken, (req, res) => {
        dbMethods.changePassword(req.$authToken, req.body.old_password, req.body.new_password, (success) => {
            res.json({ success: success });
        });
    });
    
    api.get('/rater', middleware.authToken, (req, res) => {
        dbMethods.getRater(req.$raterId, (rater) => {
            res.json({ rater: rater });
        })
    });
    
    api.get('/criterion/:criterionId', middleware.authToken, middleware.needParamCriterionId, (req, res) => {
        dbMethods.getCriterion(req.params.criterionId, (criterion) => {
            res.json({ criterion: criterion });
        });
    });
    
    api.get('/members', middleware.authToken, (req, res) => {
        dbMethods.getMembers((members) => {
            res.json({ members: members });
        });
    });
    
    api.put('/members', middleware.authToken, middleware.needMemberWithName, (req, res) => {
        dbMethods.addMember(req.body.member.name, (id) => {
            res.json({ member: { id: id, name: req.body.member.name } });
        });
    });
    
    api.get('/members/:id', middleware.authToken, middleware.needParamId, (req, res) => {
        dbMethods.getMember(req.params.id, (member) => {
            res.json({ member: member });
        });
    });
    
    api.post('/members/:id', middleware.authToken, middleware.needParamId, middleware.needMemberWithName, (req, res) => {
        dbMethods.updateMember(req.params.id, req.body.member.name, () => {
            res.json({ success: true });
        });
    });
    
    api.delete('/members/:id', middleware.authToken, middleware.needParamId, (req, res) => {
        dbMethods.deleteMember(req.params.id, () => {
            res.json({ success: true });
        });
    });

    api.get('/members/:id/share_token', middleware.needParamId, (req, res) => {
        dbMethods.getShareToken(req.params.id, (share_token) => {
            res.json({ share_token: share_token });
        });
    });

    api.get('/members/report/:share_token', middleware.needParamShareToken, (req, res) => {
        dbMethods.getMemberByShareToken(req.params.share_token, (member) => {
            dbMethods.getCriteriaCaptionsWithCriteria((criteriaCaptions) => {
                dbMethods.getLatestRatings(member.id, (latestRatings) => {
                    res.json({
                        member: member,
                        criteria_captions: criteriaCaptions,
                        latest_ratings: latestRatings
                    });
                });
            });
        });
    });

    api.get('/members/:id/report', middleware.needParamId, (req, res) => {
        dbMethods.getMember(req.params.id, (member) => {
            dbMethods.getCriteriaCaptionsWithCriteria((criteriaCaptions) => {
                dbMethods.getLatestRatings(req.params.id, (latestRatings) => {
                    res.json({
                        member: member,
                        criteria_captions: criteriaCaptions,
                        latest_ratings: latestRatings
                    });
                });
            });
        });
    });
    
    api.get('/criteria_captions_with_criteria', middleware.authToken, (req, res) => {
        dbMethods.getCriteriaCaptionsWithCriteria((criteriaCaptions) => {
            res.json({ criteria_captions: criteriaCaptions });
        });
    });
    
    api.get('/members/:id/latest_ratings', middleware.authToken, middleware.needParamId, (req, res) => {
        dbMethods.getLatestRatings(req.params.id, (latestRatings) => {
            res.json({ latest_ratings: latestRatings });
        });
    });
    
    api.get('/members/:id/ratings_for_criterion/:criterionId',
        middleware.authToken, middleware.needParamId, middleware.needParamCriterionId, (req, res) => {
        dbMethods.getRatingsForCriterion(req.params.id, req.params.criterionId, (ratings) => {
            res.json({ ratings: ratings });
        });
    });
    
    api.post('/members/:id/ratings/:ratingId',
        middleware.authToken, middleware.needParamId, middleware.needParamRatingId, middleware.needRating, (req, res) => {
        dbMethods.updateRating(req.params.id, req.params.ratingId, req.$raterId, req.body.rating, () => {
            res.json({ success: true });
        });
    });

    api.delete('/members/:id/ratings/:ratingId',
        middleware.authToken, middleware.needParamId, middleware.needParamRatingId, (req, res) => {
        dbMethods.deleteRating(req.params.id, req.params.ratingId, req.$raterId, () => {
            res.json({ success: true });
        });
    });
    
    api.put('/members/:id/ratings_for_criterion/:criterionId',
        middleware.authToken, middleware.needParamId, middleware.needParamCriterionId, middleware.needRating, (req, res) => {
        dbMethods.addRatingForCriterion(req.params.id, req.params.criterionId, req.$raterId, req.body.rating, () => {
            res.json({ success: true });
        });
    });

    return api;
};
