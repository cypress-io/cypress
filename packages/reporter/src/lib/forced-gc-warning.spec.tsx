import _ from 'lodash'
import { shallow, ShallowWrapper } from 'enzyme'
import React from 'react'
import sinon, { SinonStub } from 'sinon'

import ForcedGcWarning, { Props } from './forced-gc-warning'
import { Events } from './events'

const getProps = (props?: Partial<Props>) => {
  return _.extend<Props>({
    events: {
      emit: sinon.stub(),
    } as EventsStub,
  }, props)
}

type EventsStub = Events & {
  emit: SinonStub
}

const testExpandability = (component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>) => {
  expect(component.state('expanded')).to.be.false
  component.find('.gc-status-bar').simulate('click')
  expect(component.state('expanded')).to.be.true
  component.find('.fa-times.clickable').simulate('click')
  expect(component.state('expanded')).to.be.false
}

const testLinks = (component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>, props: Props) => {
  expect(component.state('expanded')).to.be.false
  component.find('.gc-status-bar').simulate('click')
  expect(component.state('expanded')).to.be.true

  component.find('a').forEach((a) => {
    const href = a.prop('href')

    expect(href).to.eq('https://on.cypress.io/firefox-gc-interval')
    a.simulate('click', { currentTarget: { href }, preventDefault: () => {} })

    expect(props.events.emit).to.be.calledWith('external:open', href)
  })
}

describe('<ForcedGcWarning />', () => {
  context('with interval = undefined', () => {
    it('does not render', () => {
      const props = getProps({
        appState: { firefoxGcInterval: undefined, forcingGc: false },
      })

      const component = shallow(<ForcedGcWarning {...props}/>)

      expect(component).to.be.empty
    })
  })

  context('with interval = null or 0', () => {
    const props = getProps({
      appState: { firefoxGcInterval: null, forcingGc: false },
    })

    it('renders the "disabled" expando', () => {
      const renderDisabled = sinon.spy(ForcedGcWarning.prototype, '_renderDisabled')
      const renderForcedGcWarning = sinon.spy(ForcedGcWarning.prototype, '_renderForcedGcWarning')

      shallow(<ForcedGcWarning {...props}/>)

      expect(renderDisabled).to.be.calledOnce
      expect(renderForcedGcWarning).to.not.be.called
    })

    it('expands as expected', () => {
      const component = shallow(<ForcedGcWarning {...props}/>)

      testExpandability(component)
    })

    it('contains clickable links', () => {
      const component = shallow(<ForcedGcWarning {...props}/>)

      testLinks(component, props)
    })
  })

  context('with interval > 0', () => {
    const props = getProps({
      appState: { firefoxGcInterval: 15, forcingGc: false },
    })

    it('renders the "warning" expando', () => {
      const renderDisabled = sinon.spy(ForcedGcWarning.prototype, '_renderDisabled')
      const renderForcedGcWarning = sinon.spy(ForcedGcWarning.prototype, '_renderForcedGcWarning')

      shallow(<ForcedGcWarning {...props}/>)

      expect(renderForcedGcWarning).to.be.calledOnce
      expect(renderDisabled).to.not.be.called
    })

    it('expands as expected', () => {
      const component = shallow(<ForcedGcWarning {...props}/>)

      testExpandability(component)
    })

    it('contains clickable links', () => {
      const component = shallow(<ForcedGcWarning {...props}/>)

      testLinks(component, props)
    })
  })
})
