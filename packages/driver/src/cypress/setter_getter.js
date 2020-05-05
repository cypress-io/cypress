/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");

const reset = function(state = {}) {
  //# perf loop
  for (let key in state) {
    const val = state[key];
    delete state[key];
  }

  return state;
};

//# a basic object setter / getter class
const create = function(state = {}) {
  const get = function(key) {
    if (key) {
      return state[key];
    } else {
      return state;
    }
  };

  const set = function(key, value) {
    let obj, ret;
    if (_.isObject(key)) {
      obj = key;
      ret = obj;
    } else {
      obj = {};
      obj[key] = value;
      ret = value;
    }

    _.extend(state, obj);

    return ret;
  };

  //# return the getter / setter function interface
  const SetterGetter = function(key, value) {
    switch (arguments.length) {
      case 0:
        return get();
      case 1:
        if (_.isString(key)) {
          return get(key);
        } else {
          return set(key);
        }
      default:
        return set(key, value);
    }
  };

  SetterGetter.reset = () => reset(state);

  return SetterGetter;
};

module.exports = {
  create
};
