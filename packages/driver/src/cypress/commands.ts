// @ts-nocheck

import _ from 'lodash'

import $errUtils from './error_utils'

import { allCommands } from '../cy/commands'
import { addCommand } from '../cy/net-stubbing'

const builtInCommands = [
  ..._.toArray(allCommands).map((c) => c.default || c),
  addCommand,
]

const getTypeByPrevSubject = (prevSubject) => {
  if (prevSubject === 'optional') {
    return 'dual'
  }

  if (prevSubject) {
    return 'child'
  }

  return 'parent'
}

export default {
  create: (Cypress, cy, state, config) => {
    // create a single instance
    // of commands
    const commands = {}
    const commandBackups = {}

    const store = (obj) => {
      commands[obj.name] = obj

      return cy.addCommand(obj)
    }

    const storeOverride = (name, fn) => {
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

      const originalFn = (...args) => {
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

        // normalize type by how they validate their
        // previous subject (unless they're explicitly set)
        options.type = options.type ?? getTypeByPrevSubject(prevSubject)
        const type = options.type

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
      // support "export default" syntax
      cmd = cmd.default || cmd
      cmd(Commands, Cypress, cy, state, config)
    }

    return Commands
  },
}
