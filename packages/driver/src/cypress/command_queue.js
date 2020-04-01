/* eslint-disable
    prefer-rest-params,
*/
const _ = require('lodash')
const utils = require('./utils')
const $Command = require('./command')

class $CommandQueue {
  constructor (cmds = []) {
    this.commands = cmds
  }

  logs (filters) {
    let logs = _.flatten(this.invokeMap('get', 'logs'))

    if (filters) {
      const matchesFilters = _.matches(filters)

      logs = _.filter(logs, (log) => matchesFilters(log.get()))
    }

    return logs
  }

  add (obj) {
    if (utils.isInstanceOf(obj, $Command)) {
      return obj
    }

    return $Command.create(obj)
  }

  get () {
    return this.commands
  }

  names () {
    return this.invokeMap('get', 'name')
  }

  splice (start, end, obj) {
    const cmd = this.add(obj)

    this.commands.splice(start, end, cmd)

    const prev = this.at(start - 1)
    const next = this.at(start + 1)

    if (prev) {
      prev.set('next', cmd)
      cmd.set('prev', prev)
    }

    if (next) {
      next.set('prev', cmd)
      cmd.set('next', next)
    }

    return cmd
  }

  slice () {
    const cmds = this.commands.slice.apply(this.commands, arguments)

    return $CommandQueue.create(cmds)
  }

  at (index) {
    return this.commands[index]
  }

  _filterByAttrs (attrs, method) {
    const matchesAttrs = _.matches(attrs)

    return _[method](this.commands, (command) => matchesAttrs(command.attributes))
  }

  filter (attrs) {
    return this._filterByAttrs(attrs, 'filter')
  }

  find (attrs) {
    return this._filterByAttrs(attrs, 'find')
  }

  toJSON () {
    return this.invokeMap('toJSON')
  }

  reset () {
    this.commands.splice(0, this.commands.length)

    return this
  }

  static create (cmds, options = {}) {
    return new $CommandQueue(cmds)
  }
}

Object.defineProperty($CommandQueue.prototype, 'length', {
  get () {
    return this.commands.length
  },
})

// mixin lodash methods
_.each(['invokeMap', 'map', 'first', 'reduce', 'reject', 'last', 'indexOf', 'each'], (method) => {
  return $CommandQueue.prototype[method] = function (...args) {
    args.unshift(this.commands)

    return _[method].apply(_, args)
  }
})

module.exports = $CommandQueue
