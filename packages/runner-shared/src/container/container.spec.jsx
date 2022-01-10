import React from 'react'
import { mount, shallow } from 'enzyme'
import sinon from 'sinon'

import App from '@packages/runner/src/app/app'
import { AutomationDisconnected } from '../automation-disconnected'
import { automation } from '../automation'
import { NoAutomation } from '../no-automation'
import NoSpec from '@packages/runner/src/errors/no-spec'

import { Container } from '.'

const automationElementId = '__cypress-string'

const createProps = () => ({
  runner: 'e2e',
  hasSpecFile: sinon.stub(),
  config: {
    namespace: '__cypress',
    browsers: [],
    integrationFolder: '',
    numTestsKeptInMemory: 1,
    projectName: '',
    viewportHeight: 0,
    viewportWidth: 0,
    spec: {
      name: 'test/spec.js',
      relative: './this/is/a/test/spec.js',
      absolute: '/Users/me/code/this/is/a/test/spec.js',
    },
    state: {
      autoScrollingEnabled: true,
      reporterWidth: 300,
    },
  },
  eventManager: {
    addGlobalListeners: sinon.spy(),
    launchBrowser: sinon.spy(),
    notifyRunningSpec: () => {},
    reporterBus: {
      emit: () => {},
      on: () => {},
    },
    on: () => {},
    start: () => {},
    setup: () => {},
  },
  state: {
    automation: undefined,
    defaults: {
      width: 500,
      height: 500,
    },
  },
  App,
  NoSpec,
})

describe('<Container />', () => {
  it('initializes the event manager when mounted', () => {
    const props = createProps()

    mount(<Container {...props} />)
    expect(props.eventManager.addGlobalListeners).to.have.been.called
    expect(props.eventManager.addGlobalListeners.firstCall.args[0]).to.equal(props.state)
    expect(props.eventManager.addGlobalListeners.firstCall.args[1].element).to.equal(automationElementId)
    expect(props.eventManager.addGlobalListeners.firstCall.args[1].string).to.be.a('string')
  })

  describe('when automation is connecting', () => {
    let component

    beforeEach(() => {
      const props = createProps()

      props.state.automation = automation.CONNECTING
      component = mount(<Container {...props} />)
    })

    it('renders the automation element alone', () => {
      expect(component.find(`#${automationElementId}`)).to.exist
    })
  })

  describe('when automation is missing', () => {
    let props
    let component

    beforeEach(() => {
      props = createProps()
      props.state.automation = automation.MISSING
      component = shallow(<Container {...props} />)
    })

    it('renders <NoAutomation /> with browsers', () => {
      expect(component.find(NoAutomation)).to.have.prop('browsers', props.config.browsers)
    })

    it('does not render the automation element', () => {
      expect(component.find(`#${automationElementId}`)).not.to.exist
    })

    it('launches the browser when onLaunchBrowser prop is called', () => {
      component.find(NoAutomation).prop('onLaunchBrowser')('chrome')
      expect(props.eventManager.launchBrowser).to.have.been.calledWith('chrome')
    })
  })

  describe('when automation is disconnected', () => {
    let props
    let component

    beforeEach(() => {
      props = createProps()
      props.state.automation = automation.DISCONNECTED
      component = shallow(<Container {...props} />)
    })

    it('renders <AutomationDisconnected />', () => {
      expect(component.find(AutomationDisconnected)).to.exist
    })

    it('does not render the automation element', () => {
      expect(component.find(`#${automationElementId}`)).not.to.exist
    })

    it('launches the browser when onReload prop is called', () => {
      component.find(AutomationDisconnected).prop('onReload')('chrome')
      expect(props.eventManager.launchBrowser).to.have.been.calledWith('chrome')
    })
  })

  describe('when automation is connected, but there is no spec file', () => {
    let props
    let component

    beforeEach(() => {
      props = createProps()
      props.state.automation = automation.CONNECTED
      props.hasSpecFile.returns(false)
      component = shallow(<Container {...props} />)
    })

    it('renders <NoSpec /> with config', () => {
      expect(component.find(NoSpec)).to.have.prop('config', props.config)
    })

    it('renders the app when hash changes with and has a spec file', () => {
      props.hasSpecFile.returns(true)
      component.find(NoSpec).prop('onHashChange')()
      component.update()
      expect(component.find(App)).to.exist
    })
  })
})
