'use strict';

(() => {
    // Ensure existence of ProgressTool in window.
    window.ProgressTool = window.ProgressTool || {};

    // The levels that can be used in a rating
    const levels = [1, 2, 3, 4, 5, 6];

    // Sharing services
    const sharingServices = [
        {
            name: 'WhatsApp',
            share (url, caption) {
                window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(caption ? (caption + '\n' + url) : ''));
            }
        },

        {
            name: 'Telegram',
            share (url, caption) {
                window.open('https://telegram.me/share/url?url=' + encodeURIComponent(url) + (caption ? '&text=' + encodeURIComponent(caption) : ''));
            }
        },

        {
            name: 'Email',
            share (url, caption) {
                location.href = 'mailto:?body=' + encodeURIComponent(caption ? caption + '\n' + url : url) + (caption ? '&subject=' + encodeURIComponent(caption) : '');
            }
        }
    ];

    /**
     * Returns a label for a level.
     */
    function getLevelLabel (level) {
        switch (level) {
            case 1: return "True beginner";
            case 2: return "Beginner";
            case 3: return "Getting there";
            case 4: return "Aspirant";
            case 5: return "Skipper I";
            case 6: return "Skipper II";
        }
    };

    window.ProgressTool.components = (getRouter, ajax, events, appMethods) => {
        return {
            // Home page component
            Home: {
                template: `
                    <div>
                        <div class="centered-with-padding">
                            <h1>Progress Tool</h1>
                            <p class="lead">With this tool, skippers can track the progress of members with regard to their sailing skills.</p>
                            <router-link tag="button" class="btn btn-primary" to="sign-in" v-if="!$parent.signedIn">Sign In</router-link>
                            <router-link tag="button" class="btn btn-primary" to="members" v-if="$parent.signedIn">Members List</router-link>
                        </div>
                        <div class="row">
                        <div class="col-md-6">
                            <h2>Features to be implemented</h2>
                            <ul>
                                <li>Reset password through email</li>
                                <li>Superuser options such as creating accounts, promoting others to superuser</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h2>Ideas</h2>
                            <ul>
                                <li>Skipper avatars</li>
                                <li>Integration with member management system</li>
                            </ul>
                        </div>
                        <div class="col-md-6">
                            <h2>Backend wishlist</h2>
                            <ul>
                                <li>Database migration</li>
                                <li>Schema validation</li>
                            </ul>
                        </div>
                    </div>
                `
            },
    
            // Sign in page component
            SignIn: {
                /**
                 * Simple sign in page with two fields and a button.
                 */
                template: `
                    <div class="centered-with-padding">
                        <h1>Sign in</h1>
                        <div class="form-signin">
                            <label for="inputUsername" class="sr-only">Username</label>
                            <input type="email" class="form-control" placeholder="Username" required autofocus v-model="username" v-on:keydown="keyDown">
                            <label for="inputPassword" class="sr-only">Password</label>
                            <input type="password" class="form-control" placeholder="Password" required v-model="password" v-on:keydown="keyDown">
                            <button class="btn btn-lg btn-primary btn-block" v-on:click="signIn()">Sign in</button>
                            <small class="form-text text-wrong-credentials" v-if="wrongCredentialsEntered">
                                The entered credentials are incorrect.
                            </small>
                        </div>
                    </div>
                `,
                methods: {
                    /**
                     * This method will sign in the user by creating an auth token,
                     * and is called after the sign in button is pressed.
                     */
                    signIn () {
                        // Show modal loading animation
                        appMethods.setIsLoading(true);
    
                        ajax.createAuthToken(this.username, this.password).then((newAuthToken) => {
                            // Result's in
    
                            // Hide the modal loading animation
                            appMethods.setIsLoading(false);
    
                            if (newAuthToken) {
                                // Store auth token
                                appMethods.setVerifiedAuthToken(newAuthToken);
    
                                // ... and redirect to the context-aware home page route
                                getRouter().push('/');
                            } else {
                                // Token not valid? Remove the auth token from memory and storage
                                appMethods.setVerifiedAuthToken(null);
    
                                this.wrongCredentialsEntered = true;
                            }
                        });
                    },

                    keyDown (e) {
                        if (e.keyCode === 13) {
                            this.signIn();
                        }
                    }
                },
                data: () => {
                    return {
                        username: '',
                        password: '',
                        wrongCredentialsEntered: false
                    };
                }
            },
    
            // Members component
            Members: {
                /**
                 * Template containing a list of members. The list's bottom entry is a link
                 * that links to a popup for creating members.
                 */
                template: `
                    <div class="centered-with-padding">
                        <h1>Members List</h1>
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item list-group-item-member clickable" v-for="member in members" v-on:click="showMember(member)">
                                {{ member.name }}
                                <span>
                                    <br>
                                    <small v-if="member.rater_name">Most recently rated by {{ member.rater_name }}</small>
                                    <small v-if="!member.rater_name">Has not been rated</small>
                                </span>
                            </li>
                            <li class="list-group-item clickable list-group-item-success" v-on:click="addMember()">Add a member</li>
                        </ul>
                    </div>
                `,
                methods: {
                    /** 
                     * Method that loads the required resources for this component.
                     */
                    loadResources () {
                        // Show modal loading animation
                        appMethods.setIsLoading(true);
    
                        // Get the members list and sort it alphabetically.
                        ajax.getMembers().then((members) => {
                            this.membersSorted = members.sort((a, b) => {
                                const aLower = a.name.toLowerCase(),
                                    bLower = b.name.toLowerCase();
                                
                                if (aLower > bLower) {
                                    return 1;
                                } else if (bLower > aLower) {
                                    return -1;
                                }
                                
                                return 0;
                            });
    
                            this.members = this.membersSorted;
    
                            // Hide modal loading animation
                            appMethods.setIsLoading(false);
                        });
                    },
    
                    /**
                     * Method that redirects the user to the member state once a member is clicked.
                     */
                    showMember (member) {
                        events.emit('resetSearchField');
    
                        getRouter().push({ name: 'member', params: { memberId: member.id }})
                    },
    
                    /** 
                     * Opens a popup and allows the user to add members to the list.
                     */
                    addMember () {
                        swal({
                            content: {
                                element: 'input',
                                attributes: {
                                    placeholder: 'Name of the member',
                                    type: 'text'
                                }
                            },
                            title: 'Add a member',
                            buttons: ['Cancel', 'Save']
                        }).then((result) => {
                            if (result === null) {
                                return;
                            }
    
                            if (result.trim().length > 0) {
                                appMethods.setIsLoadingSubtle(true);

                                ajax.addMember({ name: result.trim() }).then((member) => {
                                    appMethods.setIsLoadingSubtle(false);

                                    if (member) {
                                        getRouter().push({ name: 'member', params: { memberId: member.id } });
                                    } else {
                                        swal({
                                            icon: 'error',
                                            text: 'This action cannot be carried out for some reason.'
                                        });
                                    }
                                });
                            } else {
                                swal({
                                    icon: 'error',
                                    text: 'The "name" field cannot be empty.'
                                });
                            }
                        });
                    }
                },
                
                created () {
                    this.loadResources();
    
                    events.addListener('searchQueryUpdated', () => {
                        if (appMethods.getSearchQuery() && appMethods.getSearchQuery().length > 0) {
                            this.members = this.membersSorted.filter((member) => member.name.toLowerCase().indexOf(appMethods.getSearchQuery().trim().toLowerCase()) !== -1);
                        } else {
                            this.members = this.membersSorted;
                        }
                    });
                },
    
                destroyed () {
                    events.removeAllListeners('searchQueryUpdated');
                },
    
                data: () => {
                    return {
                        members: [],
                        membersSorted: []
                    };
                }
            },
    
            // Member component
            Member: {
                props: ['memberId', 'shareToken'],
                /**
                 * This template is the most complicated one. It displays an overview of ratings for a member,
                 * and also allows the rater to quickly add new ratings.
                 */
                template: `
                    <div>
                        <div class="centered">
                            <h1>Progress Report</h1>
                            <h3>{{ member ? member.name : '' }}</h3>
                            <div v-if="this.memberId" class="btn-group mt-2" role="group" aria-label="Update member">
                                <button type="button" class="btn btn-secondary" v-on:click="changeMemberName(member)">Rename</button>
                                <button type="button" class="btn btn-danger" v-on:click="deleteMember(member)">Delete</button>
                                <button type="button" class="btn btn-primary" v-on:click="shareReport(member)">Share</button>
                            </div>
                        </div>
                        <div class="row" v-bind:class="{ 'disable-clicks': this.shareToken }">
                            <div class="col-md-6 col-xl-4 col-xxxl-3" v-for="criteriaCaption in criteriaCaptions">
                                <div class="card mt-4">
                                    <div class="card-body">
                                        <h5 class="card-title">{{ criteriaCaption.caption }}</h5>
                                        <ul class="list-group">
                                            <li
                                                class="list-group-item list-group-item-criterion level-bg-line"
                                                v-for="criterion in criteriaCaption.criteria"
                                                v-bind:class="{ 'clickable': !fastRatingStagedLevels[criterion.id] }"
                                                :data-level="showLevels ? getLatestRatingLevel(criterion) : 0"
                                                v-on:click="viewCriterion(criterion)">
    
                                                {{ criterion.criterion }}
                                                <br>
                                                <small class="text-muted">
                                                    {{ getLevelLabel(fastRatingStagedLevels[criterion.id] || getLatestRatingLevel(criterion)) || '-' }}
                                                    
                                                    <span v-if="
                                                    (
                                                        !fastRatingStagedLevels[criterion.id]
                                                        && getLatestRating(criterion)
                                                        && getLatestRating(criterion).remark
                                                    ) || (
                                                        fastRatingStagedRemarks[criterion.id] && fastRatingStagedLevels[criterion.id]
                                                    )">
    
                                                            - <i>“{{
                                                            !fastRatingStagedLevels[criterion.id]
                                                            && getLatestRating(criterion)
                                                            && getLatestRating(criterion).remark
                                                                ? getLatestRating(criterion).remark
                                                                : fastRatingStagedRemarks[criterion.id]
                                                        }}”</i>
    
                                                    </span>
                                                </small>
    
                                                <br>
                                                <div class="btn-level-group-wrapper mt-2 mb-3">
                                                    <div class="btn-group btn-level-group" role="group" aria-label="Add rating">
                                                        <button
                                                            type="button"
                                                            :title="getLevelLabel(level)"
                                                            v-for="level in levels"
                                                            class="btn btn-level"
                                                            :data-level="level"
                                                            v-bind:class="{ 'btn-level-current': (!fastRatingStagedLevels[criterion.id] && getLatestRatingLevel(criterion) === level) || fastRatingStagedLevels[criterion.id] === level }"
                                                            v-on:click.stop.prevent="fastRatingSelectLevel(criterion, level, $event)">
    
                                                            {{ level }}
                                                            
                                                        </button>
                                                    </div>
                                                </div>
    
                                                <div class="form-group" v-if="fastRatingStagedLevels[criterion.id]">
                                                    <input
                                                        type="text"
                                                        class="form-control"
                                                        placeholder="Remarks"
                                                        v-model="fastRatingStagedRemarks[criterion.id]"
                                                        v-on:click.stop.prevent>
                                                    <div class="mt-3 right-aligned">
                                                        <button class="btn btn-secondary" v-on:click.stop.prevent="fastRatingCancel(criterion, $event)">Cancel</button>
                                                        <button class="btn btn-primary" v-on:click.stop.prevent="fastRatingSave(criterion, $event)">Save</button>
                                                    </div>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
    
                methods: {
                    /**
                     * Loads the required data from the API for the member screen.
                     */
                    loadResources () {
                        appMethods.setIsLoading(true);
    
                        // showLevels requires some explaination. Its value is false
                        // by default. Once all data is loaded, it's set to true after
                        // 100 ms. This is done to ensure the level background animation
                        // works instead of the background just being there and not animating.
                        this.showLevels = false;
                        
                        this.member = null;
                        this.latestRatings = null;
                        this.criteriaCaptions = null;

                        let promise;

                        if (this.memberId) {
                            promise = ajax.getReport(this.memberId);
                        } else if (this.shareToken) {
                            promise = ajax.getReportByShareToken(this.shareToken);
                        }

                        promise.then((results) => {
                            this.member = results.member;
                            this.latestRatings = results.latest_ratings;
                            this.criteriaCaptions = results.criteria_captions;
    
                            appMethods.setIsLoading(false);
    
                            setTimeout(() => {
                                this.showLevels = true;
                            }, 100);
                        });
                    },
    
                    reloadLatestRatings () {
                        appMethods.setIsLoadingSubtle(true);

                        ajax.getLatestRatings(this.memberId).then((latestRatings) => {
                            this.latestRatings = latestRatings;

                            appMethods.setIsLoadingSubtle(false);
                        });
                    },
    
                    getLatestRating (criterion) {
                        if (this.latestRatings) {
                            return this.latestRatings.find((rating) => rating.criterion_id === criterion.id);
                        } else {
                            return null;
                        }
                    },
    
                    getLatestRatingLevel (criterion) {
                        const rating = this.getLatestRating(criterion);
    
                        return rating ? rating.level : null;
                    },
    
                    viewCriterion (criterion) {
                        if (this.fastRatingStagedLevels[criterion.id]) {
                            return;
                        }

                        getRouter().push({ name: 'criterion', params: { memberId: this.memberId, criterionId: criterion.id } })
                    },

                    shareReport (member) {
                        getRouter().push({ name: 'share-report', params: { memberId: this.member.id } })
                    },
    
                    changeMemberName (member) {
                        swal({
                            content: {
                                element: 'input',
                                attributes: {
                                    placeholder: 'Name of the member',
                                    type: 'text',
                                    value: member.name
                                }
                            },
                            title: 'Rename member',
                            buttons: ['Cancel', 'Save']
                        }).then((result) => {
                            if (result === null) {
                                return;
                            }
    
                            // Workaround for weird swal problem
                            // where result = "" when the value is
                            // equal to the initial value
                            result = $('.swal-content__input').val();
    
                            if (result.trim().length > 0) {
                                member.name = result.trim();

                                appMethods.setIsLoadingSubtle(true);

                                ajax.updateMember(member).then((success) => {
                                    appMethods.setIsLoadingSubtle(false);

                                    if (success) {
                                        this.$set(this.member, 'name', member.name);
                                    } else {
                                        swal({
                                            icon: 'error',
                                            text: 'This action cannot be carried out for some reason.'
                                        });
                                    }
                                });
                            } else {
                                swal({
                                    icon: 'error',
                                    text: 'The "name" field cannot be empty.'
                                });
                            }
                        });
                    },
    
                    deleteMember (member) {
                        swal({
                            text: 'Are you sure you want to remove ' + member.name + ' from the database, including their progress report?',
                            icon: 'warning',
                            buttons: ['Cancel', 'Remove']
                        }).then((result) => {
                            if (result) {
                                appMethods.setIsLoadingSubtle(true);

                                ajax.deleteMember(member).then((success) => {
                                    appMethods.setIsLoadingSubtle(false);

                                    if (!success) {
                                        swal({
                                            icon: 'error',
                                            text: 'This action cannot be carried out for some reason.'
                                        });
                                    }
    
                                    getRouter().push('/members');
                                });
                            }
                        })
                    },
    
                    getLevelLabel (level) {
                        return getLevelLabel(level);
                    },
    
                    fastRatingSelectLevel (criterion, level) {
                        const latestRating = this.getLatestRating(criterion);
                        const latestRatingLevel = latestRating ? latestRating.level : null;

                        if (this.fastRatingStagedLevels[criterion.id] === level || level === latestRatingLevel) {
                            this.$set(this.fastRatingStagedLevels, criterion.id, null);
                        } else {
                            this.$set(this.fastRatingStagedLevels, criterion.id, level);
                        }
                    },
    
                    fastRatingSave (criterion) {
                        const level = this.fastRatingStagedLevels[criterion.id];
                        let remark = this.fastRatingStagedRemarks[criterion.id];
    
                        if ((remark && remark.length === 0) || remark === undefined) {
                            remark = null;
                        }

                        appMethods.setIsLoadingSubtle(true);
    
                        ajax.addRatingForCriterion(this.memberId, criterion.id, { level: level, remark: remark }).then((success) => {
                            if (!success) {    
                                swal({
                                    icon: 'error',
                                    text: 'This action cannot be carried out for some reason.'
                                });
                                return;
                            }
    
                            this.fastRatingCancel(criterion);
                            
                            const latestRating = this.getLatestRating(criterion);
    
                            if (latestRating) {
                                this.$set(latestRating, 'level', level);
                                this.$set(latestRating, 'remark', remark);
                                // Note: at this point, raterId may not be accurate anymore in this.latestRatings!
                                // But this is not a big deal, as the raters aren't showed anywhere in this component.

                                appMethods.setIsLoadingSubtle(false);
                            } else {
                                this.reloadLatestRatings();
                            }
                        });
                    },
    
                    fastRatingCancel (criterion) {
                        this.$set(this.fastRatingStagedLevels, criterion.id, null);
                        this.$set(this.fastRatingStagedRemarks, criterion.id, null);
                    }
                },
    
                created () {
                    this.loadResources();
                },
    
                data: () => {
                    return {
                        member: null,
                        latestRatings: null,
                        criteriaCaptions: null,
                        showLevels: false,
                        levels: levels,
                        fastRatingStagedLevels: {},
                        fastRatingStagedRemarks: {}
                    };
                }
            },

            // ShareReport component
            ShareReport: {
                props: ['memberId'],

                template: `
                    <div class="centered-with-padding">
                        <h1>Progress Report</h1>
                        <h3>{{ member ? member.name : '' }}</h3>
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item list-group-item-service clickable" v-for="sharingService in sharingServices" v-on:click="shareWith(sharingService)">
                                {{ sharingService.name }}
                            </li>
                        </ul>
                        <textarea class="url-textarea">{{ this.getReportURL() }}</textarea>
                    </div>
                `,

                methods: {
                    /**
                     * Loads the required data from the API for the share report screen.
                     */
                    loadResources () {
                        appMethods.setIsLoading(true);
                        
                        this.member = null;
                        
                        Promise.all([
                            ajax.getMember(this.memberId),
                            ajax.getShareToken(this.memberId)
                        ]).then((results) => {
                            this.member = results[0];
                            this.shareToken = results[1];

                            appMethods.setIsLoading(false);
                        });
                    },

                    getReportURL() {
                        return location.protocol + '//' + location.host + '/#/members/report/' + this.shareToken;
                    },

                    shareWith (sharingService) {
                        sharingService.share(this.getReportURL(), 'Progress Report for ' + this.member.name);
                    }
                },

                created () {
                    this.loadResources();
                },

                data: () => {
                    return {
                        member: null,
                        sharingServices: sharingServices,
                        shareToken: null
                    };
                },
            },
    
            // Criterion component
            Criterion: {
                props: ['memberId', 'criterionId'],
                template: `
                    <div class="centered">
                        <h1>{{ criterion ? criterion.criterion : '' }}</h1>
                        <h3>{{ member ? member.name : '' }}</h3>
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">New rating</h5>
                                <div class="btn-group" role="group" aria-label="New rating">
                                    <button
                                        type="button"
                                        :title="getLevelLabel(level)"
                                        v-for="level in levels"
                                        class="btn btn-level"
                                        v-bind:class="{ 'btn-level-current': ratings && ratings.length !== 0 && level === ratings[0].level }"
                                        :data-level="level"
                                        v-on:click="addRating(level)">

                                        &nbsp;{{ level }}&nbsp;

                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="card mt-4">
                            <div class="card-body">
                                <h5 class="card-title mb-0">
                                    <span v-if="ratings && ratings.length === 0">There are no previous ratings</span>
                                    <span v-if="!ratings || ratings.length !== 0">Previous ratings</span>
                                </h5>
                                <div class="container">
                                    <div class="row">
                                        <div class="col-12" v-for="rating in ratings">
                                            <div class="card mt-4 level-bg" v-bind:class="{ 'clickable': rater.id === rating.rater_id }" :data-level="showLevels ? rating.level || 1 : 0" v-on:click="changeRemark(rating)">
                                                <div class="card-body">
                                                    <h5 class="card-title">Rated as {{ getLevelLabel(rating.level) }}</h5>
                                                    <h6 class="card-subtitle mb-2 text-muted">By {{ rating.rater_name }} on {{ getDateString(rating.timestamp) }}</h6>
                                                    <i v-if="rating.remark">“{{ rating.remark }}”</i>
                                                    <div v-if="rater.id === rating.rater_id"><small><i>Click here to {{ rating.remark ? 'change the' : 'add a' }} remark.</i></small></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                methods: {
                    loadResources () {
                        appMethods.setIsLoading(true);
    
                        this.showLevels = false;
                        this.member = null;
                        this.ratings = null;
                        this.criterion = null;
    
                        Promise.all([
                            ajax.getMember(this.memberId),
                            ajax.getRatingsForCriterion(this.memberId, this.criterionId),
                            ajax.getCriterion(this.criterionId),
                            ajax.getRater()
                        ]).then((results) => {
                            this.member = results[0];
                            this.ratings = results[1];
                            this.criterion = results[2];
                            this.rater = results[3];
    
                            appMethods.setIsLoading(false);
    
                            setTimeout(() => {
                                this.showLevels = true;
                            }, 100);
                        });
                    },
    
                    reloadRatings () {
                        appMethods.setIsLoadingSubtle(true);

                        this.showLevels = false;
    
                        ajax.getRatingsForCriterion(this.memberId, this.criterionId).then((ratings) => {
                            this.ratings = ratings;
    
                            appMethods.setIsLoadingSubtle(false);
    
                            setTimeout(() => {
                                this.showLevels = true;
                            }, 100);
                        })
                    },
    
                    getDateString (timestamp) {
                        return (new Date(timestamp * 1000)).toLocaleDateString('nl-NL');
                    },
    
                    getLevelLabel (level) {
                        return getLevelLabel(level);
                    },
    
                    addRating (level) {
                        if (this.ratings.length > 0 && this.ratings[0].level === level) {
                            swal({
                                icon: 'info',
                                text: 'This is the current rating for this member.'
                            });
                            return;
                        }

                        swal({
                            content: {
                                element: 'input',
                                attributes: {
                                    placeholder: 'Remarks',
                                    type: 'text'
                                }
                            },
                            title: this.getLevelLabel(level),
                            text: 'Any remarks about this rating?',
                            buttons: ['Cancel', 'Save']
                        }).then((result) => {
                            if (result === null) {
                                return;
                            }
    
                            appMethods.setIsLoadingSubtle(true);
    
                            ajax.addRatingForCriterion(this.memberId, this.criterionId, {
                                level: level,
                                remark: result.trim().length === 0 ? null : result.trim()
                            }).then((success) => {
                                if (!success) {
                                    swal({
                                        icon: 'error',
                                        text: 'This action cannot be carried out for some reason.'
                                    });
                                }
    
                                this.reloadRatings();
                            });
                        });
                    },
    
                    changeRemark (rating) {
                        if (rating.rater_id !== this.rater.id) {
                            return;
                        }
    
                        swal({
                            content: {
                                element: 'input',
                                attributes: {
                                    placeholder: 'Remarks',
                                    type: 'text',
                                    value: rating.remark
                                }
                            },
                            title: 'Change remarks',
                            buttons: {
                                cancel: {
                                    text: 'Cancel',
                                    value: null,
                                    visible: true,
                                },
                                delete: {
                                    text: 'Delete rating',
                                    value: false,
                                },
                                save: {
                                    text: 'Save',
                                    value: true,
                                },
                            },
                        }).then((result) => {
                            if (result === null) {
                                return;
                            }

                            if (result) {    
                                // Workaround for weird swal problem
                                // where result = "" when the value is
                                // equal to the initial value
                                result = $('.swal-content__input').val().trim();
        
                                rating.remark = result.length === 0 ? null : result;

                                appMethods.setIsLoadingSubtle(true);
        
                                ajax.updateRating(this.memberId, rating.id, rating).then((success) => {
                                    if (success) {
                                        this.$set(rating, 'remark', result);

                                        appMethods.setIsLoadingSubtle(false);
                                    } else {
                                        swal({
                                            icon: 'error',
                                            text: 'This action cannot be carried out for some reason.'
                                        });
        
                                        this.reloadRatings();
                                    }
                                });
                            } else {
                                swal({
                                    text: 'Are you sure you want to remove this rating from the database?',
                                    icon: 'warning',
                                    buttons: ['Cancel', 'Remove']
                                }).then((result) => {
                                    if (result) {
                                        appMethods.setIsLoadingSubtle(true);
        
                                        // Delete rating
                                        ajax.deleteRating(this.memberId, rating.id).then((success) => {
                                            if (success) {
                                                this.reloadRatings();
                                                appMethods.setIsLoadingSubtle(false);
                                            } else {
                                                swal({
                                                    icon: 'error',
                                                    text: 'This action cannot be carried out for some reason.'
                                                });
                                            }
                                        });
                                    }
                                })
                            }
                        });
                    }
                },

                created () {
                    this.loadResources();
                },

                data: () => {
                    return {
                        member: null,
                        ratings: null,
                        criterion: null,
                        rater: null,
                        showLevels: false,
                        levels: levels
                    };
                }
            },
    
            // Change password component
            ChangePassword: {
                template: `
                    <div class="centered-with-padding">
                        <h1>Change password</h1>
                        <div class="form-signin">
                            <label for="inputOldPassword" class="sr-only">Old password</label>
                            <input type="password" class="form-control" placeholder="Current password" required v-model="oldPassword">
                            <label for="inputNewPassword" class="sr-only">New password</label>
                            <input type="password" class="form-control" placeholder="New password" required v-model="newPassword">
                            <label for="inputNewPasswordAgain" class="sr-only">New password (again)</label>
                            <input type="password" class="form-control" placeholder="New password" required v-model="newPasswordAgain">
                            <button class="btn btn-lg btn-primary btn-block" v-on:click="passwordsSubmitted(oldPassword, newPassword, newPassword === newPasswordAgain)">Change password</button>
                            <small class="form-text text-wrong-credentials" v-if="oldPasswordWronglyEntered">
                                The old password was entered incorrectly.
                            </small>
                            <small class="form-text text-wrong-credentials" v-if="newPasswordTooShort">
                                The new password doesn't meet the requirement (at least 7 characters).
                            </small>
                            <small class="form-text text-wrong-credentials" v-if="newPasswordsNoMatch">
                                The values in the two "new password" fields do not match.
                            </small>
                        </div>
                    </div>
                `,
                data: () => {
                    return {
                        oldPassword: '',
                        newPassword: '',
                        newPasswordAgain: '',
                        oldPasswordWronglyEntered: false,
                        newPasswordTooShort: false,
                        newPasswordsNoMatch: false
                    };
                },
                methods: {
                    passwordsSubmitted (oldPassword, newPassword, match) {
                        this.oldPasswordWronglyEntered = false;
                        this.newPasswordTooShort = false;
                        this.newPasswordsNoMatch = false;
    
                        if (!match) {
                            this.newPasswordsNoMatch = true;
                            return;
                        }
    
                        if (newPassword.length < 8) {
                            this.newPasswordTooShort = true;
                            return;
                        }
    
                        const vm = this;
    
                        ajax.changePassword(oldPassword, newPassword).then((result) => {
                            if (result.success) {
                                swal('Great!', 'Password was successfully changed.', 'success');
                                setTimeout(() => getRouter().push('/'), 0);
                            } else {
                                vm.oldPasswordWronglyEntered = true;
                            }
                        });
                    }
                }
            },
    
            // Internal error component
            InternalError: {
                template: `
                    <div class="centered-with-padding">
                        <h1>500</h1>
                        <p class="lead">There's a problem we can't do anything about right now&#8230; Try refreshing the page or contacting Tobias Sytsma.</p>
                    </div>
                `
            },
    
            // Page not found component
            NotFound: {
                template: `
                    <div class="centered-with-padding">
                        <h1>404</h1>
                        <p class="lead">We were unable to find this page&#8230;</p>
                    </div>
                `
            }
        };
    };
})();
