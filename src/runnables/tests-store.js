import _ from 'lodash'
import { observable } from 'mobx'

import Agent from '../test/agent-model'
import Command from '../test/command-model'
import Route from '../test/route-model'

const defaults = {
  commands: [],
  routes: [],
  agents: [],
}

class TestsStore {
  @observable commands = defaults.commands
  @observable routes = defaults.routes
  @observable agents = defaults.agents

  add (log) {
    switch (log.instrument) {
      case 'command':
        this.commands.push(new Command(log))
        break
      case 'agent':
        this.agents.push(new Agent(log))
        break
      case 'route':
        this.routes.push(new Route(log))
        break
      default:
        throw new Error(`Attempted to add log for unknown instrument: ${log.instrument}`)
    }
  }

  update (log) {
    // TODO
    log
  }

  reset () {
    _.each(defaults, (value, key) => {
      this[key] = value
    })
  }
}

export default new TestsStore()
