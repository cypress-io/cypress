// @ts-ignore
import dom from '@packages/driver/src/dom'
import events from './events'
import appState from './app-state'
import { action } from 'mobx'

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
      case 'r': !appState.studioActive && events.emit('restart')
        break
      case 's': !appState.isPaused && !appState.studioActive && events.emit('stop')
        break
      case 'f': action('toggle:spec:list', () => {
        appState.toggleSpecList()
        events.emit('save:state')
      })()

        break
      case 'c': events.emit('resume')
        break
      case 'n': events.emit('next')
        break
      case 'a': action('set:scrolling', () => {
        appState.setAutoScrolling(!appState.autoScrollingEnabled)
        events.emit('save:state')
      })()

        break
      default: return
    }
  }
}

export default new Shortcuts()
