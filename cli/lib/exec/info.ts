/* eslint-disable no-console */
import { start as spawnStart } from './spawn'
import util from '../util'
import state from '../tasks/state'
import os from 'os'
import chalk from 'chalk'
import prettyBytes from 'pretty-bytes'
import _ from 'lodash'

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
  return _.pick(process.env, ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY'])
}

const proxyUrlCredentialsRe = /^([a-z][a-z\d+.-]*:\/\/)([^@/?#]*@)/i
const sensitiveVariableNameRe = /KEY|TOKEN|SECRET|PASSWORD|AUTH|CREDENTIAL/i

const redactUrlCredentials = (value: any): any => {
  if (typeof value !== 'string') {
    return value
  }

  try {
    const url = new URL(value)

    if (!url.username && !url.password) {
      return value
    }

    return value.replace(proxyUrlCredentialsRe, '$1<redacted>@')
  } catch {
    return value
  }
}

const formatProxyVariables = (): any => {
  const vars = methods.findProxyEnvironmentVariables()

  return _.mapValues(vars, redactUrlCredentials)
}

const maskSensitiveVariables = (obj: any): any => {
  const masked = { ...obj }

  Object.keys(masked).forEach((key: string) => {
    if (sensitiveVariableNameRe.test(key)) {
      masked[key] = '<redacted>'
    }
  })

  return masked
}

methods.findCypressEnvironmentVariables = (): any => {
  const isCyVariable = (val: any, key: string): boolean => key.startsWith('CYPRESS_')

  return _.pickBy(process.env, isCyVariable)
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
  const proxyVars = formatProxyVariables()

  if (_.isEmpty(proxyVars)) {
    console.log('Proxy Settings: none detected')
  } else {
    console.log('Proxy Settings:')
    _.forEach(proxyVars, (value: any, key: string) => {
      console.log('%s: %s', key, g(value))
    })

    console.log()
    console.log('Learn More: %s', link('https://on.cypress.io/proxy-configuration'))
    console.log()
  }

  const cyVars = formatCypressVariables()

  if (_.isEmpty(cyVars)) {
    console.log('Environment Variables: none detected')
  } else {
    console.log('Environment Variables:')
    _.forEach(cyVars, (value: any, key: string) => {
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
