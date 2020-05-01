/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Promise = require("bluebird");

const tryFn = fn => //# promisify this function
Promise.try(fn);

const create = function(Cypress, state) {
  const isStable = function(stable = true, event) {
    let whenStable;
    if (state("isStable") === stable) { return; }

    //# if we are going back to stable and we have
    //# a whenStable callback
    if (stable && (whenStable = state("whenStable"))) {
      //# invoke it
      whenStable();
    }

    state("isStable", stable);

    //# we notify the outside world because this is what the runner uses to
    //# show the 'loading spinner' during an app page loading transition event
    return Cypress.action("cy:stability:changed", stable, event);
  };

  const whenStable = function(fn) {
    //# if we are not stable
    if (state("isStable") === false) {
      return new Promise((resolve, reject) => //# then when we become stable
      state("whenStable", function() {
        //# reset this callback function
        state("whenStable", null);

        //# and invoke the original function
        return tryFn(fn)
        .then(resolve)
        .catch(reject);
      }));
    }

    //# else invoke it right now
    return tryFn(fn);
  };

  return {
    isStable,

    whenStable
  };
};

module.exports = {
  create
};
