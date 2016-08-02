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

export default {
  setContainer (container, onUserScroll) {
    this._container = container

    this._userScroll = true
    this._userScrollCount = 0

    this._listenToScrolls(onUserScroll)
  },

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
  },

  scrollIntoView (element, id) {
    if (!this._container) {
      throw new Error('A container must be set on the scroller with `scroller.setContainer(container)` before trying to scroll an element into view')
    }

    // aim to scroll just into view, so that the bottom of the element
    // is at the bottom of the container
    let scrollTopGoal = this._bottomToBottom(element)
    // can't have a negative scroll, so put it to the top
    if (scrollTopGoal < 0) scrollTopGoal = 0

    this._animateScoll(scrollTopGoal, element, id)
  },

  _animateScoll (scrollTopGoal, element, id) {
    if (this._lastScrollTopGoal && this._lastId !== id) {
      // we ran out of time trying to animate the last element, so immediately
      // set the scroll position to its goal
      this._container.scrollTop = this._lastScrollTopGoal
    }

    clearInterval(this._interval)
    this._lastScrollTopGoal = scrollTopGoal
    this._lastId = id

    // should the scrollTop being ascending or descending to its goal
    const isAscending = this._container.scrollTop < scrollTopGoal

    const scroll = () => {
      // might have changed due to elements resizing, so get it again
      const ableToScroll = this._container.scrollHeight - this._container.clientHeight
      const currentScrollTop = this._container.scrollTop

      let nextScrollTop = isAscending ? currentScrollTop + 10 : currentScrollTop - 10
      const aboutToOvershoot = isAscending ? nextScrollTop >= scrollTopGoal : nextScrollTop <= scrollTopGoal
      if (aboutToOvershoot) nextScrollTop = scrollTopGoal

      if (
        this._isFullyVisible(element)
        || currentScrollTop === scrollTopGoal // we made it
        || scrollTopGoal > ableToScroll // things have changed and we can't get to the goal
      ) {
        clearInterval(this._interval)
        return
      }

      this._userScroll = false
      this._container.scrollTop = nextScrollTop
    }

    this._interval = setInterval(scroll, 16)
    scroll()
  },

  _isFullyVisible (element) {
    return element.offsetTop - this._container.scrollTop > 0
           && this._container.scrollTop > this._bottomToBottom(element)
  },

  _bottomToBottom (element) {
    return element.offsetTop + element.clientHeight - this._container.clientHeight
  },

  getScrollTop () {
    return this._container ? this._container.scrollTop : 0
  },

  setScrollTop (scrollTop) {
    if (this._container && scrollTop != null) {
      this._container.scrollTop = scrollTop
    }
    if (!this._container) {
      console.warn('tried to set scroll top before container was set') // eslint-disable-line no-console
    }
  },

  // for testing purposes
  __reset () {
    this._container = null
    this._lastScrollTopGoal = null
    this._lastId = null
    this._userScroll = true
    this._userScrollCount = 0
    clearInterval(this._interval)
    clearTimeout(this._countUserScrollsTimeout)
    this._countUserScrollsTimeout = null
  },
}
