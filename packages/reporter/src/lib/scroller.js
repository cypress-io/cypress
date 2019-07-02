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

const PADDING = 100

class Scroller {
  setContainer (container, onUserScroll) {
    this._container = container

    this._userScroll = true
    this._userScrollCount = 0

    this._listenToScrolls(onUserScroll)
  }

  _listenToScrolls (onUserScroll) {
    this._container.addEventListener('scroll', () => {
      if (!this._userScroll) {
        // programmatic scroll
        this._userScroll = true

        return
      }

      // there can be false positives for user scrolls, so make sure we get 3
      // or more scroll events within 50ms to count it as a user intending to scroll
      this._userScrollCount++
      if (this._userScrollCount >= 3) {
        onUserScroll()
        clearTimeout(this._countUserScrollsTimeout)
        this._countUserScrollsTimeout = null
        this._userScrollCount = 0

        return
      }

      if (this._countUserScrollsTimeout) return

      this._countUserScrollsTimeout = setTimeout(() => {
        this._countUserScrollsTimeout = null
        this._userScrollCount = 0
      }, 50)
    })
  }

  scrollIntoView (element) {
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

    this._userScroll = false
    this._container.scrollTop = scrollTopGoal
  }

  _isFullyVisible (element) {
    return element.offsetTop - this._container.scrollTop > 0
           && this._container.scrollTop > this._aboveBottom(element)
  }

  _aboveBottom (element) {
    // add padding, since commands expanding and collapsing can mess with
    // the offset, causing the running command to be half cut off
    // https://github.com/cypress-io/cypress/issues/228
    return element.offsetTop + element.clientHeight - this._container.clientHeight + PADDING
  }

  getScrollTop () {
    return this._container ? this._container.scrollTop : 0
  }

  setScrollTop (scrollTop) {
    if (this._container && scrollTop != null) {
      this._container.scrollTop = scrollTop
    }
  }

  scrollToEnd () {
    this.setScrollTop(this._container.scrollHeight - this._container.clientHeight)
  }

  // for testing purposes
  __reset () {
    this._container = null
    this._userScroll = true
    this._userScrollCount = 0
    clearTimeout(this._countUserScrollsTimeout)
    this._countUserScrollsTimeout = null
  }
}

export default new Scroller()
