import { $, dom } from '@packages/driver'
import events from './events'

class Shortcuts {
  start (appState) {
    this._appState = appState
    document.addEventListener('keydown', this._handleKeyDownEvent)
  }
  stop () {
    document.removeEventListener('keydown', this._handleKeyDownEvent)
  }
  _handleKeyDownEvent (event) {
    // if typing into an input, textarea, etc, don't trigger any shortcuts
    if (dom.isTextLike($(event.target))) return

    switch (event.key) {
      case 'r': events.emit('restart')
        break
      case 's': events.emit('stop')
        break
      case 'f': events.emit('focus:tests')
        break
      default: return
    }
  }
}

export default new Shortcuts()
