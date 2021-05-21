const _ = require('lodash')
const { handleInvalidEventTarget, handleInvalidAnchorTarget } = require('./top_attr_guards')

const HISTORY_ATTRS = 'pushState replaceState'.split(' ')

let events = []
let listenersAdded = null

const removeAllListeners = () => {
  listenersAdded = false

  for (let e of events) {
    const [win, event, cb, capture] = e

    win.removeEventListener(event, cb, capture)
  }

  // reset all the events
  events = []

  return null
}

const addListener = (win, event, fn, capture) => {
  events.push([win, event, fn, capture])

  win.addEventListener(event, fn, capture)
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
  bindTo(contentWindow, callbacks = {}) {
    if (listenersAdded) {
      return
    }

    removeAllListeners()

    listenersAdded = true

    addListener(contentWindow, 'error', callbacks.onError('error'))
    addListener(contentWindow, 'unhandledrejection', callbacks.onError('unhandledrejection'))

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

    // Handling the situation where "_top" is set on the <form> / <a> element, either in
    // html or dynamically, by tapping in at the capture phase of the events
    addListener(contentWindow, 'submit', handleInvalidEventTarget, true)
    addListener(contentWindow, 'click', handleInvalidAnchorTarget, true)

    contentWindow.alert = callbacks.onAlert
    contentWindow.confirm = callbacks.onConfirm
  },
}
