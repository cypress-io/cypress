import events from './events'

class Shortcuts {
  start () {
    document.addEventListener('keydown', this._handleKeyDownEvent)
  }
  stop () {
    document.removeEventListener('keydown', this._handleKeyDownEvent)
  }
  _handleKeyDownEvent (event) {
    switch (event.key) {
      case 'r': events.emit('restart')
        break
      case 's': events.emit('stop')
        break
      default: return
    }
  }
}

export default new Shortcuts()
