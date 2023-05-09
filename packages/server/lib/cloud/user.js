"use strict";
const api = require('./api');
const cache = require('../cache');
module.exports = {
    get() {
        return cache.getUser();
    },
    set(user) {
        return cache.setUser(user);
    },
    getBaseLoginUrl() {
        return api.getAuthUrls().get('dashboardAuthUrl');
    },
    logOut() {
        return this.get().then((user) => {
            const authToken = user && user.authToken;
            return cache.removeUser().then(() => {
                if (authToken) {
                    return api.postLogout(authToken);
                }
            });
        });
    },
};
