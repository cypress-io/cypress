/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//# a simple helper to detect when we're running
//# under istanbul and automatically shift the
//# cmd + arguments around so we continue to get
//# test coverage

module.exports = function(cmd, args) {
  if (process.env.running_under_istanbul) {
    return `npm run test-cov-process -- ${cmd} -- -- ${args}`;
  } else {
    return `${cmd} -- ${args}`;
  }
};
