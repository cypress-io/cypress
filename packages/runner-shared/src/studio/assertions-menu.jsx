import React, { useState } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { usePopper } from 'react-popper'
import _ from 'lodash'
import cs from 'classnames'

const AssertionType = ({ addAssertion, type, options }) => {
  const [isOpen, setOpen] = useState(false)
  const [referenceElement, setReferenceElement] = useState(null)
  const [popperElement, setPopperElement] = useState(null)

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'right-start',
  })

  const _open = (e) => {
    setOpen(true)
  }

  const _close = (e) => {
    // don't close menu if mouse out to sub menu
    if (popperElement && popperElement.contains(e.relatedTarget)) {
      return
    }

    setOpen(false)
  }

  const hasOptions = options && !!options.length

  return (
    <div
      ref={setReferenceElement}
      className={cs('assertion-type', { 'single-assertion': !hasOptions })}
      onClick={!hasOptions ? () => addAssertion(type) : null}
      // onMouseEnter and onMouseLeave events do not work properly inside shadow dom
      onMouseOver={_open}
      onMouseOut={_close}
    >
      {type}
      {hasOptions && isOpen && (
        <div ref={setPopperElement} className='assertion-options' style={styles.popper} {...attributes.popper}>
          {options.map(({ name, value }) => (
            <div
              key={`${name}${value}`}
              className='assertion-option'
              onClick={() => addAssertion(type, name, value)}
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
}

const AssertionsMenu = ({ $el, possibleAssertions, addAssertion, closeMenu, selectorHighlightStyles }) => {
  const [referenceElement, setReferenceElement] = useState(null)
  const [popperElement, setPopperElement] = useState(null)

  const { styles, attributes } = usePopper(referenceElement, popperElement)

  function _addAssertion (...args) {
    args = _.compact(args)

    addAssertion($el, ...args)
  }

  function _close (event) {
    event.preventDefault()

    closeMenu()
  }

  return (
    <>
      <div ref={setReferenceElement} className='highlight' style={selectorHighlightStyles} />
      <div ref={setPopperElement} className='assertions-menu' style={styles.popper} {...attributes.popper}>
        <a className='close' onClick={_close}>&times;</a>
        <div className='title'>
          Add Assertion
        </div>
        <div className='assertions-list'>
          {possibleAssertions.map((assertion) => (
            <AssertionType key={assertion.type} addAssertion={_addAssertion} {...assertion} />
          ))}
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
