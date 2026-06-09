// @ts-ignore
import $dom from '@packages/driver/src/dom'
import events from './events'
import appState from './app-state'
import { action } from 'mobx'

class Shortcuts {
  start () {
    this.addEventListeners(document)
  }

  stop () {
    this.removeEventListeners(document)
  }

  // The reporter and the application under test (AUT) live in separate
  // documents (the AUT is a child iframe). A keydown only fires in the
  // document that owns the focused element and does not cross the iframe
  // boundary, so when a spec leaves focus inside the AUT (e.g. after
  // cy.type() or cy.focus()), shortcuts pressed there never reach the
  // reporter's document. The app forwards the AUT's document here once it
  // has loaded so these shortcuts keep working regardless of where focus is.
  addEventListeners (doc: Document) {
    doc.addEventListener('keydown', this._handleKeyDownEvent)
  }

  removeEventListeners (doc: Document) {
    doc.removeEventListener('keydown', this._handleKeyDownEvent)
  }

  _handleKeyDownEvent (event: KeyboardEvent) {
    // if typing into an input, textarea, etc, don't trigger any shortcuts
    // @ts-ignore
    const isTextLike = $dom.isTextLike(event.target)
    const isAnyModifierKeyPressed = event.altKey || event.ctrlKey || event.shiftKey || event.metaKey

    if (isAnyModifierKeyPressed || isTextLike) return

    switch (event.key) {
      case 'r': events.emit('restart')
        break
      case 's': !appState.isPaused && events.emit('stop')
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
        appState.toggleAutoScrollingUserPref()
        events.emit('save:state')
      })()

        break
      default: return
    }
  }
}

export default new Shortcuts()
