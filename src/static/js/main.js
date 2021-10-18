'use strict';

(() => {
    // Ensure existence of ProgressTool in window.
    window.ProgressTool = window.ProgressTool || {};

    // Enable VueRouter middleware
    Vue.use(VueRouter);

    // localStorage key for the auth token
    const LS_AUTH_TOKEN = 'auth_token';

    // Local variable holding the auth token
    let authToken = localStorage[LS_AUTH_TOKEN];

    // Flag identifying whether the auth token in the variable
    // authToken is verified
    let isAuthTokenVerified = false;

    // Flag identifying whether the modal loading animation is
    // visible.
    let isLoading = false;

    // Flag identifying whether fast rating mode is enabled.
    let fastRatingEnabled = false;

    // The current value of the search field.
    let searchQuery = '';

    // The ajax object
    const ajax = new ProgressTool.Ajax(() => authToken, () => {
        // Problem occurred? Hide modal loading animation
        setIsLoading(false);

        // .. and redirect to internal error page
        // setTimeout is a workaround for a weird problem where
        // the 500 redirect is immediately aborted
        setTimeout(() => router.push('/500'), 0);
    });

    // An event emitter used by the search functionality on the members page
    const events = new EventEmitter();

    /**
     * Displays or hides the page-covering loading animation.
     */
    function setIsLoading (loading) {
        isLoading = loading;

        if (loading) {
            $('#loading-spinner-overlay, #loading-spinner-wrapper').show();
        } else {
            $('#loading-spinner-overlay, #loading-spinner-wrapper').hide();
        }
    };

    /**
     * Displays or hides the subtle loading animation.
     */
    function setIsLoadingSubtle (loading) {
        isLoading = loading;

        if (loading) {
            $('.navbar-subtle-spinner').show();
            $('.navbar-brand').addClass('subtle-loading');
        } else {
            $('.navbar-subtle-spinner').hide();
            $('.navbar-brand').removeClass('subtle-loading');
        }
    };

    window.router = () => router;

    /**
     * Method that sets the authToken in memory and in localStorage.
     * It also sets the isAuthTokenVerified flag.
     */
    function setVerifiedAuthToken (value) {
        // First, update localStorage
        if (value) {
            localStorage[LS_AUTH_TOKEN] = value;
        } else {
            delete localStorage[LS_AUTH_TOKEN];
        }

        // Then update the relevant variables
        authToken = value;
        isAuthTokenVerified = !!authToken;
        vm.signedIn = isAuthTokenVerified;
    };

    /**
     * Method that returns the searchQuery variable value.
     */
    function getSearchQuery () {
        return searchQuery;
    }

    // Prepare components
    const components = ProgressTool.components(() => router, ajax, events, {
        setIsLoading: setIsLoading,
        setVerifiedAuthToken: setVerifiedAuthToken,
        getSearchQuery: getSearchQuery,
        setIsLoadingSubtle: setIsLoadingSubtle
    });

    // Instantiate the router
    const router = new VueRouter({
        mode: 'hash',
        base: '/',
        routes: [
            {
                path: '/',
                name: 'home-dummy',
                beforeEnter: (to, from, next) => {
                    if (authToken) {
                        // User is logged in, redirect to members overview
                        next('/members');
                    } else {
                        // User is not logged in, redirect to regular home page
                        next('/home');
                    }
                }
            },
            {
                path: '/home',
                name: 'home',
                component: components.Home,
                meta: { highlightMenuItem: 'home' }
            },
            {
                path: '/sign-in',
                name: 'sign-in',
                component: components.SignIn,
                beforeEnter: (to, from, next) => {
                    // We first make sure whether the user should be in this route
                    if (authToken) {
                        // Logged in already? Get out
                        next('/');;
                    } else {
                        // Otherwise, user is in the right route
                        next();
                    }
                },
                meta: { highlightMenuItem: 'sign-in' }
            },
            {
                path: '/members',
                name: 'members',
                component: components.Members,
                meta: { requiresSignIn: true, highlightMenuItem: 'members' }
            },
            {
                path: '/members/:memberId',
                name: 'member',
                component: components.Member,
                props: true,
                meta: { requiresSignIn: true, shareTokenPermitted: true, highlightMenuItem: 'members' }
            },
            {
                path: '/members/report/:shareToken',
                name: 'report',
                component: components.Member,
                props: true,
                meta: { requiresShareToken: true, highlightMenuItem: 'members' }
            },
            {
                path: '/members/:memberId/share-report',
                name: 'share-report',
                component: components.ShareReport,
                props: true,
                meta: { requiresSignIn: true, highlightMenuItem: 'members' }
            },
            {
                path: '/members/:memberId/criterion/:criterionId',
                name: 'criterion',
                component: components.Criterion,
                props: true,
                meta: { requiresSignIn: true, highlightMenuItem: 'members' }
            },
            {
                path: '/change-password',
                name: 'change-password',
                component: components.ChangePassword,
                meta: { requiresSignIn: true, highlightMenuItem: 'account' }
            },
            {
                path: '/500',
                name: 'internal-error',
                component: components.InternalError
            },
            {
                path: '/404',
                name: 'not-found',
                component: components.NotFound
            },
            {
                path: '*',
                redirect: '/404'
            }
        ]
    });

    // Make sure users log in before doing stuff
    router.beforeEach((to, from, next) => {
        if (isLoading) {
            // Prevent the user from navigating while the application
            // is loading something important
            next(false);
        } else if (to.meta.requiresShareToken && to.params.share_token &&
            /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(to.params.share_token)) {
            // Make sure that if the user is using a share token, the route is allowed.
            next();
        } else if (!authToken && to.meta.requiresSignIn) {
            // Prevent the user from navigating to an access controlled area
            next('/sign-in');
        } else if (authToken && !isAuthTokenVerified && to.name !== 'internal-error') {
            // We verify the token before moving to another state.

            // Show modal loading animation
            setIsLoading(true);

            // Execute the ajax request verifying the token
            ajax.verifyAuthToken(authToken).then((isValid) => {
                // Result's in

                // Hide the modal loading animation
                setIsLoading(false);

                if (isValid) {
                    // Set the verified flag to true if the token holds up
                    setVerifiedAuthToken(authToken);

                    // ... and redirect to the page we were trying to visit
                    next();
                } else {
                    // Token not valid? Remove the auth token from memory and storage
                    setVerifiedAuthToken(null);

                    // ... and redirect to sign in route
                    router.push('/sign-in');
                }
            });
        } else {
            // Otherwise, all is good
            next();
        }
    });

    // Instantiate Vue
    const vm = new Vue({
        router: router,
        el: '#app',
        methods: {
            signOut: () => {
                setVerifiedAuthToken(null);

                router.push('/sign-in');
            },

            collapseNav () {
                $('.navbar-collapse').collapse('hide');
            },
            
            searchUpdated () {
                searchQuery = this.searchQuery;

                events.emit('searchQueryUpdated');
            }
        },
        data: {
            // This data field is updated in the method setVerifiedAuthToken
            signedIn: authToken && isAuthTokenVerified,
            searchQuery: ''
        },
        created () {
            events.addListener('resetSearchField', () => {
                searchQuery = '';
                this.searchQuery = '';
            });
        },
        destroyed () {
            events.removeAllListeners('resetSearchField');
        }
    });
})();
