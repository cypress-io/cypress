import _ from 'lodash'
import React from 'react'
import { mount, shallow } from 'enzyme'
import sinon from 'sinon'

import Tooltip from '@cypress/react-tooltip'

import eventManager from '../lib/event-manager'
import SelectorPlayground from './selector-playground'

const createModel = (props) => _.extend({
  method: 'get',
  methods: ['get', 'contains'],
  selector: '.foo',
  infoHelp: '',
  numElements: 1,
  isValid: true,
  setMethod: sinon.spy(),
  setSelector: sinon.spy(),
  setShowingHighlight: sinon.spy(),
}, props)

describe('<SelectorPlayground />', () => {
  it('renders with method class', () => {
    const component = shallow(<SelectorPlayground model={createModel()} />)

    expect(component).to.have.className('method-get')
  })

  it('renders with invalid-selector class when selector is invalid', () => {
    const component = shallow(<SelectorPlayground model={createModel({ isValid: false })} />)

    expect(component).to.have.className('invalid-selector')
  })

  it('renders without invalid-selector class when selector is valid', () => {
    const component = shallow(<SelectorPlayground model={createModel()} />)

    expect(component).not.to.have.className('invalid-selector')
  })

  it('shows highlight when mousing over selector', () => {
    const model = createModel()
    const component = shallow(<SelectorPlayground model={model} />)

    component.find('.wrap').simulate('mouseover')
    expect(model.setShowingHighlight).to.be.calledWith(true)
  })

  it('updates selector and shows highlight when input changes', () => {
    const model = createModel()
    const component = shallow(<SelectorPlayground model={model} />)

    component.find('.selector-input input').simulate('change', { target: { value: '.qux' } })
    expect(model.setSelector).to.be.calledWith('.qux')
    expect(model.setShowingHighlight).to.be.calledWith(true)
  })

  it('sets the input value as the selector', () => {
    const model = createModel()

    model.selector = '.bar'
    const component = shallow(<SelectorPlayground model={model} />)

    expect(component.find('.selector-input input')).to.have.prop('value', '.bar')
  })

  it('shows number of elements if selector is valid', () => {
    const component = shallow(<SelectorPlayground model={createModel()} />)

    expect(component.find('.info')).to.have.text('1')
  })

  it('shows warning icon if selector is invalid', () => {
    const component = shallow(<SelectorPlayground model={createModel({ isValid: false })} />)

    expect(component.find('.info > i')).to.exist
  })

  describe('method picker', () => {
    it('opens when clicking method', () => {
      const component = mount(<SelectorPlayground model={createModel()} />)

      component.find('.method button').simulate('click')
      expect(component.find('.method')).to.have.className('is-showing')
    })

    it('lists method except for chosen one', () => {
      const model = createModel()

      model.methods.push('foo', 'bar')
      const component = shallow(<SelectorPlayground model={model} />)

      expect(component.find('.method-picker > div')).to.have.length(3)
      expect(component.find('.method-picker > div').at(0)).to.have.text('cy.contains')
      expect(component.find('.method-picker > div').at(1)).to.have.text('cy.foo')
      expect(component.find('.method-picker > div').at(2)).to.have.text('cy.bar')
    })

    it('sets method when selected', () => {
      const model = createModel()
      const component = mount(<SelectorPlayground model={model} />)

      component.find('.method button').simulate('click')
      component.find('.method-picker > div').first().simulate('click')
      expect(model.setMethod).to.be.calledWith('contains')
    })

    it('closes method picker when clicking outside it', () => {
      sinon.stub(document.body, 'addEventListener')
      const component = mount(<SelectorPlayground model={createModel()} />)

      document.body.addEventListener.lastCall.args[1]()
      expect(component.find('.method')).not.to.have.className('is-showing')
    })
  })

  describe('copy to clipboard', () => {
    let model

    beforeEach(() => {
      document.execCommand = sinon.stub().returns(true)
      model = createModel()
      model.getSelector = '.bar'
    })

    it('renders tooltip', () => {
      const component = shallow(<SelectorPlayground model={model} />)

      expect(component.find(Tooltip).at(2)).to.have.prop('title', 'Copy to clipboard')
    })

    it('copies to clipboard when clicked', () => {
      const component = mount(<SelectorPlayground model={model} />)

      component.find('.copy-to-clipboard').simulate('click')
      expect(document.execCommand).to.be.calledWith('copy')
    })

    it('sets tooltip text to "Copied!" when successful', () => {
      const component = mount(<SelectorPlayground model={model} />)

      component.find('.copy-to-clipboard').simulate('click')
      expect(component.find(Tooltip).at(2)).to.have.prop('title', 'Copied!')
    })

    it('sets tooltip text to "Oops, unable to copy" when it fails', () => {
      document.execCommand.returns(false)
      const component = mount(<SelectorPlayground model={model} />)

      component.find('.copy-to-clipboard').simulate('click')
      expect(component.find(Tooltip).at(2)).to.have.prop('title', 'Oops, unable to copy')
    })

    it('sets tooltip text to "Oops, unable to copy" when it throws an error', () => {
      document.execCommand.throws()
      const component = mount(<SelectorPlayground model={model} />)

      component.find('.copy-to-clipboard').simulate('click')
      expect(component.find(Tooltip).at(2)).to.have.prop('title', 'Oops, unable to copy')
    })

    it('resets tooltip text when mousing out of button', () => {
      const component = mount(<SelectorPlayground model={model} />)
      const randomEl = document.createElement('div')

      component.find('.copy-to-clipboard').simulate('click')
      component.find('.copy-to-clipboard').simulate('mouseout', { relatedTarget: randomEl })
      expect(component.find(Tooltip).at(2)).to.have.prop('title', 'Copy to clipboard')
    })
  })

  describe('print to console', () => {
    let model

    beforeEach(() => {
      model = createModel()
    })

    it('renders tooltip', () => {
      const component = shallow(<SelectorPlayground model={model} />)

      expect(component.find(Tooltip).at(3)).to.have.prop('title', 'Print to console')
    })

    it('prints to console when clicked', () => {
      sinon.stub(eventManager, 'emit')
      const component = mount(<SelectorPlayground model={model} />)

      component.find('.print-to-console').simulate('click')
      expect(eventManager.emit).to.be.calledWith('print:selector:elements:to:console')
    })

    it('sets tooltip text to "Printed!" when successful', () => {
      const component = mount(<SelectorPlayground model={model} />)

      component.find('.print-to-console').simulate('click')
      expect(component.find(Tooltip).at(3)).to.have.prop('title', 'Printed!')
    })

    it('resets tooltip text when mousing out of button', () => {
      const component = mount(<SelectorPlayground model={model} />)
      const randomEl = document.createElement('div')

      component.find('.print-to-console').simulate('click')
      component.find('.print-to-console').simulate('mouseout', { relatedTarget: randomEl })
      expect(component.find(Tooltip).at(3)).to.have.prop('title', 'Print to console')
    })
  })
})
