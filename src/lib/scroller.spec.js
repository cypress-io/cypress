import _ from 'lodash'
import sinon from 'sinon'

import scroller from './scroller'

const getContainer = (props) => {
  return _.extend({
    clientHeight: 100,
    scrollHeight: 200,
    scrollTop: 0,
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

  it('scrolls container 10 pixels towards goal immediately and every 16ms', () => {
    const container = getContainer()
    scroller.setContainer(container)
    scroller.scrollIntoView(getElement(), 1)
    expect(container.scrollTop).to.equal(10)
    clock.tick(16)
    expect(container.scrollTop).to.equal(20)
    clock.tick(16)
    expect(container.scrollTop).to.equal(30)
    clock.tick(16)
    expect(container.scrollTop).to.equal(40)
  })

  it('stops scrolling once it reaches goal', () => {
    const container = getContainer({ scrollTop: 50 })
    scroller.setContainer(container)
    scroller.scrollIntoView(getElement(), 1)
    expect(container.scrollTop).to.equal(60)
    clock.tick(16)
    expect(container.scrollTop).to.equal(70)
    clock.tick(16)
    expect(container.scrollTop).to.equal(70)
  })

  it('stops scrolling and settles on goal if going to overshoot possible max scroll position', () => {
    const container = getContainer({ scrollTop: 55 })
    scroller.setContainer(container)
    scroller.scrollIntoView(getElement(), 1)
    expect(container.scrollTop).to.equal(65)
    container.scrollHeight = 100
    clock.tick(16)
    expect(container.scrollTop).to.equal(65)
    clock.tick(16)
    expect(container.scrollTop).to.equal(65)
  })

  it('stops scrolling and settles on goal if going to overshoot it', () => {
    const container = getContainer({ scrollTop: 55 })
    scroller.setContainer(container)
    scroller.scrollIntoView(getElement(), 1)
    expect(container.scrollTop).to.equal(65)
    clock.tick(16)
    expect(container.scrollTop).to.equal(70)
    clock.tick(16)
    expect(container.scrollTop).to.equal(70)
  })

  it('immediately scrolls to goal if another element needs to scroll into view', () => {
    const container = getContainer()
    scroller.setContainer(container)
    scroller.scrollIntoView(getElement(), 1)
    expect(container.scrollTop).to.equal(10)
    clock.tick(16)
    expect(container.scrollTop).to.equal(20)
    scroller.scrollIntoView(getElement({ offsetTop: 170 }), 2)
    expect(container.scrollTop).to.equal(80)
    clock.tick(16)
    expect(container.scrollTop).to.equal(90)
  })

  it('continues scrolling normally if the same element', () => {
    const container = getContainer()
    scroller.setContainer(container)
    scroller.scrollIntoView(getElement(), 1)
    expect(container.scrollTop).to.equal(10)
    clock.tick(16)
    expect(container.scrollTop).to.equal(20)
    scroller.scrollIntoView(getElement(), 1)
    expect(container.scrollTop).to.equal(30)
    clock.tick(16)
    expect(container.scrollTop).to.equal(40)
  })
})
