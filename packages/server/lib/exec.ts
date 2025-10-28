import Promise from 'bluebird'
import execa from 'execa'
import shellEnv from 'shell-env'
import _ from 'lodash'
import debugModule from 'debug'
const log = debugModule('cypress:server:exec')
import * as utils from './util/shell'

const pickMainProps = (val) => _.pick(val, ['stdout', 'stderr', 'exitCode'])

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

export const run = (projectRoot: string, options: any) => {
  let {
    cmd,
  } = options

  const shellCommand = function (cmd, cwd, env, shell) {
    log('cy.exec found shell', shell)
    log('and is running command:', options.cmd)
    log('in folder:', projectRoot)

    return execa(cmd, { cwd, env, shell: shell || true })
    .then((result: any) => {
      // do we want to return all fields returned by execa?
      result.shell = shell
      result.cmd = cmd

      return result
    }).then(pickMainProps)
    .catch(pickMainProps) // transform rejection into an object
    .then(trimStdio)
  }

  const run = async () => {
    const shellVariables = await shellEnv()
    const env = _.merge({}, shellVariables, process.env, options.env)

    const shell = await utils.getShell(env.SHELL)

    cmd = utils.sourceShellCommand(options.cmd, shell)

    return shellCommand(cmd, projectRoot, env, shell)
  }

  return Promise
  .try(run)
  .timeout(options.timeout)
  .catch(Promise.TimeoutError, () => {
    const msg = `Process timed out\ncommand: ${options.cmd}`
    const err = new Error(msg)

    // @ts-expect-error
    err.timedOut = true
    throw err
  })
}
