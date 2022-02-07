const Promise = require('bluebird')
const execa = require('execa')
const shellEnv = require('shell-env')
const _ = require('lodash')
const log = require('./log')
const utils = require('./util/shell')

const pickMainProps = (val) => _.pick(val, ['stdout', 'stderr', 'code'])

const trimStdio = (val) => {
  const result = { ...val }

  if (_.isString(val.stdout)) {
    result.stdout = val.stdout.trim()
  }

  if (_.isString(val.stderr)) {
    result.stderr = val.stderr.trim()
  }

  return result
}

module.exports = {
  run (projectRoot, options) {
    let {
      cmd,
    } = options

    const shellCommand = function (cmd, cwd, env, shell) {
      log('cy.exec found shell', shell)
      log('and is running command:', options.cmd)
      log('in folder:', projectRoot)

      return execa.shell(cmd, { cwd, env, shell })
      .then((result) => {
        // do we want to return all fields returned by execa?
        result.shell = shell
        result.cmd = cmd

        return result
      }).then(pickMainProps)
      .catch(pickMainProps) // transform rejection into an object
      .then(trimStdio)
    }

    const run = () => {
      return shellEnv()
      .then((shellVariables) => {
        const env = _.merge({}, shellVariables, process.env, options.env)

        return utils.getShell(env.SHELL)
        .then((shell) => {
          cmd = utils.sourceShellCommand(options.cmd, shell)

          return shellCommand(cmd, projectRoot, env, shell)
        })
      })
    }

    return Promise
    .try(run)
    .timeout(options.timeout)
    .catch(Promise.TimeoutError, () => {
      const msg = `Process timed out\ncommand: ${options.cmd}`
      const err = new Error(msg)

      err.timedOut = true
      throw err
    })
  },
}
