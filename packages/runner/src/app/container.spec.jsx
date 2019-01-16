import React from 'react'
import { mount, shallow } from 'enzyme'
import sinon from 'sinon'

import App from './app'
import automation from '../lib/automation'
import AutomationDisconnected from '../errors/automation-disconnected'
import NoAutomation from '../errors/no-automation'
import NoSpec from '../errors/no-spec'
import State from '../lib/state'

import Container, { automationElementId } from './container'

const createProps = () => ({
  config: {
    browsers: [],
    integrationFolder: '',
    numTestsKeptInMemory: 1,
    projectName: '',
    viewportHeight: 0,
    viewportWidth: 0,
  },
  eventManager: {
    addGlobalListeners: sinon.spy(),
    launchBrowser: sinon.spy(),
    notifyRunningSpec: () => {},
    reporterBus: {
      emit: () => {},
      on: () => {},
    },
  },
  state: new State(),
  util: {
    hasSpecFile: sinon.stub(),
  },
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
      component = shallow(<Container {...props} />)
    })

    it('renders the automation element alone', () => {
      expect(component.find(`#${automationElementId}`)).to.exist
      expect(component.find(`#${automationElementId}`).parent()).not.to.exist
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
      props.util.hasSpecFile.returns(false)
      component = shallow(<Container {...props} />)
    })

    it('renders <NoSpec /> with config', () => {
      expect(component.find(NoSpec)).to.have.prop('config', props.config)
    })

    it('renders the automation element', () => {
      expect(component.find(`#${automationElementId}`)).to.exist
    })

    it('renders the app when hash changes with and has a spec file', () => {
      props.util.hasSpecFile.returns(true)
      component.find(NoSpec).prop('onHashChange')()
      component.update()
      expect(component.find(App)).to.exist
    })
  })

  describe('when automation is connected and there is a spec file', () => {
    let props
    let component

    beforeEach(() => {
      props = createProps()
      props.state.automation = automation.CONNECTED
      props.util.hasSpecFile.returns(true)
      component = shallow(<Container {...props} />)
    })

    it('renders <App />', () => {
      expect(component.find(App)).to.exist
    })

    it('renders the automation element', () => {
      expect(component.find(`#${automationElementId}`)).to.exist
    })
  })
})
