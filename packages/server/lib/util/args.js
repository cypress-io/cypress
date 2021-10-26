const _ = require('lodash')
const la = require('lazy-ass')
const is = require('check-more-types')
const path = require('path')
const debug = require('debug')('cypress:server:args')
const minimist = require('minimist')
const coerceUtil = require('./coerce')
const configUtil = require('../config')
const proxyUtil = require('./proxy')
const errors = require('../errors')

const nestedObjectsInCurlyBracesRe = /\{(.+?)\}/g
const nestedArraysInSquareBracketsRe = /\[(.+?)\]/g
const everythingAfterFirstEqualRe = /=(.*)/

const allowList = 'appPath apiKey browser ci ciBuildId clearLogs config configFile cwd env execPath exit exitWithCode global group headed inspectBrk key logs mode outputPath parallel ping port project proxySource quiet record reporter reporterOptions returnPkg runMode runProject smokeTest spec tag updating version testingType'.split(' ')
// returns true if the given string has double quote character "
// only at the last position.
const hasStrayEndQuote = (s) => {
  const quoteAt = s.indexOf('"')

  return quoteAt === (s.length - 1)
}

const removeLastCharacter = (s) => {
  return s.substr(0, s.length - 1)
}

const normalizeBackslash = (s) => {
  if (hasStrayEndQuote(s)) {
    return removeLastCharacter(s)
  }

  return s
}

/**
 * remove stray double quote from runProject and other path properties
 * due to bug in NPM passing arguments with backslash at the end
 * @see https://github.com/cypress-io/cypress/issues/535
 *
 */
const normalizeBackslashes = (options) => {
  // these properties are paths and likely to have backslash on Windows
  const pathProperties = ['runProject', 'project', 'appPath', 'execPath', 'configFile']

  pathProperties.forEach((property) => {
    // sometimes a string parameter might get parsed into a boolean
    // for example "--project ''" will be transformed in "project: true"
    // which we should treat as undefined
    if (typeof options[property] === 'string') {
      options[property] = normalizeBackslash(options[property])
    } else {
      // configFile is a special case that can be set to false
      if (property !== 'configFile') {
        delete options[property]
      }
    }
  })

  return options
}

const stringify = (val) => {
  if (_.isObject(val)) {
    return JSON.stringify(val)
  }

  return val
}

const strToArray = (str) => {
  const parsed = tryJSONParse(str)

  if (parsed) {
    return parsed
  }

  return [].concat(str.split(','))
}

// swap out comma's for bars
const commasToPipes = (match) => {
  return match.split(',').join('|')
}

// convert foo=bar|version=1.2.3 to
// foo=bar,version=1.2.3
const pipesToCommas = (str) => {
  return str.split('|').join(',')
}

const tryJSONParse = (str) => {
  try {
    // https://github.com/cypress-io/cypress/issues/6891
    return JSON.parse(str) === Infinity ? null : JSON.parse(str)
  } catch (err) {
    return null
  }
}

const JSONOrCoerce = (str) => {
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
  return coerceUtil.coerce(str)
}

const sanitizeAndConvertNestedArgs = (str, argname) => {
  la(is.unemptyString(argname), 'missing config argname to be parsed')

  try {
    if (typeof str === 'object') {
      return str
    }

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
  } catch (err) {
    debug('could not pass config %s value %s', argname, str)
    debug('error %o', err)

    return errors.throw('COULD_NOT_PARSE_ARGUMENTS', argname, str, err.message)
  }
}

module.exports = {
  normalizeBackslashes,

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
      'output-path': 'outputPath',
      'proxy-source': 'proxySource',
      'reporter-options': 'reporterOptions',
      'return-pkg': 'returnPkg',
      'run-mode': 'isTextTerminal',
      'run-project': 'runProject',
      'smoke-test': 'smokeTest',
      'testing-type': 'testingType',
    }

    // takes an array of args and converts
    // to an object
    let options = minimist(argv, {
      alias,
      // never cast the following CLI arguments
      string: ['ci-build-id'],
    })

    debug('parsed argv options %o', { options })

    const allowed = _.pick(argv, allowList)

    // were we invoked from the CLI or directly?
    const invokedFromCli = Boolean(options.cwd)

    options = _
    .chain(options)
    .defaults(allowed)
    .omit(_.keys(alias)) // remove aliases
    .extend({ invokedFromCli })
    .defaults({
      // set in case we
      // bypassed the cli
      cwd: process.cwd(),
    })
    .mapValues(coerceUtil.coerce)
    .value()

    debug('argv parsed: %o', options)

    // throw new Error()

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
    let project = options.project || options.runProject

    // only accept project if it is a string
    if (typeof project !== 'string') {
      project = undefined
    }

    // if non-string key has been passed, set it to undefined
    // https://github.com/cypress-io/cypress/issues/14571
    if (typeof options.key !== 'string') {
      delete options.key
    }

    if (spec) {
      try {
        const resolvePath = (p) => {
          return path.resolve(options.cwd, p)
        }

        // https://github.com/cypress-io/cypress/issues/8818
        // Sometimes spec is parsed to array. Because of that, we need check.
        if (typeof spec === 'string') {
          // clean up single quotes wrapping the spec for Windows users
          // https://github.com/cypress-io/cypress/issues/2298
          if (spec[0] === '\'' && spec[spec.length - 1] === '\'') {
            spec = spec.substring(1, spec.length - 1)
          }

          options.spec = strToArray(spec).map(resolvePath)
        } else {
          options.spec = spec.map(resolvePath)
        }
      } catch (err) {
        debug('could not pass config spec value %s', spec)
        debug('error %o', err)

        return errors.throw('COULD_NOT_PARSE_ARGUMENTS', 'spec', spec, 'spec must be a string or comma-separated list')
      }
    }

    if (tag) {
      options.tag = typeof tag === 'string' ? strToArray(tag) : tag
    }

    if (env) {
      options.env = sanitizeAndConvertNestedArgs(env, 'env')
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
      options.reporterOptions = sanitizeAndConvertNestedArgs(reporterOptions, 'reporterOptions')
    }

    if (config) {
      // convert config to an object
      // and store the config
      options.config = sanitizeAndConvertNestedArgs(config, 'config')
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

    if (options.smokeTest) {
      options.pong = options.ping
    }

    debug('argv options: %o', options)

    return options
  },

  toArray (obj = {}) {
    // goes in reverse, takes an object
    // and converts to an array by picking
    // only the allowed properties and
    // mapping them to include the argument
    return _
    .chain(obj)
    .pick(...allowList)
    .mapValues((val, key) => {
      return `--${key}=${stringify(val)}`
    }).values()
    .value()
  },
}
