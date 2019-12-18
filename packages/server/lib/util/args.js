const _ = require('lodash')
const path = require('path')
const debug = require('debug')('cypress:server:args')
const minimist = require('minimist')
const coerceUtil = require('./coerce')
const configUtil = require('../config')
const proxyUtil = require('./proxy')

const nestedObjectsInCurlyBracesRe = /\{(.+?)\}/g
const nestedArraysInSquareBracketsRe = /\[(.+?)\]/g
const everythingAfterFirstEqualRe = /=(.*)/

const whitelist = 'appPath apiKey browser ci ciBuildId clearLogs config configFile cwd env execPath exit exitWithCode generateKey getKey group headed inspectBrk key logs mode outputPath parallel ping port project proxySource record reporter reporterOptions returnPkg runMode runProject smokeTest spec tag updating version'.split(' ')
// returns true if the given string has double quote character "
// only at the last position.
const hasStrayEndQuote = function (s) {
  const quoteAt = s.indexOf('"')

  return quoteAt === (s.length - 1)
}

const removeLastCharacter = (s) => {
  return s.substr(0, s.length - 1)
}

const normalizeBackslash = function (s) {
  if (hasStrayEndQuote(s)) {
    return removeLastCharacter(s)
  }

  return s
}

const normalizeBackslashes = function (options) {
  // remove stray double quote from runProject and other path properties
  // due to bug in NPM passing arguments with
  // backslash at the end
  // https://github.com/cypress-io/cypress/issues/535
  // these properties are paths and likely to have backslash on Windows
  const pathProperties = ['runProject', 'project', 'appPath', 'execPath', 'configFile']

  pathProperties.forEach((property) => {
    if (options[property]) {
      options[property] = normalizeBackslash(options[property])
    }
  })

  return options
}

const stringify = function (val) {
  if (_.isObject(val)) {
    return JSON.stringify(val)
  }

  return val
}

const strToArray = function (str) {
  const parsed = tryJSONParse(str)

  if (parsed) {
    return parsed
  }

  return [].concat(str.split(','))
}

// swap out comma's for bars
const commasToPipes = (match, p1, p2, p3) => {
  return match.split(',').join('|')
}

// convert foo=bar|version=1.2.3 to
// foo=bar,version=1.2.3
const pipesToCommas = (str) => {
  return str.split('|').join(',')
}

const tryJSONParse = function (str) {
  try {
    return JSON.parse(str)
  } catch (err) {
    return null
  }
}

const JSONOrCoerce = function (str) {
  // valid JSON? horray
  const parsed = tryJSONParse(str)

  if (parsed) {
    return parsed
  }

  // convert bars back to commas
  str = pipesToCommas(str)

  // try to parse again?
  const parsed2 = tryJSONParse(str)

  if (parsed2) {
    return parsed2
  }

  // nupe :-(
  return coerceUtil(str)
}

const sanitizeAndConvertNestedArgs = function (str) {
  // if this is valid JSON then just
  // parse it and call it a day
  const parsed = tryJSONParse(str)

  if (parsed) {
    return parsed
  }

  // invalid JSON, so assume mixed usage
  // first find foo={a:b,b:c} and bar=[1,2,3]
  // syntax and turn those into
  // foo: a:b|b:c
  // bar: 1|2|3

  return _
  .chain(str)
  .replace(nestedObjectsInCurlyBracesRe, commasToPipes)
  .replace(nestedArraysInSquareBracketsRe, commasToPipes)
  .split(',')
  .map((pair) => {
    return pair.split(everythingAfterFirstEqualRe)
  })
  .fromPairs()
  .mapValues(JSONOrCoerce)
  .value()
}

module.exports = {
  toObject (argv) {
    debug('argv array: %o', argv)

    const alias = {
      'api-key': 'apiKey',
      'app-path': 'appPath',
      'ci-build-id': 'ciBuildId',
      'clear-logs': 'clearLogs',
      'config-file': 'configFile',
      'exec-path': 'execPath',
      'exit-with-code': 'exitWithCode',
      'inspect-brk': 'inspectBrk',
      'get-key': 'getKey',
      'new-key': 'generateKey',
      'output-path': 'outputPath',
      'proxy-source': 'proxySource',
      'reporter-options': 'reporterOptions',
      'return-pkg': 'returnPkg',
      'run-mode': 'isTextTerminal',
      'run-project': 'runProject',
      'smoke-test': 'smokeTest',
    }

    // takes an array of args and converts
    // to an object
    let options = minimist(argv, {
      alias,
    })

    const whitelisted = _.pick(argv, whitelist)

    // were we invoked from the CLI or directly?
    const invokedFromCli = Boolean(options.cwd)

    options = _
    .chain(options)
    .defaults(whitelisted)
    .omit(_.keys(alias)) // remove aliases
    .extend({ invokedFromCli })
    .defaults({
      // set in case we
      // bypassed the cli
      cwd: process.cwd(),
    })
    .mapValues(coerceUtil)
    .value()

    debug('argv parsed: %o', options)

    // if we are updating we may have to pluck out the
    // appPath + execPath from the options._ because
    // in previous versions up until 0.14.0 these args
    // were not passed as dashes and instead were just
    // regular arguments
    if (options.updating && !options.appPath) {
      // take the last two arguments that were unknown
      // and apply them to both appPath + execPath
      [options.appPath, options.execPath] = options._.slice(-2)
    }

    let { spec } = options
    const { env, config, reporterOptions, outputPath, tag } = options
    const project = options.project || options.runProject

    if (spec) {
      const resolvePath = (p) => {
        return path.resolve(options.cwd, p)
      }

      // clean up single quotes wrapping the spec for Windows users
      // https://github.com/cypress-io/cypress/issues/2298
      if (spec[0] === '\'' && spec[spec.length - 1] === '\'') {
        spec = spec.substring(1, spec.length - 1)
      }

      options.spec = strToArray(spec).map(resolvePath)
    }

    if (tag) {
      options.tag = strToArray(tag)
    }

    if (env) {
      options.env = sanitizeAndConvertNestedArgs(env)
    }

    const proxySource = proxyUtil.loadSystemProxySettings()

    if (process.env.HTTP_PROXY) {
      if (proxySource) {
        options.proxySource = proxySource
      }

      options.proxyServer = process.env.HTTP_PROXY
      options.proxyBypassList = process.env.NO_PROXY
    }

    if (reporterOptions) {
      options.reporterOptions = sanitizeAndConvertNestedArgs(reporterOptions)
    }

    if (config) {
      // convert config to an object
      // annd store the config
      options.config = sanitizeAndConvertNestedArgs(config)
    }

    // get a list of the available config keys
    const configKeys = configUtil.getConfigKeys()

    // and if any of our options match this
    const configValues = _.pick(options, configKeys)

    // then set them on config
    // this solves situations where we accept
    // root level arguments which also can
    // be set in configuration
    if (options.config == null) {
      options.config = {}
    }

    _.extend(options.config, configValues)

    // remove them from the root options object
    options = _.omit(options, configKeys)

    options = normalizeBackslashes(options)
    debug('options %o', options)

    // normalize project to projectRoot
    if (project) {
      options.projectRoot = path.resolve(options.cwd, project)
    }

    // normalize output path from previous current working directory
    if (outputPath) {
      options.outputPath = path.resolve(options.cwd, outputPath)
    }

    if (options.runProject) {
      options.run = true
    }

    if (options.smokeTest) {
      options.pong = options.ping
    }

    debug('argv options: %o', options)

    return options
  },

  toArray (obj = {}) {
    // goes in reverse, takes an object
    // and converts to an array by picking
    // only the whitelisted properties and
    // mapping them to include the argument
    return _
    .chain(obj)
    .pick(...whitelist)
    .mapValues((val, key) => {
      return `--${key}=${stringify(val)}`
    }).values()
    .value()
  },
}
