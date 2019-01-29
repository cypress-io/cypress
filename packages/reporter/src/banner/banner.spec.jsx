import { shallow } from 'enzyme'
import React from 'react'

import Banner from './banner'

describe('<Banner />', () => {
  let component

  beforeEach(() => {
    component = shallow(<Banner filePath="fake/file/path" />)
  })

  it('contains configuration changed message', () => {
    expect(component.find('p').first()).to.have.text('You need to restart Cypress after updating configuration files.')
    expect(component.find('code')).to.have.text('fake/file/path')
  })

  // TODO add back in once functionality exists
  it.skip('can reload the project', () => {
  })
})
