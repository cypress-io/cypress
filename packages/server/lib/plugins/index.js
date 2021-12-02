const _ = require('lodash')
const path = require('path')
const debug = require('debug')('cypress:server:plugins')
const resolve = require('resolve')
const Promise = require('bluebird')
const errors = require('../errors')
const util = require('./util')
const pkg = require('@packages/root')

let pluginsProcess
let executedPlugins
let registeredEvents = {}
let handlers = []

const register = (event, callback) => {
  debug(`register event '${event}'`)

  if (!_.isString(event)) {
    throw new Error(`The plugin register function must be called with an event as its 1st argument. You passed '${event}'.`)
  }

  if (!_.isFunction(callback)) {
    throw new Error(`The plugin register function must be called with a callback function as its 2nd argument. You passed '${callback}'.`)
  }

  registeredEvents[event] = callback
}

const getPluginPid = () => {
  if (pluginsProcess) {
    return pluginsProcess.pid
  }
}

const registerHandler = (handler) => {
  handlers.push(handler)
}

const has = (event) => {
  const isRegistered = !!registeredEvents[event]

  debug('plugin event registered? %o', {
    event,
    isRegistered,
  })

  return isRegistered
}

const execute = (event, ...args) => {
  debug(`execute plugin event '${event}' Node '${process.version}' with args: %o %o %o`, ...args)

  return registeredEvents[event](...args)
}

const _reset = () => {
  registeredEvents = {}
  handlers = []
}

const _setPluginsProcess = (_pluginsProcess) => {
  pluginsProcess = _pluginsProcess
}

const getPluginIpcHandlers = () => {
  return handlers
}

module.exports = {
  getPluginPid,
  execute,
  has,
  init,
  register,
  registerHandler,
  getPluginIpcHandlers,

  // for testing purposes
  _reset,
  _setPluginsProcess,
}
