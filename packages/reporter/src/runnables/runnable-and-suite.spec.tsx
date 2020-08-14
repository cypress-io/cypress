import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'
import sinon, { SinonSpy } from 'sinon'

import Runnable, { Suite } from './runnable-and-suite'
import Test from '../test/test'
import SuiteModel from './suite-model'

const model = (props?: Partial<SuiteModel>) => {
  return _.extend<SuiteModel>({
    state: 'passed',
    type: 'suite',
    shouldRender: true,
    title: 'some title',
  }, props)
}

describe('<Runnable />', () => {
  it('renders with type as a class', () => {
    const component = shallow(<Runnable model={model()} />)

    expect(component).to.have.className('suite')
  })

  it('renders with the state as a class', () => {
    const component = shallow(<Runnable model={model()} />)

    expect(component).to.have.className('runnable-passed')
  })

  it('renders a suite when the type is suite', () => {
    const component = shallow(<Runnable model={model()} />)

    expect(component.find(Suite)).to.exist
  })

  it('renders a test when the type is test', () => {
    const component = shallow(<Runnable model={model({ type: 'test' })} />)

    expect(component.find(Test)).to.exist
  })

  context('hovering', () => {
    let stopPropagation: SinonSpy

    beforeEach(() => {
      stopPropagation = sinon.spy()
    })

    it('renders with hover class on mouse over', () => {
      const component = shallow(<Runnable model={model()} />)

      component.simulate('mouseOver', { stopPropagation })
      expect(component).to.have.className('hover')
    })

    it('stops propagation on mouse over', () => {
      const component = shallow(<Runnable model={model()} />)

      component.simulate('mouseOver', { stopPropagation })
      expect(stopPropagation).to.have.been.called
    })

    it('removes hover class on mouse out', () => {
      const component = shallow(<Runnable model={model()} />)

      component.simulate('mouseOver', { stopPropagation })
      component.simulate('mouseOut', { stopPropagation })
      expect(component).not.to.have.className('hover')
    })

    it('stops propagation on mouse out', () => {
      const component = shallow(<Runnable model={model()} />)

      component.simulate('mouseOut', { stopPropagation })
      expect(stopPropagation).to.have.been.called
    })
  })

  context('<Suite />', () => {
    it('does not render when it should not render', () => {
      const component = shallow(<Suite model={model({ shouldRender: false })} />)

      expect(component).to.be.empty
    })

    it('renders collapsible header with title', () => {
      const header = shallow(shallow(<Suite model={model()} />).find('Collapsible').prop('header'))

      expect(header.find('.runnable-title')).to.have.text('some title')
    })

    it('renders collapsible header with paddingLeft style based on level', () => {
      const component = shallow(<Suite model={model({ level: 2 })} />)

      expect(component.find('Collapsible').prop('headerStyle')).to.eql({ paddingLeft: 35 })
    })

    it('renders collapsible open', () => {
      const component = shallow(<Suite model={model()} />)

      expect(component.find('Collapsible')).to.have.prop('isOpen', true)
    })

    it('renders a runnable for each child', () => {
      const component = shallow(<Suite model={model({ children: [{ id: 1 }, { id: 2 }] } as unknown as SuiteModel)} />)

      expect(component.find(Runnable).length).to.equal(2)
    })
  })
})
