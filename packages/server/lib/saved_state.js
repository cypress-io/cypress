/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const debug = require("debug")("cypress:server:saved_state");
const FileUtil = require("./util/file");
const appData = require("./util/app_data");
const savedStateUtil = require("./util/saved_state");

const stateFiles = {};

const whitelist = `\
appWidth
appHeight
appX
appY
autoScrollingEnabled
browserWidth
browserHeight
browserX
browserY
isAppDevToolsOpen
isBrowserDevToolsOpen
reporterWidth
showedOnBoardingModal\
`.trim().split(/\s+/);

const normalizeAndWhitelistSet = function(set, key, value) {
  const valueObject = (() => {
    if (_.isString(key)) {
    const tmp = {};
    tmp[key] = value;
    return tmp;
  } else {
    return key;
  }
  })();

  const invalidKeys = _.filter(_.keys(valueObject), key => !_.includes(whitelist, key));

  if (invalidKeys.length) {
    console.error(`WARNING: attempted to save state for non-whitelisted key(s): ${invalidKeys.join(', ')}. All keys must be whitelisted in server/lib/saved_state.coffee`);
  }

  return set(_.pick(valueObject, whitelist));
};

module.exports = function(projectRoot, isTextTerminal) {
  if (isTextTerminal) {
    debug("noop saved state");
    return Promise.resolve(FileUtil.noopFile);
  }

  return savedStateUtil.formStatePath(projectRoot)
  .then(function(statePath) {
    const fullStatePath = appData.projectsPath(statePath);
    debug('full state path %s', fullStatePath);
    if (stateFiles[fullStatePath]) { return stateFiles[fullStatePath]; }

    debug('making new state file around %s', fullStatePath);
    const stateFile = new FileUtil({
      path: fullStatePath
    });

    stateFile.set = _.wrap(stateFile.set.bind(stateFile), normalizeAndWhitelistSet);

    stateFiles[fullStatePath] = stateFile;
    return stateFile;
  });
};
