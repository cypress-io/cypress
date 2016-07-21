import React from 'react'
import { shallow } from 'enzyme'

import Runnables, { NoTests, RunnablesList } from './runnables'

describe('<Runnables />', () => {
  it('renders <RunnablesList /> when there are runnables', () => {
    const runnablesStore = { isReady: true, runnables: [{ id: 1 }] }
    const component = shallow(<Runnables runnablesStore={runnablesStore} specPath='' />)
    expect(component.find(RunnablesList)).to.exist
  })

  it('renders <NoTests /> when there are no runnables', () => {
    const runnablesStore = { isReady: true, runnables: [] }
    const component = shallow(<Runnables runnablesStore={runnablesStore} specPath='' />)
    expect(component.find(NoTests)).to.exist
  })

  it('renders nothing when not ready', () => {
    const runnablesStore = { isReady: false, runnables: [] }
    const component = shallow(<Runnables runnablesStore={runnablesStore} specPath='' />)
    expect(component.find('.wrap')).to.be.empty
  })

  context('<RunnablesList />', () => {
    it('renders a runnable for each runnable in model', () => {
      const component = shallow(<RunnablesList runnables={[{ id: 1 }, { id: 2 }]} />)
      expect(component.find('Runnable').length).to.equal(2)
    })
  })

  context('<NoTests />', () => {
    it('includes specPath with spaces between /s', () => {
      const component = shallow(<NoTests specPath='/Users/eliza/app/foo_spec.js' />)
      expect(component.find('pre')).to.have.text(' / Users / eliza / app / foo_spec.js')
    })
  })
})
