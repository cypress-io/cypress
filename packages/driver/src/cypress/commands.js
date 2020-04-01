const _ = require('lodash')

const $errUtils = require('./error_utils')

const builtInCommands = [
  require('../cy/commands/actions/check'),
  require('../cy/commands/actions/click'),
  require('../cy/commands/actions/focus'),
  require('../cy/commands/actions/hover'),
  require('../cy/commands/actions/scroll'),
  require('../cy/commands/actions/select'),
  require('../cy/commands/actions/submit'),
  require('../cy/commands/actions/trigger'),
  require('../cy/commands/actions/type'),
  require('../cy/commands/agents'),
  require('../cy/commands/aliasing'),
  require('../cy/commands/angular'),
  require('../cy/commands/asserting'),
  require('../cy/commands/clock'),
  require('../cy/commands/commands'),
  require('../cy/commands/connectors'),
  require('../cy/commands/cookies'),
  require('../cy/commands/debugging'),
  require('../cy/commands/exec'),
  require('../cy/commands/files'),
  require('../cy/commands/fixtures'),
  require('../cy/commands/local_storage'),
  require('../cy/commands/location'),
  require('../cy/commands/misc'),
  require('../cy/commands/popups'),
  require('../cy/commands/navigation'),
  require('../cy/commands/querying'),
  require('../cy/commands/request'),
  require('../cy/commands/screenshot'),
  require('../cy/commands/task'),
  require('../cy/commands/traversals'),
  require('../cy/commands/waiting'),
  require('../cy/commands/window'),
  require('../cy/commands/xhr'),
]

const getTypeByPrevSubject = function (prevSubject) {
  if (!(prevSubject !== 'optional')) {
    return 'dual'
  }

  if (prevSubject) {
    return 'child'
  }

  return 'parent'
}

const create = function (Cypress, cy, state, config) {
  // create a single instance
  // of commands
  const commands = {}
  const commandBackups = {}

  const store = function (obj) {
    commands[obj.name] = obj

    return cy.addCommand(obj)
  }

  const storeOverride = function (name, fn) {
    // grab the original function if its been backed up
    // or grab it from the command store
    const original = commandBackups[name] || commands[name]

    if (!original) {
      $errUtils.throwErrByPath('miscellaneous.invalid_overwrite', {
        args: {
          name,
        },
      })
    }

    // store the backup again now
    commandBackups[name] = original

    const originalFn = function (...args) {
      const current = state('current')
      let storedArgs = args

      if (current.get('type') === 'child') {
        storedArgs = args.slice(1)
      }

      current.set('args', storedArgs)

      return original.fn(...args)
    }

    const overridden = _.clone(original)

    overridden.fn = function (...args) {
      args = [].concat(originalFn, args)

      return fn.apply(this, args)
    }

    return cy.addCommand(overridden)
  }

  const Commands = {
    _commands: commands, // for testing

    each (fn) {
      // perf loop
      for (let name in commands) {
        const command = commands[name]

        fn(command)
      }

      // prevent loop comprehension
      return null
    },

    addAllSync (obj) {
      // perf loop
      for (let name in obj) {
        const fn = obj[name]

        Commands.addSync(name, fn)
      }

      // prevent loop comprehension
      return null
    },

    addSync (name, fn) {
      return cy.addCommandSync(name, fn)
    },

    addAll (options = {}, obj) {
      if (!obj) {
        obj = options
        options = {}
      }

      // perf loop
      for (let name in obj) {
        const fn = obj[name]

        Commands.add(name, options, fn)
      }

      // prevent loop comprehension
      return null
    },

    add (name, options, fn) {
      if (_.isFunction(options)) {
        fn = options
        options = {}
      }

      const { prevSubject } = options
      const type = options.type != null
        ? options.type
        : getTypeByPrevSubject(prevSubject)

      return store({
        name,
        fn,
        type,
        prevSubject,
      })
    },

    addChainer (obj) {
      // perp loop
      for (let name in obj) {
        const fn = obj[name]

        cy.addChainer(name, fn)
      }

      // prevent loop comprehension
      return null
    },

    overwrite (name, fn) {
      return storeOverride(name, fn)
    },
  }

  // perf loop
  for (let cmd of builtInCommands) {
    cmd(Commands, Cypress, cy, state, config)
  }

  return Commands
}

module.exports = {
  create,
}
