// @ts-ignore
import dom from '@packages/driver/src/dom'
import events from './events'
import appState from './app-state'

class Shortcuts {
  start () {
    document.addEventListener('keydown', this._handleKeyDownEvent)
  }

  stop () {
    document.removeEventListener('keydown', this._handleKeyDownEvent)
  }

  _handleKeyDownEvent (event: KeyboardEvent) {
    // if typing into an input, textarea, etc, don't trigger any shortcuts
    // @ts-ignore
    if (dom.isTextLike(event.target)) return

    switch (event.key) {
      case 'r': events.emit('restart')
        break
      case 's': !appState.isPaused && events.emit('stop')
        break
      case 'f': events.emit('focus:tests')
        break
      default: return
    }
  }
}

export default new Shortcuts()
