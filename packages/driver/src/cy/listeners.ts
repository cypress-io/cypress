import _ from 'lodash'
import { handleInvalidEventTarget, handleInvalidAnchorTarget, GuardedEvent, GuardedAnchorEvent } from './top_attr_guards'

const HISTORY_ATTRS = 'pushState replaceState'.split(' ')
const HISTORY_NAV_ATTRS = 'go back forward'.split(' ')

type BoundEventHandler<K extends keyof WindowEventMap> =
  K extends 'click' ? (this: Window, ev: GuardedAnchorEvent) => any
    : K extends 'submit' ? (this: Window, ev: GuardedEvent) => any
      : (this: Window, ev: WindowEventMap[K]) => any

type BoundEvent<K extends keyof WindowEventMap> = [
  win: Window,
  event: keyof WindowEventMap,
  fn: BoundEventHandler<K>,
  capture?: boolean
]

let events: BoundEvent<any>[] = []
let listenersAdded: boolean | null = null

const removeAllListeners = () => {
  listenersAdded = false

  for (let e of events) {
    const [win, event, cb, capture] = e

    // Cast to `any` to ignore `GuardedEvent`/`GuardedAnchorEvent`.
    win.removeEventListener(event, cb as any, capture)
  }

  // reset all the events
  events = []

  return null
}

const addListener = <K extends keyof WindowEventMap>(win: Window, event: K, fn: BoundEventHandler<K>, capture?: boolean) => {
  events.push([win, event, fn, capture])

  // Cast to `any` to ignore `GuardedEvent`/`GuardedAnchorEvent`.
  win.addEventListener(event, fn as any, capture)
}

const eventHasReturnValue = (e) => {
  const val = e.returnValue

  // return false if val is an empty string
  // of if its undefined
  if (val === '' || _.isUndefined(val)) {
    return false
  }

  // else return true
  return true
}

type BoundCallbacks = {
  onError: (handlerType) => (event) => undefined
  onHistoryNav: (delta) => void
  onSubmit: (e) => any
  onLoad: (e) => any
  onBeforeUnload: (e) => undefined | Promise<undefined>
  onPageHide: (e: PageTransitionEvent) => any
  onNavigation: (...args) => any
  onAlert: (str) => any
  onConfirm: (str) => boolean
}

export const bindToListeners = (contentWindow, callbacks: BoundCallbacks) => {
  if (listenersAdded) {
    return
  }

  removeAllListeners()

  listenersAdded = true

  addListener(contentWindow, 'error', callbacks.onError('error'))
  addListener(contentWindow, 'unhandledrejection', callbacks.onError('unhandledrejection'))

  addListener(contentWindow, 'load', (e) => {
    callbacks.onLoad(e)
  })

  addListener(contentWindow, 'beforeunload', async (e) => {
    // bail if we've canceled this event (from another source)
    // or we've set a returnValue on the original event
    if (e.defaultPrevented || eventHasReturnValue(e)) {
      return
    }

    await callbacks.onBeforeUnload(e)
  })

  // While we must move to pagehide for Chromium, it does not work for our
  // needs in Firefox. Until that is addressed, only Chromium uses the pagehide
  // event as a proxy for AUT unloads.

  const unloadEvent = Cypress.browser.family === 'chromium' ? 'pagehide' : 'unload'

  addListener(contentWindow, unloadEvent, (e) => {
    // when we unload we need to remove all of the event listeners
    removeAllListeners()

    // else we know to proceed onwards!
    callbacks.onPageHide(e)
  })

  addListener(contentWindow, 'hashchange', (e) => {
    callbacks.onNavigation('hashchange', e)
  })

  for (let attr of HISTORY_NAV_ATTRS) {
    const orig = contentWindow.history?.[attr]

    if (!orig) {
      continue
    }

    contentWindow.history[attr] = function (delta) {
      callbacks.onHistoryNav(attr === 'back' ? -1 : (attr === 'forward' ? 1 : delta))

      orig.apply(this, [delta])
    }
  }

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
}
