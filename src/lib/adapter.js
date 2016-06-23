import { EventEmitter } from 'events'

const localBus = new EventEmitter()

window.adapterBus = localBus

class Driver {
  on (event, ...args) {
    localBus.on(event, ...args)
  }
}

export default new Driver()
