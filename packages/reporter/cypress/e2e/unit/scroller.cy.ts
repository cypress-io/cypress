import sinon, { SinonSpy, SinonFakeTimers } from 'sinon'

import scroller from '../../../src/lib/scroller'

const { _ } = Cypress

interface ContainerProps {
  clientHeight?: number
  scrollHeight?: number
  scrollTop?: number
  addEventListener?: SinonSpy
  removeEventListener?: SinonSpy
}

type TestContainer = Omit<Element, 'addEventListener' | 'removeEventListener'> & {
  addEventListener: SinonSpy
  removeEventListener: SinonSpy
}

const getContainer = (props?: ContainerProps): TestContainer => {
  const scrollListeners: Array<(ev: Event) => void> = []

  const addEventListener = sinon.spy((type: string, listener: (ev: Event) => void) => {
    if (type === 'scroll') {
      scrollListeners.push(listener)
    }
  })

  const removeEventListener = sinon.spy((type: string, listener: (ev: Event) => void) => {
    if (type === 'scroll') {
      const idx = scrollListeners.lastIndexOf(listener)

      if (idx !== -1) {
        scrollListeners.splice(idx, 1)
      }
    }
  })

  return _.extend<TestContainer>({
    clientHeight: 400,
    scrollHeight: 900,
    scrollTop: 0,
    addEventListener,
    removeEventListener,
  }, props)
}

interface ElementProps {
  clientHeight?: number
  offsetTop?: number
}

const getElement = (props?: ElementProps): HTMLElement => {
  return _.extend<HTMLElement>({
    clientHeight: 20,
    offsetTop: 150,
  }, props)
}

/** Fire the scroll handler that is currently registered (last `addEventListener('scroll', …)`). */
const fireContainerScroll = (container: TestContainer) => {
  expect(container.addEventListener).to.have.been.calledWith('scroll')
  const listener = container.addEventListener.lastCall.args[1] as () => void

  listener()
}

describe('scroller', () => {
  let clock: SinonFakeTimers

  beforeEach(() => {
    clock = sinon.useFakeTimers()
  })

  beforeEach(() => {
    scroller.__reset()
  })

  it('throws an error if attempting to scroll an element before setting a container', () => {
    expect(() => {
      return scroller.scrollIntoView({} as HTMLElement)
    }).to.throw().and.satisfy((err: Error) => {
      expect(err.message).to.match(/container must be set/)

      return true
    })
  })

  it('does not scroll if near top and scrolling would result in negative scroll', () => {
    const container = getContainer()

    scroller.setContainer(container)
    scroller.scrollIntoView(getElement({ offsetTop: 0 }))
    expect(container.scrollTop).to.equal(0)
  })

  it('does not scroll if already full visible', () => {
    const container = getContainer()

    scroller.setContainer(container)
    scroller.scrollIntoView(getElement({ offsetTop: 80 }))
    expect(container.scrollTop).to.equal(0)
  })

  it('scrolls to the goal', () => {
    const container = getContainer({ scrollTop: 50 })

    scroller.setContainer(container)
    scroller.scrollIntoView(getElement({ offsetTop: 600 }))
    expect(container.scrollTop).to.equal(320)
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

    it('does not stack scroll listeners when setContainer is called repeatedly', () => {
      const container = getContainer()
      const onUserScroll = sinon.spy()

      scroller.setContainer(container, onUserScroll)
      scroller.setContainer(container, onUserScroll)

      expect(container.removeEventListener).to.have.been.called
      expect(container.removeEventListener.firstCall.args[0]).to.equal('scroll')

      fireContainerScroll(container)
      clock.tick(15)
      fireContainerScroll(container)
      clock.tick(15)
      fireContainerScroll(container)
      expect(onUserScroll).to.have.been.calledOnce
    })

    it('calls onUserScroll callback if 3 or more user scroll events are detected within 50ms', () => {
      const container = getContainer()
      const onUserScroll = sinon.spy()

      scroller.setContainer(container, onUserScroll)
      fireContainerScroll(container)
      clock.tick(15)
      fireContainerScroll(container)
      clock.tick(15)
      fireContainerScroll(container)
      expect(onUserScroll).to.have.been.called
    })

    it('does nothing if 50ms passes before 3 user scroll events', () => {
      const container = getContainer()
      const onUserScroll = sinon.spy()

      scroller.setContainer(container, onUserScroll)
      fireContainerScroll(container)
      fireContainerScroll(container)
      clock.tick(50)
      fireContainerScroll(container)
      expect(onUserScroll).not.to.have.been.called
    })

    it('does nothing for programmatic scroll events', () => {
      const container = getContainer()
      const onUserScroll = sinon.spy()

      scroller.setContainer(container, onUserScroll)
      scroller.scrollIntoView(getElement({ offsetTop: 600 }))
      scroller.scrollIntoView(getElement({ offsetTop: 600 }))
      clock.tick(16)
      fireContainerScroll(container)
      clock.tick(16)
      fireContainerScroll(container)
      clock.tick(16)
      fireContainerScroll(container)
      clock.tick(16)
      fireContainerScroll(container)
      expect(onUserScroll).not.to.have.been.called
    })
  })
})
