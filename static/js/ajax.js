'use strict';

(() => {
    function Ajax (getAuthToken, ajaxErrorHandler) {
        this.getAuthToken = getAuthToken;
        this.ajaxErrorHandler = ajaxErrorHandler;
    };

    Ajax.prototype._fetch = function () {
        return fetch.apply(window, arguments).then((result) => {
            if (result.status < 200 || result.status > 299) {
                this.ajaxErrorHandler();
                throw "HTTP response code out of range."
            } else {
                return result;
            }
        });
    };
    
    /**
     * Asynchronous method that changes a password.
     */
    Ajax.prototype.changePassword = function (oldPassword, newPassword) {
        return this._fetch('/api/change_password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': this.getAuthToken()
            },
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
        })
        .then((body) => body.json());
    };
    
    /**
     * Asynchronous method that creates an auth token based on
     * email and password.
     */
    Ajax.prototype.createAuthToken = function (email, password) {
        return this._fetch('/api/create_auth_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, password: password })
        })
        .then((body) => body.json())
        .then((json) => json.auth_token);
    };
    
    /**
     * Asynchronous method that verifies whether an authToken is
     * still valid.
     */
    Ajax.prototype.verifyAuthToken = function (authToken) {
        return this._fetch('/api/verify_auth_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ auth_token: authToken })
        })
        .then((body) => body.json())
        .then((json) => json.is_valid);
    };
    
    /**
     * Asynchronous method that gets a list of members.
     */
    Ajax.prototype.getMembers = function () {
        return this._fetch('/api/members', {
            method: 'GET',
            headers: {
                'X-Auth-Token': this.getAuthToken()
            }
        })
        .then((body) => body.json())
        .then((json) => json.members);
    };
    
    /**
     * Asynchronous method that gets a single member.
     */
    Ajax.prototype.getMember = function (memberId) {
        return this._fetch('/api/members/' + memberId, {
            method: 'GET',
            headers: {
                'X-Auth-Token': this.getAuthToken()
            }
        })
        .then((body) => body.json())
        .then((json) => json.member);
    };
    
    /**
     * Asynchronous method that gets a structure containing criteria.
     */
    Ajax.prototype.getCriteriaCaptionsWithCriteria = function () {
        return this._fetch('/api/criteria_captions_with_criteria', {
            method: 'GET',
            headers: {
                'X-Auth-Token': this.getAuthToken()
            }
        })
        .then((body) => body.json())
        .then((json) => json.criteria_captions);
    };

    /**
     * Asynchronous method that gets a criterion by ID.
     */
    Ajax.prototype.getCriterion = function (criterionId) {
        return this._fetch('/api/criterion/' + criterionId, {
            method: 'GET',
            headers: {
                'X-Auth-Token': this.getAuthToken()
            }
        })
        .then((body) => body.json())
        .then((json) => json.criterion);
    };

    /**
     * Asynchronous method that gets a member's ratings for a criterion.
     */
    Ajax.prototype.getRatingsForCriterion = function (memberId, criterionId) {
        return this._fetch('/api/members/' + memberId + '/ratings_for_criterion/' + criterionId, {
            method: 'GET',
            headers: {
                'X-Auth-Token': this.getAuthToken()
            }
        })
        .then((body) => body.json())
        .then((json) => json.ratings);
    };

    /**
     * Asynchronous method that gets a member's ratings for a criterion.
     */
    Ajax.prototype.addRatingForCriterion = function (memberId, criterionId, rating) {
        return this._fetch('/api/members/' + memberId + '/ratings_for_criterion/' + criterionId, {
            method: 'PUT',
            headers: {
                'X-Auth-Token': this.getAuthToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rating: rating })
        })
        .then((body) => body.json())
        .then((json) => json.success);
    };

    /**
     * Asynchronous method that updates a member's ratings.
     */
    Ajax.prototype.updateRating = function (memberId, ratingId, rating) {
        return this._fetch('/api/members/' + memberId + '/ratings/' + ratingId, {
            method: 'POST',
            headers: {
                'X-Auth-Token': this.getAuthToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rating: rating })
        })
        .then((body) => body.json())
        .then((json) => json.success);
    };

    /**
     * Asynchronous method that gets a member's latest ratings.
     */
    Ajax.prototype.getLatestRatings = function (memberId) {
        return this._fetch('/api/members/' + memberId + '/latest_ratings', {
            method: 'GET',
            headers: {
                'X-Auth-Token': this.getAuthToken()
            }
        })
        .then((body) => body.json())
        .then((json) => json.latest_ratings);
    };

    /**
     * Asynchronous method that gets the rater's name and ID.
     */
    Ajax.prototype.getRater = function () {
        return this._fetch('/api/rater', {
            method: 'GET',
            headers: {
                'X-Auth-Token': this.getAuthToken()
            }
        })
        .then((body) => body.json())
        .then((json) => json.rater);
    };

    /**
     * Asynchronous method that adds a member.
     */
    Ajax.prototype.addMember = function (member) {
        return this._fetch('/api/members', {
            method: 'PUT',
            headers: {
                'X-Auth-Token': this.getAuthToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ member: member })
        })
        .then((body) => body.json())
        .then((json) => json.member);
    };

    /**
     * Asynchronous method that removes a member.
     */
    Ajax.prototype.deleteMember = function (member) {
        return this._fetch('/api/members/' + member.id, {
            method: 'DELETE',
            headers: {
                'X-Auth-Token': this.getAuthToken()
            }
        })
        .then((body) => body.json())
        .then((json) => json.success);
    };

    /**
     * Asynchronous method that updates a member.
     */
    Ajax.prototype.updateMember = function (member) {
        return this._fetch('/api/members/' + member.id, {
            method: 'POST',
            headers: {
                'X-Auth-Token': this.getAuthToken(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ member: member })
        })
        .then((body) => body.json())
        .then((json) => json.success);
    };

    // Ensure existence of ProgressTool in window.
    window.ProgressTool = window.ProgressTool || {};

    // Set Ajax in the global object.
    window.ProgressTool.Ajax = Ajax;
})();
