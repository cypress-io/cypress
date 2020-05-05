const _ = require('lodash')

const HISTORY_ATTRS = 'pushState replaceState'.split(' ')

let events = []
let listenersAdded = null

const removeAllListeners = () => {
  listenersAdded = false

  for (let e of events) {
    const [win, event, cb] = e

    win.removeEventListener(event, cb)
  }

  // reset all the events
  events = []

  return null
}

const addListener = (win, event, cb) => {
  events.push([win, event, cb])

  win.addEventListener(event, cb)
}

const eventHasReturnValue = (e) => {
  const val = e.returnValue

  // return false if val is an empty string
  // of if its undinefed
  if (val === '' || _.isUndefined(val)) {
    return false
  }

  // else return true
  return true
}

module.exports = {
  bindTo (contentWindow, callbacks = {}) {
    if (listenersAdded) {
      return
    }

    removeAllListeners()

    listenersAdded = true

    // set onerror global handler
    contentWindow.onerror = callbacks.onError

    addListener(contentWindow, 'beforeunload', (e) => {
      // bail if we've canceled this event (from another source)
      // or we've set a returnValue on the original event
      if (e.defaultPrevented || eventHasReturnValue(e)) {
        return
      }

      callbacks.onBeforeUnload(e)
    })

    addListener(contentWindow, 'unload', (e) => {
      // when we unload we need to remove all of the event listeners
      removeAllListeners()

      // else we know to proceed onwards!
      callbacks.onUnload(e)
    })

    addListener(contentWindow, 'hashchange', (e) => {
      callbacks.onNavigation('hashchange', e)
    })

    for (let attr of HISTORY_ATTRS) {
      const orig = contentWindow.history?.[attr]

      if (!orig) {
        continue
      }

      contentWindow.history[attr] = function (...args) {
        orig.apply(this, args)

        return callbacks.onNavigation(attr, args)
      }
    }

    addListener(contentWindow, 'submit', (e) => {
      // if we've prevented the default submit action
      // without stopping propagation, we will still
      // receive this event even though the form
      // did not submit
      if (e.defaultPrevented) {
        return
      }

      // else we know to proceed onwards!
      return callbacks.onSubmit(e)
    })

    contentWindow.alert = callbacks.onAlert
    contentWindow.confirm = callbacks.onConfirm
  },
}
