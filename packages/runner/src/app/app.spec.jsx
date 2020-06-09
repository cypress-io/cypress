import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import driver from '@packages/driver'

import * as reporter from '@packages/reporter'
import Message from '../message/message'
import State from '../lib/state'

const Reporter = reporter.Reporter = () => <div />

import App from './app'

const createProps = () => ({
  config: {
    browsers: [],
    integrationFolder: '',
    numTestsKeptInMemory: 1,
    projectName: '',
    viewportHeight: 800,
    viewportWidth: 500,
    state: {},
    spec: {
      name: 'foo.js',
      relative: 'relative/path/to/foo.js',
      absolute: '/absolute/path/to/foo.js',
    },
  },
  eventManager: {
    notifyRunningSpec: sinon.spy(),
    saveState: sinon.spy(),
    reporterBus: {
      emit: sinon.spy(),
      on: sinon.spy(),
    },
  },
  state: new State(),
})

const shallowRender = (component) => {
  return shallow(component, { disableLifecycleMethods: true })
}

describe('<App />', () => {
  beforeEach(() => {
    driver.$.returns({
      outerHeight () {
        return 10
      },
    })
  })

  it('renders the reporter wrap with the reporter width', () => {
    const props = createProps()

    props.state.reporterWidth = 600
    const component = shallowRender(<App {...props} />)

    expect(component.find('.reporter-wrap').prop('style').width).to.equal(600)
  })

  it('renders the <Reporter /> with the reporter bus', () => {
    const props = createProps()
    const component = shallowRender(<App {...props} />)

    expect(component.find(Reporter)).to.have.prop('runner', props.eventManager.reporterBus)
  })

  it('renders the <Reporter /> with the spec path', () => {
    const props = createProps()

    props.config.integrationFolder = 'path/to/int'
    const component = shallowRender(<App {...props} />)

    expect(component.find(Reporter)).to.have.prop('spec').deep.eq(props.config.spec)
  })

  it('renders the <Reporter /> with the autoScrollingEnabled flag', () => {
    const props = createProps()

    props.config.state.autoScrollingEnabled = true
    const component = shallowRender(<App {...props} />)

    expect(component.find(Reporter)).to.have.prop('autoScrollingEnabled', true)
  })

  it('renders the <Reporter /> with the firefoxGcInterval flag', () => {
    const props = createProps()

    props.config.firefoxGcInterval = 111
    const component = shallowRender(<App {...props} />)

    expect(component.find(Reporter)).to.have.prop('firefoxGcInterval', 111)
  })

  it('renders the runner container with `left` set as the width of the reporter', () => {
    const props = createProps()

    props.state.absoluteReporterWidth = 400
    const component = shallowRender(<App {...props} />)

    expect(component.find('.runner').prop('style').left).to.equal(400)
  })

  it('renders the <Header />', () => {
    const component = shallowRender(<App {...createProps()} />)

    expect(component.find('Header')).to.exist
  })

  it('renders the <Iframes />', () => {
    const component = shallowRender(<App {...createProps()} />)

    expect(component.find('Iframes')).to.exist
  })

  it('renders the <Message />', () => {
    const component = shallowRender(<App {...createProps()} />)

    expect(component.find(Message)).to.exist
  })

  it('renders children', () => {
    const component = shallowRender(
      <App {...createProps()}>
        <div className='some-child' />
      </App>,
    )

    expect(component.find('.some-child')).to.exist
  })

  it('renders the <Resizer /> with the state', () => {
    const props = createProps()
    const component = shallowRender(<App {...props} />)

    expect(component.find('Resizer')).to.have.prop('state', props.state)
  })

  describe('resizing reporter', () => {
    it('renders without is-reporter-resizing class by default', () => {
      const component = shallowRender(<App {...createProps()} />)

      expect(component).not.to.have.className('is-reporter-resizing')
    })

    it('renders without is-reporter-sized class when there is no explicitly-set reporter width', () => {
      const component = shallowRender(<App {...createProps()} />)

      expect(component).not.to.have.className('is-reporter-sized')
    })

    it('renders with is-reporter-sized class when there is an explicitly-set reporter width', () => {
      const props = createProps()

      props.state.reporterWidth = 600
      const component = shallowRender(<App {...props} />)

      expect(component).to.have.className('is-reporter-sized')
    })

    it('renders with is-reporter-resizing class when resizing reporter', () => {
      const component = shallowRender(<App {...createProps()} />)

      component.find('Resizer').prop('onResizeStart')()
      component.update()
      expect(component).to.have.className('is-reporter-resizing')
    })

    it('sets the reporter width as reporter is resized', () => {
      const props = createProps()
      const component = shallowRender(<App {...props} />)

      component.find('Resizer').prop('onResize')(450)
      expect(props.state.reporterWidth).to.equal(450)
    })

    it('sets the absolute reporter width as reporter is resized', () => {
      const props = createProps()
      const component = shallowRender(<App {...props} />)

      component.find('Resizer').prop('onResize')(520)
      expect(props.state.absoluteReporterWidth).to.equal(520)
    })

    it('removes is-reporter-resizing when resizing ends', () => {
      const component = shallowRender(<App {...createProps()} />)

      component.find('Resizer').prop('onResizeStart')()
      component.update()
      component.find('Resizer').prop('onResizeEnd')()
      component.update()
      expect(component).not.to.have.className('is-reporter-resizing')
    })

    it('saves the reporter width when resizing ends', () => {
      const props = createProps()
      const component = shallowRender(<App {...props} />)

      component.find('Resizer').prop('onResize')(300)
      component.find('Resizer').prop('onResizeEnd')()
      expect(props.eventManager.saveState).to.have.been.calledWith({ reporterWidth: 300 })
    })
  })
})
