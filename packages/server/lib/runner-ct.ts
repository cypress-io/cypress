import Debug from 'debug'
import _ from 'lodash'
import send from 'send'
import { getPathToIndex, getPathToDist } from '@packages/resolve-dist'
import type { Cfg } from './project-base'
import type { Browser } from './browsers/types'

interface ServeOptions {
  config: Cfg
  getCurrentBrowser: () => Browser
}

const debug = Debug('cypress:server:runner-ct')

export const handle = (req, res) => {
  const pathToFile = getPathToDist('runner', req.params[0])

  return send(req, pathToFile)
  .pipe(res)
}

export const makeServeConfig = (options) => {
  const config = {
    ...options.config,
    browser: options.getCurrentBrowser(),
  } as Cfg

  // TODO: move the component file watchers in here
  // and update them in memory when they change and serve
  // them straight to the HTML on load

  debug('serving runner index.html with config %o',
    _.pick(config, 'version', 'platform', 'arch', 'projectName'))

  // base64 before embedding so user-supplied contents can't break out of <script>
  // https://github.com/cypress-io/cypress/issues/4952

  const base64Config = Buffer.from(JSON.stringify(config)).toString('base64')

  return {
    base64Config,
    projectName: config.projectName,
    namespace: config.namespace,
  }
}

export const serve = (req, res, options: ServeOptions) => {
  const config = makeServeConfig(options)

  const runnerPath = process.env.CYPRESS_INTERNAL_RUNNER_PATH || getPathToIndex('runner')

  return res.render(runnerPath, config)
}
