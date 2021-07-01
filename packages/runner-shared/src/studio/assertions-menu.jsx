import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'

const AssertionsMenu = ({ style, $el, possibleAssertions, addAssertion }) => {
  const _addAssertion = (...args) => {
    addAssertion($el, ...args)
  }

  return (
    <div className='assertions-menu' style={style}>
      <div className='title'>Add Assertion</div>
      <ul className='assertions-list'>
        {possibleAssertions.map(({ name, value }) => {
          if (!value) return null

          let valueOut
          const valueIsArray = Array.isArray(value)

          if (valueIsArray) {
            valueOut = value.map((child) => (
              <div key={child.value} style={{ marginLeft: 10 }} onClick={() => child.name ? _addAssertion(name, child.name, child.value) : _addAssertion(name, child.value)}>
                {child.name}
                {' '}
                <strong>
                  {child.value}
                </strong>
              </div>
            ))
          } else {
            valueOut = (
              <strong onClick={() => _addAssertion(name, value)}>
                {value}
              </strong>
            )
          }

          return (
            <li key={name}>
              {name}
              {' '}
              {valueOut}
            </li>
          )
        })}
      </ul>
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
