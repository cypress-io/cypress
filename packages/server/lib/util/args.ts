/* eslint-disable
    brace-style,
    no-cond-assign,
    no-unused-vars,
    one-var,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import _ from "lodash"
import path from "path"
import debugLib from "debug"
import minimist from "minimist"
import coerce from "./coerce"
import config from "../config.coffee"

const debug = debugLib("cypress:server:args")

const nestedObjectsInCurlyBracesRe = /\{(.+?)\}/g
const nestedArraysInSquareBracketsRe = /\[(.+?)\]/g
const everythingAfterFirstEqualRe = /=(.+)/

const whitelist: Array<keyof OptionsArgv> = [
  "cwd",
  "appPath",
  "execPath",
  "apiKey",
  "smokeTest",
  "getKey",
  "generateKey",
  "runProject",
  "project",
  "spec",
  "reporter",
  "reporterOptions",
  "port",
  "env",
  "ci",
  "record",
  "updating",
  "ping",
  "key",
  // "logs",
  "clearLogs",
  "returnPkg",
  "version",
  "mode",
  "headed",
  "config",
  "exit",
  "exitWithCode",
  "browser",
  "runMode",
  "outputPath",
  "parallel",
  "ciBuildId",
  "group",
  "inspectBrk",
]

// returns true if the given string has double quote character "
// only at the last position.
const hasStrayEndQuote = function(s: string) {
  const quoteAt = s.indexOf('"')

  return quoteAt === s.length - 1
}

const removeLastCharacter = (s: string) => {
  return s.substr(0, s.length - 1)
}

const normalizeBackslash = function(s: string) {
  if (hasStrayEndQuote(s)) {
    return removeLastCharacter(s)
  }

  return s
}

const normalizeBackslashes = function(options: Record<string, string>) {
  //# remove stray double quote from runProject and other path properties
  //# due to bug in NPM passing arguments with
  //# backslash at the end
  //# https://github.com/cypress-io/cypress/issues/535
  // these properties are paths and likely to have backslash on Windows
  const pathProperties = ["runProject", "project", "appPath", "execPath"]

  pathProperties.forEach((property) => {
    if (options[property]) {
      options[property] = normalizeBackslash(options[property])
    }
  })

  return options
}

const stringify = function(val: any) {
  if (_.isObject(val)) {
    return JSON.stringify(val)
  }

  return val
}

const strToArray = function(str: string): string[] {
  let parsed

  if ((parsed = tryJSONParse(str))) {
    return parsed
  }

  return str.split(",")
}

//# swap out comma's for bars
const commasToPipes = (match: string) => {
  return match.split(",").join("|")
}

//# convert foo=bar|version=1.2.3 to
//# foo=bar,version=1.2.3
const pipesToCommas = (str: string) => {
  return str.split("|").join(",")
}

const tryJSONParse = function(str: any) {
  try {
    return JSON.parse(str)
  } catch (err) {
    return null
  }
}

const JSONOrCoerce = function(str: string) {
  //# valid JSON? horray
  let parsed

  if ((parsed = tryJSONParse(str))) {
    return parsed
  }

  //# convert bars back to commas
  str = pipesToCommas(str)

  //# try to parse again?
  if ((parsed = tryJSONParse(str))) {
    return parsed
  }

  //# nupe :-(
  return coerce(str)
}

const sanitizeAndConvertNestedArgs = function(str: string): object {
  //# if this is valid JSON then just
  //# parse it and call it a day
  let parsed

  if ((parsed = tryJSONParse(str))) {
    return parsed
  }

  //# invalid JSON, so assume mixed usage
  //# first find foo={a:b,b:c} and bar=[1,2,3]
  //# syntax and turn those into
  //# foo: a:b|b:c
  //# bar: 1|2|3

  return _.chain(str)
    .replace(nestedObjectsInCurlyBracesRe, commasToPipes)
    .replace(nestedArraysInSquareBracketsRe, commasToPipes)
    .split(",")
    .map((pair) => {
      return pair.split(everythingAfterFirstEqualRe)
    })
    .fromPairs()
    .mapValues(JSONOrCoerce)
    .value()
}

export type OptionsMode =
  | "version"
  | "smokeTest"
  | "returnPkg"
  | "logs"
  | "clearLogs"
  | "getKey"
  | "generateKey"
  | "exitWithCode"
  | "run"
  | "interactive"
  | "openProject"

export interface OptionsArgv {
  appPath?: string
  execPath?: string
  apiKey?: string
  smokeTest?: boolean
  getKey?: boolean
  generateKey?: boolean
  clearLogs?: boolean
  runProject?: string
  returnPkg?: boolean
  isTextTerminal?: boolean
  ciBuildId?: string
  exitWithCode?: number
  reporterOptions?: object
  outputPath?: string
  inspectBrk?: string
  cwd: string
  project?: string
  spec?: string
  reporter?: string
  port?: number
  env?: object
  ci?: boolean
  record?: boolean
  updating?: boolean
  ping?: string
  key?: string
  // logs?: string;
  version?: string
  mode?: OptionsMode
  headed?: boolean
  config?: object
  /**
   * Whether or not to exit in run mode when it finishes running
   */
  exit?: boolean
  browser?: string
  runMode?: string
  parallel?: boolean
  group?: string
  projectRoot?: string
}

export const toObject = (argv: string[]): OptionsArgv => {
  let c, envs, op, p, ro, spec

  debug("argv array: %o", argv)

  const alias: Record<string, keyof OptionsArgv> = {
    "app-path": "appPath",
    "exec-path": "execPath",
    "api-key": "apiKey",
    "smoke-test": "smokeTest",
    "get-key": "getKey",
    "new-key": "generateKey",
    "clear-logs": "clearLogs",
    "run-project": "runProject",
    "return-pkg": "returnPkg",
    "run-mode": "isTextTerminal",
    "ci-build-id": "ciBuildId",
    "exit-with-code": "exitWithCode",
    "reporter-options": "reporterOptions",
    "output-path": "outputPath",
    "inspect-brk": "inspectBrk",
  }

  //# takes an array of args and converts
  //# to an object
  let minimistOptions = minimist(argv, {
    alias,
  })

  const whitelisted = _.pick(argv, whitelist)

  let options: Record<string, any> = _.chain(minimistOptions)
    .defaults(whitelisted)
    .omit(_.keys(alias)) //# remove aliases
    .defaults({
      //# set in case we
      //# bypassed the cli
      cwd: process.cwd(),
    })
    .mapValues(coerce)
    .value() as any

  debug("argv parsed: %o", options)

  if ((spec = options.spec)) {
    const resolvePath = (p: string) => {
      return path.resolve(options.cwd, p)
    }

    options.spec = strToArray(spec).map(resolvePath)
  }

  if ((envs = options.env)) {
    options.env = sanitizeAndConvertNestedArgs(envs as any)
  }

  if ((ro = options.reporterOptions)) {
    options.reporterOptions = sanitizeAndConvertNestedArgs(ro)
  }

  if ((c = options.config)) {
    //# convert config to an object
    //# annd store the config
    options.config = sanitizeAndConvertNestedArgs(c)
  }

  //# get a list of the available config keys
  const configKeys = config.getConfigKeys()

  //# and if any of our options match this
  const configValues = _.pick(options, configKeys)

  //# then set them on config
  //# this solves situations where we accept
  //# root level arguments which also can
  //# be set in configuration
  if (options.config == null) {
    options.config = {}
  }

  _.extend(options.config, configValues)

  //# remove them from the root options object
  options = _.omit(options, configKeys)

  options = normalizeBackslashes(options)

  //# normalize project to projectRoot
  if ((p = options.project || options.runProject)) {
    options.projectRoot = path.resolve(options.cwd, p)
  }

  //# normalize output path from previous current working directory
  if ((op = options.outputPath)) {
    options.outputPath = path.resolve(options.cwd, op)
  }

  if (options.runProject) {
    options.run = true
  }

  if (options.smokeTest) {
    options.pong = options.ping
  }

  debug("argv options: %o", options)

  return options as OptionsArgv
}

export const toArray = (obj = {}) => {
  //# goes in reverse, takes an object
  //# and converts to an array by picking
  //# only the whitelisted properties and
  //# mapping them to include the argument
  return _.chain(obj)
    .pick(...whitelist)
    .mapValues((val, key) => {
      return `--${key}=${stringify(val)}`
    })
    .values()
    .value()
}
