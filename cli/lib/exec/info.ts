import { start as spawnStart } from './spawn'
import util from '../util'
import state from '../tasks/state'
import os from 'os'
import chalk from 'chalk'
import prettyBytes from 'pretty-bytes'

// color for numbers and show values
const g = chalk.green
// color for paths
const p = chalk.cyan
const red = chalk.red
// urls
const link = chalk.blue.underline

// to be exported
const methods: any = {}

methods.findProxyEnvironmentVariables = (): any => {
  const keys = ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY']

  return Object.fromEntries(
    Object.entries(process.env).filter(([k]) => keys.includes(k)),
  )
}

const maskSensitiveVariables = (obj: any): any => {
  const masked = { ...obj }

  if (masked.CYPRESS_RECORD_KEY) {
    masked.CYPRESS_RECORD_KEY = '<redacted>'
  }

  return masked
}

methods.findCypressEnvironmentVariables = (): any => {
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key.startsWith('CYPRESS_')),
  )
}

const formatCypressVariables = (): any => {
  const vars = methods.findCypressEnvironmentVariables()

  return maskSensitiveVariables(vars)
}

methods.start = async (options: any = {}): Promise<void> => {
  const args = ['--mode=info']

  await spawnStart(args, {
    dev: options.dev,
  })

  console.log()
  const proxyVars = methods.findProxyEnvironmentVariables()

  if (!proxyVars || Object.keys(proxyVars).length === 0) {
    console.log('Proxy Settings: none detected')
  } else {
    console.log('Proxy Settings:')
    Object.entries(proxyVars).forEach(([key, value]: [string, any]) => {
      console.log('%s: %s', key, g(value))
    })

    console.log()
    console.log('Learn More: %s', link('https://on.cypress.io/proxy-configuration'))
    console.log()
  }

  const cyVars = formatCypressVariables()

  if (!cyVars || Object.keys(cyVars).length === 0) {
    console.log('Environment Variables: none detected')
  } else {
    console.log('Environment Variables:')
    Object.entries(cyVars).forEach(([key, value]: [string, any]) => {
      console.log('%s: %s', key, g(value))
    })
  }

  console.log()
  console.log('Application Data:', p(util.getApplicationDataFolder()))
  console.log('Browser Profiles:', p(util.getApplicationDataFolder('browsers')))
  console.log('Binary Caches: %s', p(state.getCacheDir()))

  console.log()

  const osVersion = await util.getOsVersionAsync()
  const buildInfo = util.pkgBuildInfo()
  const isStable = buildInfo && buildInfo.stable

  console.log('Cypress Version: %s', g(util.pkgVersion()), isStable ? g('(stable)') : red('(pre-release)'))
  console.log('System Platform: %s (%s)', g(os.platform()), g(osVersion))
  console.log('System Memory: %s free %s', g(prettyBytes(os.totalmem())), g(prettyBytes(os.freemem())))

  if (!buildInfo) {
    console.log()
    console.log('This is the', red('development'), '(un-built) Cypress CLI.')
  } else if (!isStable) {
    console.log()
    console.log('This is a', red('pre-release'), 'build of Cypress.')
    console.log('Build info:')
    console.log('  Commit SHA:', g(buildInfo.commitSha))
    console.log('  Commit Branch:', g(buildInfo.commitBranch))
    console.log('  Commit Date:', g(buildInfo.commitDate))
  }
}

export default methods
