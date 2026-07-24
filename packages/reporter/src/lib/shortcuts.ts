// @ts-ignore
import $dom from '@packages/driver/src/dom'
import events from './events'
import appState from './app-state'
import { action } from 'mobx'
import { getReporterDocument } from './reporter-document'

class Shortcuts {
  private _boundDocuments: Document[] = []

  start () {
    // bind to both the top document and the reporter's document (they differ
    // when the reporter renders inside an iframe) so shortcuts fire regardless
    // of which document has focus
    new Set([document, getReporterDocument()]).forEach((doc) => {
      doc.addEventListener('keydown', this._handleKeyDownEvent)
      this._boundDocuments.push(doc)
    })
  }

  stop () {
    this._boundDocuments.forEach((doc) => {
      doc.removeEventListener('keydown', this._handleKeyDownEvent)
    })

    this._boundDocuments = []
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
