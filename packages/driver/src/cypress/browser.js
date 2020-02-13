/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const $utils = require("./utils");

const isBrowser = function(config, obj='') {
  if (_.isString(obj)) {
    const name = obj.toLowerCase();
    const currentName = config.browser.name.toLowerCase();

    return name === currentName;
  }

  if (_.isObject(obj)) {
    return _.isMatch(config.browser, obj);
  }

  return $utils.throwErrByPath("browser.invalid_arg", {
    args: { method: 'isBrowser', obj: $utils.stringify(obj) }
  });
};

module.exports = config => ({
  browser: config.browser,
  isBrowser: _.partial(isBrowser, config)
});
