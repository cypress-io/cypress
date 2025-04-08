/**
 container.clientHeight:
 - container visible area height ("viewport")
 - includes padding, but not margin or border
 container.scrollTop:
 - container scroll position:
 container.scrollHeight:
 - total container height (visible + not visible)
 element.clientHeight:
 - element height
 - includes padding, but not margin or border
 element.offsetTop:
 - element distance from top of container
*/

export type UserScrollCallback = () => void

const PADDING = 100
const SCROLL_THRESHOLD_MS = 50

export class Scroller {
  private _container: Element | null = null
  private _userScrollCount = 0
  private _countUserScrollsTimeout?: number
  private _userScrollThresholdMs = SCROLL_THRESHOLD_MS

  setContainer (container: Element, onUserScroll?: UserScrollCallback) {
    this._container = container

    this._userScrollCount = 0

    this._listenToScrolls(onUserScroll)
  }

  _listenToScrolls (onUserScroll?: UserScrollCallback) {
    if (!this._container) return

    this._container.addEventListener('scroll', () => {
      this._userScrollCount++

      if (this._userScrollCount <= 0) {
        // programmatic scroll
        return
      }

      // there can be false positives for user scrolls, so make sure we get 3
      // or more scroll events within 50ms to count it as a user intending to scroll
      if (this._userScrollCount >= 3) {
        if (onUserScroll) {
          onUserScroll()
        }

        clearTimeout(this._countUserScrollsTimeout)
        this._countUserScrollsTimeout = undefined
        this._userScrollCount = 0

        return
      }

      if (this._countUserScrollsTimeout) return

      this._countUserScrollsTimeout = window.setTimeout(() => {
        this._countUserScrollsTimeout = undefined
        this._userScrollCount = 0
      }, this._userScrollThresholdMs)
    })
  }

  scrollIntoView (element: HTMLElement) {
    if (!this._container) {
      throw new Error('A container must be set on the scroller with `scroller.setContainer(container)` before trying to scroll an element into view')
    }

    if (this._isFullyVisible(element)) {
      return
    }

    // aim to scroll just into view, so that the bottom of the element
    // is just above the bottom of the container
    let scrollTopGoal = this._aboveBottom(element)

    // can't have a negative scroll, so put it to the top
    if (scrollTopGoal < 0) {
      scrollTopGoal = 0
    }

    this._userScrollCount--
    this._container.scrollTop = scrollTopGoal
  }

  _isFullyVisible (element: HTMLElement) {
    if (!this._container) return false

    return element.offsetTop - this._container.scrollTop > 0
           && this._container.scrollTop > this._aboveBottom(element)
  }

  _aboveBottom (element: HTMLElement) {
    // add padding, since commands expanding and collapsing can mess with
    // the offset, causing the running command to be half cut off
    // https://github.com/cypress-io/cypress/issues/228

    const containerHeight = this._container ? this._container.clientHeight : 0

    return element.offsetTop + element.clientHeight - containerHeight + PADDING
  }

  getScrollTop () {
    return this._container ? this._container.scrollTop : 0
  }

  setScrollTop (scrollTop?: number | null) {
    if (this._container && scrollTop != null) {
      this._container.scrollTop = scrollTop
    }
  }

  scrollToEnd () {
    if (!this._container) return

    this.setScrollTop(this._container.scrollHeight - this._container.clientHeight)
  }

  // for testing purposes
  __reset () {
    this._container = null
    this._userScrollCount = 0
    clearTimeout(this._countUserScrollsTimeout)
    this._countUserScrollsTimeout = undefined
    this._userScrollThresholdMs = SCROLL_THRESHOLD_MS
  }

  __setScrollThresholdMs (ms: number) {
    const isCypressInCypress = document.defaultView !== top

    // only allow this to be set in testing
    if (!isCypressInCypress) {
      return
    }

    this._userScrollThresholdMs = ms
  }
}

export default new Scroller()
