/**
 container.clientHeight:
 - container visible area height ("viewport")
 - includes padding, but not margin or border
 container.scrollTop:
 - container scroll position:
 container.scrollHeight:
 - total container height (visible + not visible)
 element.offsetTop:
 - element distance from top of container
 element.clientHeight:
 - element height
 - includes padding, but not margin or border
*/

export default {
  setContainer (container) {
    this.container = container
  },

  scrollIntoView (element, id) {
    const ableToScroll = this.container.scrollHeight - this.container.clientHeight

    const halfViewportHeight = Math.floor(this.container.clientHeight / 2)
    const halfElementHeight = Math.floor(element.clientHeight / 2)
    const viewportToTopOfElement = halfViewportHeight - halfElementHeight
    // try to center element vertically
    let wantToScroll = element.offsetTop - viewportToTopOfElement
    // can't have a negative scroll, so put it to the top
    if (wantToScroll < 0) wantToScroll = 0

    // if wantToScroll is less than ableToScroll, we've reached the end of the
    // container, so put the scroll position all the way down
    const scrollTopGoal = wantToScroll < ableToScroll ? wantToScroll : ableToScroll

    this._animateScoll(scrollTopGoal, element, id)
  },

  _animateScoll (scrollTopGoal, element, id) {
    // we ran out of time trying to animate the last element, so immediately
    // set the scroll position to its goal
    if (this._lastScrollTopGoal && this._lastId !== id) this.container.scrollTop = this._lastScrollTopGoal
    clearInterval(this._interval)
    this._lastScrollTopGoal = scrollTopGoal
    this._lastId = id

    // should the scrollTop being ascending or descending to its goal
    const ascending = this.container.scrollTop < scrollTopGoal

    this._interval = setInterval(() => {
      // ableToScroll might have changed due to elements resizing, so get it again
      const ableToScroll = this.container.scrollHeight - this.container.clientHeight
      const currentScrollTop = this.container.scrollTop
      let nextScrollTop = ascending ? currentScrollTop + 10 : currentScrollTop - 10
      if (element.clientHeight > this.container.clientHeight) {
        // element is taller than viewport, align top of element with top of viewport
        nextScrollTop = element.offsetTop
      }
      if (nextScrollTop > ableToScroll || (ascending ? currentScrollTop >= scrollTopGoal : currentScrollTop <= scrollTopGoal)) {
        // we're about to overshoot or we somehow already overshot, go straight to the goal
        nextScrollTop = scrollTopGoal
      }

      if (currentScrollTop === scrollTopGoal || scrollTopGoal > ableToScroll) {
        // we made it or things have changed and we can't get to the goal, time to bail
        clearInterval(this._interval)
        return
      }

      this.container.scrollTop = nextScrollTop
    }, 16)
  },
}
