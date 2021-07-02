import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { stringify } from '@packages/driver/src/dom/elements'

const AssertionsMenu = ({ style, $el, possibleAssertions, addAssertion, closeMenu }) => {
  const _addAssertion = (...args) => {
    addAssertion($el, ...args)
  }

  const _close = (event) => {
    event.preventDefault()

    closeMenu()
  }

  return (
    <div className='assertions-menu' style={style}>
      <a className='close' onClick={_close}>&times;</a>
      <div className='title'>
        Add Assertion
      </div>
      <pre className='element'>
        {stringify($el, 'short')}
      </pre>
      <div className='assertions-list'>
        {possibleAssertions.map(({ type, options }) => {
          return (
            <div key={type} className='assertion'>
              {type}
              <div className='assertion-options'>
                {options.map(({ name, value }) => (
                  <div key={`${name}${value}`} className='assertion-option'>
                    {name && (
                      <span className='assertion-option-name'>
                        {name}
                        :
                        {' '}
                      </span>
                    )}
                    <span className='assertion-option-value'>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const renderAssertionsMenu = (container, props) => {
  render(<AssertionsMenu {...props} />, container)
}

export const studioAssertionsMenu = {
  render: renderAssertionsMenu,
  unmount: unmountComponentAtNode,
}
