import _ from 'lodash'
import { observable } from 'mobx'

export default class Runnable {
  @observable id
  @observable type
  @observable title
  @observable children = []
  @observable agents = []
  @observable routes = []
  @observable hooks = []

  constructor (props, type) {
    this.id = props.id
    this.title = props.title
    this.type = type
  }

  addAgent (agent) {
    this.agents.push(agent)
  }

  addRoute (route) {
    this.routes.push(route)
  }

  addCommand (command) {
    command
  }

  serialize () {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      children: _.map(this.children, (runnable) => runnable.serialize()),
      agents: _.map(this.agents, (agent) => agent.serialize()),
      routes: _.map(this.routes, (route) => route.serialize()),
      hooks: _.map(this.hooks, (hook) => hook.serialize()),
    }
  }
}
