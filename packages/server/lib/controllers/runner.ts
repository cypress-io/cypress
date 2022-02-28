import _ from 'lodash'
import type { Response } from 'express'
import send from 'send'
import os from 'os'
import { fs } from '../util/fs'
import path from 'path'
import Debug from 'debug'
import pkg from '@packages/root'
import { getPathToDist, getPathToIndex, RunnerPkg } from '@packages/resolve-dist'
import type { InitializeRoutes } from '../routes'
import type { PlatformName } from '@packages/launcher'
import type { Cfg } from '../project-base'

const debug = Debug('cypress:server:runner')

const PATH_TO_NON_PROXIED_ERROR = path.join(__dirname, '..', 'html', 'non_proxied_error.html')

const _serveNonProxiedError = (res: Response) => {
  return fs.readFile(PATH_TO_NON_PROXIED_ERROR)
  .then((html) => {
    return res.type('html').end(html)
  })
}

export interface ServeOptions extends Pick<InitializeRoutes, 'getSpec' | 'config' | 'getCurrentBrowser' | 'getRemoteState' | 'specsStore' | 'exit'> {
  testingType: Cypress.TestingType
}

export const serveRunner = (runnerPkg: RunnerPkg, config: Cfg, res: Response) => {
  // base64 before embedding so user-supplied contents can't break out of <script>
  // https://github.com/cypress-io/cypress/issues/4952
  const base64Config = Buffer.from(JSON.stringify(config)).toString('base64')

  const runnerPath = process.env.CYPRESS_INTERNAL_RUNNER_PATH || getPathToIndex(runnerPkg)

  // Chrome plans to make document.domain immutable in Chrome 106, with the default value
  // of the Origin-Agent-Cluster header becoming 'true'. We explicitly disable this header
  // so that we can continue to support tests that visit multiple subdomains in a single spec.
  // https://github.com/cypress-io/cypress/issues/20147
  res.setHeader('Origin-Agent-Cluster', '?0')

  return res.render(runnerPath, {
    base64Config,
    projectName: config.projectName,
  })
}

export const runner = {
  serve (req, res, runnerPkg: RunnerPkg, options: ServeOptions) {
    if (req.proxiedUrl.startsWith('/')) {
      debug('request was not proxied via Cypress, erroring %o', _.pick(req, 'proxiedUrl'))

      return _serveNonProxiedError(res)
    }

    let { config, getRemoteState, getCurrentBrowser, getSpec, specsStore, exit } = options

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

    config.version = pkg.version
    config.platform = os.platform() as PlatformName
    config.arch = os.arch()
    config.spec = getSpec() ?? null
    config.specs = specsStore.specFiles
    config.browser = getCurrentBrowser()
    config.exit = exit ?? true

    debug('serving runner index.html with config %o',
      _.pick(config, 'version', 'platform', 'arch', 'projectName'))

    // log the env object's keys without values to avoid leaking sensitive info
    debug('env object has the following keys: %s', _.keys(config.env).join(', '))

    return serveRunner(runnerPkg, config, res)
  },

  handle (testingType, req, res) {
    const pathToFile = getPathToDist(testingType === 'e2e' ? 'runner' : 'runner-ct', req.params[0])

    return send(req, pathToFile)
    .pipe(res)
  },
}
