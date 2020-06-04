// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let setContext

require('./environment')

const _ = require('lodash')
const path = require('path')
const repl = require('repl')
const history = require('repl.history')
const browsers = require('./browsers')
const Fixtures = require('../test/support/helpers/fixtures')

const replServer = repl.start({
  prompt: '> ',
})

// preserve the repl history
history(replServer, path.join(process.env.HOME, '.node_history'))

const req = replServer.context.require

const getObj = function () {
  const deploy = require('../deploy')

  return {
    lodash: _,
    deploy,
    darwin: deploy.getPlatform('darwin'),
    linux: deploy.getPlatform('linux'),
    Fixtures,
    browsers,

    reload () {
      let key

      for (key in require.cache) {
        delete require.cache[key]
      }

      for (key in req.cache) {
        delete req.cache[key]
      }

      return setContext()
    },

    r (file) {
      return require(file)
    },
  }
};

(setContext = () => {
  return _.extend(replServer.context, getObj())
})()
