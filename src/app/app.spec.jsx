import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'

import Message from '../message/message'
import State from '../lib/state'

import App from './app'

const createProps = () => ({
  config: {
    browsers: [],
    env: 'tst',
    integrationFolder: '',
    numTestsKeptInMemory: 1,
    projectName: '',
    viewportHeight: 800,
    viewportWidth: 500,
  },
  runner: {
    notifyRunningSpec: sinon.spy(),
    reporterBus: {
      emit: sinon.spy(),
      on: sinon.spy(),
    },
  },
  state: new State(),
  windowUtil: {
    specFile: sinon.stub().returns('some-spec.js'),
  },
})

describe('<App />', () => {
  it('renders the <Reporter /> with the reporter bus', () => {
    const props = createProps()
    const component = shallow(<App {...props} />)
    expect(component.find('Reporter')).to.have.prop('runner', props.runner.reporterBus)
  })

  it('renders the <Reporter /> with the spec path', () => {
    const props = createProps()
    props.config.integrationFolder = 'path/to/int'
    const component = shallow(<App {...props} />)
    expect(component.find('Reporter')).to.have.prop('specPath', 'path/to/int/some-spec.js')
  })

  it('renders the runner wrap with `left` set as the width of the reporter', () => {
    const props = createProps()
    props.state.reporterWidth = 400
    const component = shallow(<App {...props} />)
    expect(component.find('RunnerWrap').prop('style').left).to.equal(400)
  })

  it('renders the <Header />', () => {
    const component = shallow(<App {...createProps()} />)
    expect(component.find('Header')).to.exist
  })

  it('renders the <Iframes />', () => {
    const component = shallow(<App {...createProps()} />)
    expect(component.find('Iframes')).to.exist
  })

  it('renders the <Message />', () => {
    const component = shallow(<App {...createProps()} />)
    expect(component.find(Message)).to.exist
  })

  it('renders children', () => {
    const component = shallow(
      <App {...createProps()}>
        <div className='some-child' />
      </App>
    )
    expect(component.find('.some-child')).to.exist
  })
})
