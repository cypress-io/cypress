import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'

import Stats from './stats'
import { StatsStore } from './stats-store'

const statsStub = (props?: Partial<StatsStore>) => {
  return _.extend<StatsStore>({
    numPassed: 0,
    numFailed: 0,
    numPending: 0,
    duration: 0,
  }, props)
}

describe('<Stats />', () => {
  context('passed', () => {
    it('renders -- when zero', () => {
      const component = shallow(<Stats stats={statsStub()} />)

      expect(component.find('.passed .num')).to.have.text('--')
    })

    it('renders number when non-zero', () => {
      const component = shallow(<Stats stats={statsStub({ numPassed: 5 })} />)

      expect(component.find('.passed .num')).to.have.text('5')
    })
  })

  context('failed', () => {
    it('renders -- when zero', () => {
      const component = shallow(<Stats stats={statsStub()} />)

      expect(component.find('.failed .num')).to.have.text('--')
    })

    it('renders number when non-zero', () => {
      const component = shallow(<Stats stats={statsStub({ numFailed: 7 })} />)

      expect(component.find('.failed .num')).to.have.text('7')
    })
  })

  context('pending', () => {
    it('renders -- when zero', () => {
      const component = shallow(<Stats stats={statsStub()} />)

      expect(component.find('.pending .num')).to.have.text('--')
    })

    it('renders number when non-zero', () => {
      const component = shallow(<Stats stats={statsStub({ numPending: 3 })} />)

      expect(component.find('.pending .num')).to.have.text('3')
    })
  })

  context('duration', () => {
    it('renders -- when zero', () => {
      const component = shallow(<Stats stats={statsStub()} />)

      expect(component.find('.duration .num')).to.have.text('--')
    })

    it('renders number when non-zero, converted from milliseconds to seconds and fixed to 2 decimal places', () => {
      const component = shallow(<Stats stats={statsStub({ duration: 10562.452323523 })} />)

      expect(component.find('.duration .num')).to.have.text('10.56')
    })
  })
})
