import React, { useState } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { usePopper } from 'react-popper'
import { stringify } from '@packages/driver/src/dom/elements'

const AssertionsMenu = ({ $el, possibleAssertions, addAssertion, closeMenu }) => {
  const [popperElement, setPopperElement] = useState(null)

  const { styles, attributes } = usePopper($el[0], popperElement)

  const _addAssertion = ({ type, name, value }) => {
    if (name) {
      addAssertion($el, type, name, value)

      return
    }

    addAssertion($el, type, value)
  }

  const _close = (event) => {
    event.preventDefault()

    closeMenu()
  }

  return (
    <div ref={setPopperElement} className='assertions-menu' style={styles.popper} {...attributes.popper}>
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
                  <div
                    key={`${name}${value}`}
                    className='assertion-option'
                    onClick={() => _addAssertion({ type, name, value })}
                  >
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
