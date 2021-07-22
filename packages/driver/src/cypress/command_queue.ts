import _ from 'lodash'

export const create = (commands: any[] = []) => {
  const get = () => {
    return commands
  }

  const logs = (filter) => {
    let logs = _.flatten(_.invokeMap(commands, 'get', 'logs'))

    if (filter) {
      const matchesFilter = _.matches(filter)

      logs = _.filter(logs, (log) => {
        return matchesFilter(log.get())
      })
    }

    return logs
  }

  const names = () => {
    return _.invokeMap(commands, 'get', 'name')
  }

  const _splice = (startIndex: number, deleteCount: number, command) => {
    commands.splice(startIndex, deleteCount, command)

    const prev = at(startIndex - 1)
    const next = at(startIndex + 1)

    if (prev) {
      prev.set('next', command)
      command.set('prev', prev)
    }

    if (next) {
      next.set('prev', command)
      command.set('next', next)
    }

    return command
  }

  const insert = (index: number, command) => {
    if (index < 0 || index > commands.length) {
      throw new Error(`commandQueue.insert must be called with a valid index - the index (${index}) is out of bounds`)
    }

    return _splice(index, 0, command)
  }

  const slice = (index: number) => {
    return commands.slice(index)
  }

  const at = (index) => {
    return commands[index]
  }

  const find = (attrs) => {
    const matchesAttrs = _.matches(attrs)

    return _.find(commands, (command) => {
      return matchesAttrs(command.attributes)
    })
  }

  const clear = () => {
    commands.length = 0
  }

  return {
    get,
    logs,
    names,
    insert,
    slice,
    at,
    find,
    clear,

    get length () {
      return commands.length
    },
  }
}
