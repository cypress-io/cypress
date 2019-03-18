import React from 'react'
import { shallow } from 'enzyme'

import RunnablesError from './runnables-error'

describe('<RunnablesError />', () => {
  let error

  beforeEach(() => {
    error = {
      title: 'Error title',
      link: 'error://link',
      callout: '/some/path/maybe.js',
      message: '# Message with markdown',
    }
  })

  it('renders the title', () => {
    const component = shallow(<RunnablesError error={error} />)

    expect(component.text()).to.include(error.title)
  })

  it('renders the link if there is one', () => {
    const component = shallow(<RunnablesError error={error} />)

    expect(component.find('a').prop('href')).to.equal(error.link)
  })

  it('does not render link if there is not one', () => {
    error.link = null
    const component = shallow(<RunnablesError error={error} />)

    expect(component.find('a')).to.be.empty
  })

  it('renders callout in pre if there is one', () => {
    const component = shallow(<RunnablesError error={error} />)

    expect(component.find('pre').text()).to.equal(error.callout)
  })

  it('does not callout if there is not one', () => {
    error.callout = null
    const component = shallow(<RunnablesError error={error} />)

    expect(component.find('pre')).to.be.empty
  })

  it('renders message with markdown', () => {
    const component = shallow(<RunnablesError error={error} />)

    expect(component.find('.error-message').prop('dangerouslySetInnerHTML').__html).to.include('<h1>Message with markdown</h1>')
  })
})
