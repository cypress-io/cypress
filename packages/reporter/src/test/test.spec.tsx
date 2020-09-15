import React from 'react'
import { shallow, mount, ReactWrapper } from 'enzyme'
import sinon, { SinonSpy } from 'sinon'
import _ from 'lodash'
import Test from './test'
import TestModel, { TestState } from './test-model'
import { Scroller } from '../lib/scroller'
import { AppState } from '../lib/app-state'

const appStateStub = (props?: Partial<AppState>) => {
  return {
    autoScrollingEnabled: true,
    isRunning: true,
    ...props,
  } as AppState
}

const model = (props?: Partial<TestModel>) => {
  return {
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
    callbackAfterUpdate: () => {},
    toggleOpen: sinon.stub(),
    ...props,
  } as any
}

type ScrollerStub = Scroller & {
  scrollIntoView: SinonSpy
}

const scrollerStub = () => ({
  scrollIntoView: sinon.spy(),
} as ScrollerStub)

const setTestState = (test:TestModel, state:TestState) => _.extend(test, { state })

describe('<Test />', () => {
  it('does not render when it should not render', () => {
    const component = shallow(<Test model={model({ shouldRender: false })} />)

    expect(component).to.be.empty
  })

  context('contents', () => {
    it('does not render the contents if not open', () => {
      const component = mount(<Test model={model({ isOpen: false })} />)

      expect(component.find('.runnable-instruments')).to.be.empty
    })

    it('renders the contents if open', () => {
      const component = mount(<Test model={model({ isOpen: true })} />)

      expect(component.find('.runnable-instruments')).not.to.be.empty
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

      it('does not scroll into view if model.state is processing', () => {
        mount(
          <Test
            appState={appStateStub()}
            model={model({ state: 'processing' })}
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
        testModel = model({ state: 'processing' })
        component = mount(<Test appState={appState} model={testModel} scroller={scroller} />)
      })

      it('does not scroll into view if auto-scrolling is disabled', () => {
        appState.isRunning = true
        setTestState(testModel, 'processing')
        component.instance()!.componentDidUpdate!({}, {})
        expect(scroller.scrollIntoView).not.to.have.been.called
      })

      it('does not scroll into view if app is not running', () => {
        appState.autoScrollingEnabled = true
        setTestState(testModel, 'processing')

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
