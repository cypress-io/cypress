import _ from 'lodash'
import { allCommands } from '../cy/commands'
import { addCommand as addNetstubbingCommand } from '../cy/net-stubbing'
import $errUtils from './error_utils'
import $stackUtils from './stack_utils'

const PLACEHOLDER_COMMANDS = ['mount', 'hover']

const builtInCommands = [
  // `default` is necessary if a file uses `export default` syntax.
  // @ts-ignore
  ..._.toArray(allCommands).map((c) => c.default || c),
  addNetstubbingCommand,
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
    const reservedCommandNames = new Set(Object.keys(cy))
    // create a single instance
    // of commands
    const commands = {}
    const commandBackups = {}
    // we track built in commands to ensure users cannot
    // add custom commands with the same name
    const builtInCommandNames = {}
    let addingBuiltIns

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

      function originalFn (...args) {
        const current = state('current')
        let storedArgs = args

        if (current.get('type') === 'child') {
          storedArgs = args.slice(1)
        }

        current.set('args', storedArgs)

        return original.fn.apply(this, args)
      }

      const overridden = _.clone(original)

      overridden.fn = function (...args) {
        args = ([] as any).concat(originalFn, args)

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
        if (builtInCommandNames[name]) {
          $errUtils.throwErrByPath('miscellaneous.invalid_new_command', {
            args: {
              name,
            },
            stack: (new state('specWindow').Error('add command stack')).stack,
            errProps: {
              appendToStack: {
                title: 'From Cypress Internals',
                content: $stackUtils.stackWithoutMessage((new Error('add command internal stack')).stack || ''),
              } },
          })
        }

        if (reservedCommandNames.has(name)) {
          $errUtils.throwErrByPath('miscellaneous.reserved_command', {
            args: {
              name,
            },
            stack: (new state('specWindow').Error('add command stack')).stack,
            errProps: {
              appendToStack: {
                title: 'From Cypress Internals',
                content: $stackUtils.stackWithoutMessage((new Error('add command internal stack')).stack),
              } },
          })
        }

        // .hover & .mount are special case commands. allow as builtins so users
        // may add them without throwing an error
        if (addingBuiltIns && !PLACEHOLDER_COMMANDS.includes(name)) {
          builtInCommandNames[name] = true
        }

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

      overwrite (name, fn) {
        return storeOverride(name, fn)
      },
    }

    addingBuiltIns = true
    // perf loop
    for (let cmd of builtInCommands) {
      // support "export default" syntax
      cmd = cmd.default || cmd
      cmd(Commands, Cypress, cy, state, config)
    }
    addingBuiltIns = false

    return Commands
  },
}
