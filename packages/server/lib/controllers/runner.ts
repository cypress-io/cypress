import _ from 'lodash'
import type { Request, Response } from 'express'
import send from 'send'
import os from 'os'
import { fs } from '../util/fs'
import path from 'path'
import Debug from 'debug'
import pkg from '@packages/root'
import { getPathToDist, getPathToIndex, RunnerPkg } from '@packages/resolve-dist'
import type { InitializeRoutes } from '../routes'
import type { PlatformName } from '@packages/types'
import type { Cfg } from '../project-base'

const debug = Debug('cypress:server:runner')

const PATH_TO_NON_PROXIED_ERROR = path.join(__dirname, '..', 'html', 'non_proxied_error.html')

const _serveNonProxiedError = (res: Response) => {
  return fs.readFile(PATH_TO_NON_PROXIED_ERROR)
  .then((html) => {
    return res.type('html').end(html)
  })
}

export interface ServeOptions extends Pick<InitializeRoutes, 'getSpec' | 'config' | 'getCurrentBrowser' | 'getRemoteState' | 'exit'> {
  testingType: Cypress.TestingType
}

export const serveRunner = (runnerPkg: RunnerPkg, config: Cfg, res: Response) => {
  // base64 before embedding so user-supplied contents can't break out of <script>
  // https://github.com/cypress-io/cypress/issues/4952
  const base64Config = Buffer.from(JSON.stringify(config)).toString('base64')

  const runnerPath = process.env.CYPRESS_INTERNAL_RUNNER_PATH || getPathToIndex(runnerPkg)

  return res.render(runnerPath, {
    base64Config,
    projectName: config.projectName,
    namespace: config.namespace,
  })
}

export const runner = {
  serve (req, res, runnerPkg: RunnerPkg, options: ServeOptions) {
    if (req.proxiedUrl.startsWith('/')) {
      debug('request was not proxied via Cypress, erroring %o', _.pick(req, 'proxiedUrl'))

      return _serveNonProxiedError(res)
    }

    let { config, getRemoteState, getCurrentBrowser, getSpec, exit } = options

    config = _.clone(config)
    // at any given point, rather than just arbitrarily modifying it.
    // @ts-ignore
    config.testingType = options.testingType

    // TODO #1: bug. Passing `remote.domainName` breaks CT for unknown reasons.
    // If you pass a remote object with a domainName key, we get cross-origin
    // iframe access errors.
    // repro:
    // {
    //    "domainName": "localhost"
    // }
    // TODO: Find out what the problem.
    if (options.testingType === 'e2e') {
      config.remote = getRemoteState()
    }

    const spec = getSpec()

    config.version = pkg.version
    config.platform = os.platform() as PlatformName
    config.arch = os.arch()
    config.spec = spec ? { ...spec, name: spec.baseName } : null
    config.browser = getCurrentBrowser()
    config.exit = exit ?? true

    debug('serving runner index.html with config %o',
      _.pick(config, 'version', 'platform', 'arch', 'projectName'))

    // log the env object's keys without values to avoid leaking sensitive info
    debug('env object has the following keys: %s', _.keys(config.env).join(', '))

    return serveRunner(runnerPkg, config, res)
  },

  handle (req: Request, res: Response) {
    const pathToFile = getPathToDist('runner-ct', req.params[0])

    return send(req, pathToFile)
    .pipe(res)
  },
}
