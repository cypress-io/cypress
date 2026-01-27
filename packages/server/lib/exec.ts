import Promise from 'bluebird'
import execa from 'execa'
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
    /**
     * To address https://gitlab.com/gitlab-org/security-products/gemnasium-db/-/blob/master/npm/execa/GMS-2020-2.yml
     * We needed to update shell-env from 3.x.x to 4.x.x. However, shell-env 4.x.x is an ESM-only package and cannot be
     * used purely in a CJS environment through require().
     *
     * To resolve this, we need to use the tsImport function from 'tsx' to import the shell-env package.
     * This function is a wrapper around the import function that allows us to import ESM-only packages in a CJS environment.
     * Normally, you can await import() an ESM-only package in a CJS environment. However, since this is TypeScript with a CJS target,
     * all import statements, even dynamic ones, are compiled down to require() statements and is the reason we cannot leverage that
     * technique here.
     *
     * Once @packages/server is converted to ESM, we can remove this and use import() directly at the top of the file.
     */
    const { tsImport } = require('tsx/esm/api')
    const { shellEnv } = await tsImport('shell-env', __filename) as typeof import('shell-env')

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
