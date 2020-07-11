import _ from 'lodash'
import React from 'react'
import { mount, shallow, ReactWrapper } from 'enzyme'
import sinon, { SinonSpy } from 'sinon'

import Hooks from '../hooks/hooks'

import Test, { NoCommands } from './test'
import TestModel from './test-model'
import { Scroller } from '../lib/scroller'
import { AppState } from '../lib/app-state'

const appStateStub = (props?: Partial<AppState>) => {
  return _.extend<AppState>({
    autoScrollingEnabled: true,
    isRunning: true,
  }, props)
}

const model = (props?: Partial<TestModel>) => {
  return _.extend<TestModel>({
    agents: [],
    commands: [],
    hooks: [],
    err: {},
    id: 't1',
    isActive: true,
    level: 1,
    routes: [],
    shouldRender: true,
    state: 'passed',
    title: 'some title',
    type: 'test',
  }, props)
}

type ScrollerStub = Scroller & {
  scrollIntoView: SinonSpy
}

const scrollerStub = () => ({
  scrollIntoView: sinon.spy(),
} as ScrollerStub)

describe('<Test />', () => {
  it('does not render when it should not render', () => {
    const component = shallow(<Test model={model({ shouldRender: false })} />)

    expect(component).to.be.empty
  })

  context('open/closed', () => {
    it('renders without is-open class by default', () => {
      const component = mount(<Test model={model()} />)

      expect(component.find('.collapsible').first()).not.to.have.className('is-open')
    })

    it('renders with is-open class when the model state is failed', () => {
      const component = mount(<Test model={model({ state: 'failed' })} />)

      expect(component.find('.collapsible').first()).to.have.className('is-open')
    })

    it('renders with is-open class when the model is long running', () => {
      const component = mount(<Test model={model({ isLongRunning: true })} />)

      expect(component.find('.collapsible').first()).to.have.className('is-open')
    })

    it('renders with is-open class when there is only one test', () => {
      const component = mount(<Test model={model({ isLongRunning: true })} />)

      expect(component.find('.collapsible').first()).to.have.className('is-open')
    })

    context('toggling', () => {
      it('renders without is-open class when already open', () => {
        const component = mount(<Test model={model({ state: 'failed' })} />)

        component.find('.collapsible-header').first().simulate('click')
        expect(component.find('.collapsible').first()).not.to.have.className('is-open')
      })

      it('renders with is-open class when not already open', () => {
        const component = mount(<Test model={model()} />)

        component.find('.collapsible-header').first().simulate('click')
        expect(component.find('.collapsible').first()).to.have.className('is-open')
      })

      it('renders without is-open class when toggled again', () => {
        const component = mount(<Test model={model()} />)

        component.find('.collapsible-header').first().simulate('click')
        component.find('.collapsible-header').first().simulate('click')
        expect(component.find('.collapsible').first()).not.to.have.className('is-open')
      })
    })
  })

  context('contents', () => {
    it('does not render the contents if not open', () => {
      const component = mount(<Test model={model()} />)

      expect(component.find('.runnable-instruments')).to.be.empty
    })

    it('renders the contents if open', () => {
      const component = mount(<Test model={model({ state: 'failed' })} />)

      expect(component.find('.runnable-instruments')).not.to.be.empty
    })

    it('renders <Hooks /> if there are commands', () => {
      const component = shallow(<Test model={model({ commands: [{ id: 1, hookId: 'h1' }], hooks: [{ hookId: 'h1' }], state: 'failed' } as TestModel)} />)

      expect(component.find(Hooks)).to.exist
    })

    it('renders <NoCommands /> is no commands', () => {
      const component = shallow(<Test model={model({ state: 'failed' })} />)

      expect(component.find(NoCommands)).to.exist
    })

    it('stops propagation when clicked', () => {
      const component = mount(<Test model={model({ state: 'failed' })} />)
      const e = { stopPropagation: sinon.spy() }

      component.find('.collapsible-header').first().simulate('click', e)
      expect(e.stopPropagation).to.have.been.called
    })
  })

  context('scrolling into view', () => {
    let scroller: Scroller

    beforeEach(() => {
      scroller = scrollerStub()

      // @ts-ignore
      global.window.requestAnimationFrame = function (callback: FrameRequestCallback) {
        // @ts-ignore
        return callback()
      }
    })

    context('on mount', () => {
      it('scrolls into view if auto-scrolling is enabled, app is running, the model should render, and the model.isActive is null', () => {
        const component = mount(
          <Test
            appState={appStateStub()}
            model={model()}
            scroller={scroller}
          />,
        )

        expect(scroller.scrollIntoView).to.have.been.calledWith((component.instance() as any).containerRef.current)
      })

      it('does not scroll into view if auto-scrolling is disabled', () => {
        mount(
          <Test
            appState={appStateStub({ autoScrollingEnabled: false })}
            model={model()}
            scroller={scroller}
          />,
        )

        expect(scroller.scrollIntoView).not.to.have.been.called
      })

      it('does not scroll into view if app is not running', () => {
        mount(
          <Test
            appState={appStateStub({ isRunning: false })}
            model={model()}
            scroller={scroller}
          />,
        )

        expect(scroller.scrollIntoView).not.to.have.been.called
      })

      it('does not scroll into view if model should not render', () => {
        mount(
          <Test
            appState={appStateStub()}
            model={model({ shouldRender: false })}
            scroller={scroller}
          />,
        )

        expect(scroller.scrollIntoView).not.to.have.been.called
      })

      it('does not scroll into view if model.isActive is null', () => {
        mount(
          <Test
            appState={appStateStub()}
            model={model({ isActive: null })}
            scroller={scroller}
          />,
        )

        expect(scroller.scrollIntoView).not.to.have.been.called
      })
    })

    context('on update', () => {
      let appState: AppState
      let testModel: TestModel
      let component: ReactWrapper<Test>

      beforeEach(() => {
        appState = appStateStub({ autoScrollingEnabled: false, isRunning: false })
        testModel = model({ isActive: null })
        component = mount(<Test appState={appState} model={testModel} scroller={scroller} />)
      })

      it('scrolls into view if auto-scrolling is enabled, app is running, the model should render, and the model.isActive is null', () => {
        appState.id = 'fooo'
        appState.autoScrollingEnabled = true
        appState.isRunning = true
        testModel.isActive = true
        testModel.shouldRender = true
        component.instance()!.componentDidUpdate!({}, {})
        expect(scroller.scrollIntoView).to.have.been.calledWith((component.instance() as any).containerRef.current)
      })

      it('does not scroll into view if auto-scrolling is disabled', () => {
        appState.isRunning = true
        testModel.isActive = true
        component.instance()!.componentDidUpdate!({}, {})
        expect(scroller.scrollIntoView).not.to.have.been.called
      })

      it('does not scroll into view if app is not running', () => {
        appState.autoScrollingEnabled = true
        testModel.isActive = true
        component.instance()!.componentDidUpdate!({}, {})
        expect(scroller.scrollIntoView).not.to.have.been.called
      })

      it('does not scroll into view if model.isActive is null', () => {
        appState.autoScrollingEnabled = true
        appState.isRunning = true
        component.instance()!.componentDidUpdate!({}, {})
        expect(scroller.scrollIntoView).not.to.have.been.called
      })
    })
  })
})
