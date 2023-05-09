"use strict";
const cache = require('./cache');
const debug = require('debug')('cypress:server:cohorts');
module.exports = {
    get: () => {
        debug('Get cohorts');
        return cache.getCohorts();
    },
    getByName: (name) => {
        debug('Get cohort name:', name);
        return cache.getCohorts().then((cohorts) => {
            debug('Get cohort returning:', cohorts[name]);
            return cohorts[name];
        });
    },
    set: (cohort) => {
        debug('Set cohort', cohort);
        return cache.insertCohort(cohort);
    },
};
