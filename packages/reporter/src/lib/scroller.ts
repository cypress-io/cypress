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

    // Always decrement user scroll count to mark this as a programmatic scroll
    // This must happen before checking if we need to scroll, so that any scroll
    // events that fire are properly accounted for
    this._userScrollCount--

    // Use setScrollTop to get early exit check and avoid unnecessary DOM writes
    // Check if already at target position to avoid unnecessary DOM writes
    if (this._isScrollPositionNear(this._container.scrollTop, scrollTopGoal)) {
      return
    }

    this.setScrollTop(scrollTopGoal)
  }

  _isFullyVisible (element: HTMLElement) {
    if (!this._container) return false

    const scrollTop = this._container.scrollTop
    const elementOffsetTop = element.offsetTop

    // Early exit if element is above the visible area
    if (elementOffsetTop - scrollTop <= 0) {
      return false
    }

    // Check if scroll position is above the calculated bottom position
    return scrollTop > this._aboveBottom(element)
  }

  _aboveBottom (element: HTMLElement) {
    // add padding, since commands expanding and collapsing can mess with
    // the offset, causing the running command to be half cut off
    // https://github.com/cypress-io/cypress/issues/228

    if (!this._container) return 0

    const elementOffsetTop = element.offsetTop
    const elementClientHeight = element.clientHeight
    const containerHeight = this._container.clientHeight

    return elementOffsetTop + elementClientHeight - containerHeight + PADDING
  }

  // Check if two scroll positions are within 1px tolerance.
  // Used to avoid unnecessary DOM writes when scroll position is already at target.
  // The 1px tolerance accounts for sub-pixel rendering differences.
  _isScrollPositionNear (current: number, target: number): boolean {
    return Math.abs(current - target) <= 1
  }

  getScrollTop () {
    return this._container ? this._container.scrollTop : 0
  }

  setScrollTop (scrollTop?: number | null) {
    if (!this._container || scrollTop == null) return

    // Validate scrollTop is a finite number
    if (!Number.isFinite(scrollTop)) {
      return
    }

    // Early exit if already at target position (within 1px tolerance for sub-pixel rendering)
    const currentScrollTop = this._container.scrollTop

    if (this._isScrollPositionNear(currentScrollTop, scrollTop)) {
      return
    }

    this._container.scrollTop = scrollTop
  }

  scrollToEnd () {
    if (!this._container) return

    const scrollHeight = this._container.scrollHeight
    const clientHeight = this._container.clientHeight
    const currentScrollTop = this._container.scrollTop
    const targetScrollTop = scrollHeight - clientHeight

    // Early exit if already at or near the end (within 1px to account for rounding)
    if (this._isScrollPositionNear(currentScrollTop, targetScrollTop)) {
      return
    }

    this.setScrollTop(targetScrollTop)
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
