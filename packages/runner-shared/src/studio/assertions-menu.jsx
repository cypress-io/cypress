import React, { useState } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { usePopper } from 'react-popper'
import _ from 'lodash'
import cs from 'classnames'

const AssertionsMenu = ({ $el, possibleAssertions, addAssertion, closeMenu, selectorHighlightStyles }) => {
  const [popperElement, setPopperElement] = useState(null)

  const { styles, attributes } = usePopper($el[0], popperElement)

  const _addAssertion = (...args) => {
    args = _.compact(args)

    addAssertion($el, ...args)
  }

  const _close = (event) => {
    event.preventDefault()

    closeMenu()
  }

  return (
    <>
      <div className='highlight' style={selectorHighlightStyles} />
      <div ref={setPopperElement} className='assertions-menu' style={styles.popper} {...attributes.popper}>
        <a className='close' onClick={_close}>&times;</a>
        <div className='title'>
          Add Assertion
        </div>
        <div className='assertions-list'>
          {possibleAssertions.map(({ type, options }) => {
            const hasOptions = options && !!options.length

            return (
              <div key={type} className={cs('assertion', { 'single-assertion': !hasOptions })} onClick={!hasOptions ? () => _addAssertion(type) : null}>
                {type}
                {hasOptions && (
                  <div className='assertion-options'>
                    {options.map(({ name, value }) => (
                      <div
                        key={`${name}${value}`}
                        className='assertion-option'
                        onClick={() => _addAssertion(type, name, value)}
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
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

const renderAssertionsMenu = (container, props) => {
  render(<AssertionsMenu {...props} />, container)
}

export const studioAssertionsMenu = {
  render: renderAssertionsMenu,
  unmount: unmountComponentAtNode,
}
