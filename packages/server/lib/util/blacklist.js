/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const minimatch = require("minimatch");
const uri = require("./uri");

const matches = function(urlToCheck, blacklistHosts) {
  //# normalize into flat array
  blacklistHosts = [].concat(blacklistHosts);

  urlToCheck = uri.stripProtocolAndDefaultPorts(urlToCheck);

  const matchUrl = hostMatcher =>
    //# use minimatch against the url
    //# to see if any match
    minimatch(urlToCheck, hostMatcher)
  ;

  return _.find(blacklistHosts, matchUrl);
};


module.exports = {
  matches
};
