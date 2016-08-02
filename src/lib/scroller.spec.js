import _ from 'lodash'
import sinon from 'sinon'

import scroller, { SCROLL_RATE } from './scroller'

const getContainer = (props) => {
  return _.extend({
    clientHeight: 100,
    scrollHeight: 200,
    scrollTop: 0,
    addEventListener: sinon.spy(),
  }, props)
}

const getElement = (props) => {
  return _.extend({
    clientHeight: 20,
    offsetTop: 150,
  }, props)
}

describe('scroller', () => {
  let clock

  before(() => {
    clock = sinon.useFakeTimers()
  })

  beforeEach(() => {
    scroller.__reset()
  })

  after(() => {
    clock.restore()
  })

  it('throws an error if attempting to scroll an element before setting a container', () => {
    expect(() => scroller.scrollIntoView({}, 1)).to.throw(/container must be set/)
  })

  it('does not scroll if near top and scrolling would result in negative scroll', () => {
    const container = getContainer()
    scroller.setContainer(container)
    scroller.scrollIntoView(getElement({ offsetTop: 0 }), 1)
    expect(container.scrollTop).to.equal(0)
    clock.tick(16)
    expect(container.scrollTop).to.equal(0)
    clock.tick(16)
    expect(container.scrollTop).to.equal(0)
  })

  it('does not scroll if already full visible', () => {
    const container = getContainer()
    scroller.setContainer(container)
    scroller.scrollIntoView(getElement({ offsetTop: 80 }), 1)
    expect(container.scrollTop).to.equal(0)
    clock.tick(16)
    expect(container.scrollTop).to.equal(0)
    clock.tick(16)
    expect(container.scrollTop).to.equal(0)
  })

  it('scrolls to max scroll position if ', () => {
    const container = getContainer()
    scroller.setContainer(container)
    scroller.scrollIntoView(getElement({ offsetTop: 20 }), 1)
    expect(container.scrollTop).to.equal(0)
    clock.tick(16)
    expect(container.scrollTop).to.equal(0)
    clock.tick(16)
    expect(container.scrollTop).to.equal(0)
  })

  it(`scrolls container ${SCROLL_RATE} pixels towards goal immediately and every 16ms`, () => {
    const container = getContainer()
    scroller.setContainer(container)
    scroller.scrollIntoView(getElement(), 1)
    expect(container.scrollTop).to.equal(SCROLL_RATE)
    clock.tick(16)
    expect(container.scrollTop).to.equal(SCROLL_RATE * 2)
    clock.tick(16)
    expect(container.scrollTop).to.equal(SCROLL_RATE * 3)
    clock.tick(16)
    expect(container.scrollTop).to.equal(SCROLL_RATE * 4)
  })

  it('stops scrolling once it reaches goal', () => {
    const container = getContainer({ scrollTop: 50 })
    scroller.setContainer(container)
    scroller.scrollIntoView(getElement(), 1)
    expect(container.scrollTop).to.equal(50 + SCROLL_RATE)
    clock.tick(16)
    expect(container.scrollTop).to.equal(70)
    clock.tick(16)
    expect(container.scrollTop).to.equal(70)
  })

  it('stops scrolling and settles on goal if going to overshoot possible max scroll position', () => {
    const container = getContainer({ scrollTop: 55 })
    scroller.setContainer(container)
    scroller.scrollIntoView(getElement(), 1)
    expect(container.scrollTop).to.equal(55 + SCROLL_RATE)
    container.scrollHeight = 100
    clock.tick(16)
    expect(container.scrollTop).to.equal(55 + SCROLL_RATE)
    clock.tick(16)
    expect(container.scrollTop).to.equal(55 + SCROLL_RATE)
  })

  it('stops scrolling and settles on goal if going to overshoot it', () => {
    const container = getContainer({ scrollTop: 52 })
    scroller.setContainer(container)
    scroller.scrollIntoView(getElement(), 1)
    expect(container.scrollTop).to.equal(52 + SCROLL_RATE)
    clock.tick(16)
    expect(container.scrollTop).to.equal(70)
    clock.tick(16)
    expect(container.scrollTop).to.equal(70)
  })

  it('immediately scrolls to goal if another element needs to scroll into view', () => {
    const container = getContainer()
    scroller.setContainer(container)
    scroller.scrollIntoView(getElement(), 1)
    expect(container.scrollTop).to.equal(SCROLL_RATE)
    clock.tick(16)
    expect(container.scrollTop).to.equal(SCROLL_RATE * 2)
    scroller.scrollIntoView(getElement({ offsetTop: 170 }), 2)
    expect(container.scrollTop).to.equal(85)
    clock.tick(16)
    expect(container.scrollTop).to.equal(90)
  })

  it('continues scrolling normally if the same element', () => {
    const container = getContainer()
    scroller.setContainer(container)
    scroller.scrollIntoView(getElement(), 1)
    expect(container.scrollTop).to.equal(SCROLL_RATE)
    clock.tick(16)
    expect(container.scrollTop).to.equal(SCROLL_RATE * 2)
    scroller.scrollIntoView(getElement(), 1)
    expect(container.scrollTop).to.equal(SCROLL_RATE * 3)
    clock.tick(16)
    expect(container.scrollTop).to.equal(SCROLL_RATE * 4)
  })

  context('#getScrollTop', () => {
    it('returns the current scrollTop for the container', () => {
      scroller.setContainer(getContainer({ scrollTop: 123 }))
      expect(scroller.getScrollTop()).to.equal(123)
    })

    it('returns 0 if the container is not set', () => {
      expect(scroller.getScrollTop()).to.equal(0)
    })
  })

  context('#setScrollTop', () => {
    it('sets the scrollTop on the container', () => {
      scroller.setContainer(getContainer({ scrollTop: 123 }))
      scroller.setScrollTop(456)
      expect(scroller.getScrollTop()).to.equal(456)
    })

    it('does nothing if container is not set', () => {
      scroller.setScrollTop(456)
      expect(scroller.getScrollTop()).to.equal(0)
    })

    it('does nothing if value is null', () => {
      scroller.setContainer(getContainer({ scrollTop: 123 }))
      scroller.setScrollTop(null)
      expect(scroller.getScrollTop()).to.equal(123)
    })

    it('does nothing if value is undefined', () => {
      scroller.setContainer(getContainer({ scrollTop: 123 }))
      scroller.setScrollTop()
      expect(scroller.getScrollTop()).to.equal(123)
    })
  })

  context('scrolling', () => {
    it('listens to scroll event on container', () => {
      const container = getContainer()
      scroller.setContainer(container)
      expect(container.addEventListener).to.have.been.calledWith('scroll')
    })

    it('calls onUserScroll callback if 3 or more user scroll events are detected within 50ms', () => {
      const container = getContainer()
      const onUserScroll = sinon.spy()
      scroller.setContainer(container, onUserScroll)
      container.addEventListener.callArg(1)
      clock.tick(15)
      container.addEventListener.callArg(1)
      clock.tick(15)
      container.addEventListener.callArg(1)
      expect(onUserScroll).to.have.been.called
    })

    it('does nothing if 50ms passes before 3 user scroll events', () => {
      const container = getContainer()
      const onUserScroll = sinon.spy()
      scroller.setContainer(container, onUserScroll)
      container.addEventListener.callArg(1)
      container.addEventListener.callArg(1)
      clock.tick(50)
      container.addEventListener.callArg(1)
      expect(onUserScroll).not.to.have.been.called
    })

    it('does nothing for programmatic scroll events', () => {
      const container = getContainer()
      const onUserScroll = sinon.spy()
      scroller.setContainer(container, onUserScroll)
      scroller.scrollIntoView(getElement(), 1)
      clock.tick(16)
      container.addEventListener.callArg(1)
      clock.tick(16)
      container.addEventListener.callArg(1)
      clock.tick(16)
      container.addEventListener.callArg(1)
      expect(onUserScroll).not.to.have.been.called
    })
  })
})
