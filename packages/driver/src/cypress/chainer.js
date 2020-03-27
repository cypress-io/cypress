/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");

const $Cypress = require("../cypress");

class $Chainer {
  constructor() {
    this.chainerId = _.uniqueId("chainer");
    this.firstCall = true;
  }

  static remove(key) {
    return delete $Chainer.prototype[key];
  }

  static add(key, fn) {
    //# when our instance methods are invoked
    //# we know we are chaining on an existing series
    return $Chainer.prototype[key] = function(...args) {
      //# call back the original function with our new args
      //# pass args an as array and not a destructured invocation
      if (fn(this, args)) {
        //# no longer the first call
        this.firstCall = false;
      }

      //# return the chainer so additional calls
      //# are slurped up by the chainer instead of cy
      return this;
    };
  }

  //# creates a new chainer instance
  static create(key, args) {
    const chainer = new $Chainer;

    //# since this is the first function invocation
    //# we need to pass through onto our instance methods
    return chainer[key].apply(chainer, args);
  }
}

module.exports = $Chainer;
