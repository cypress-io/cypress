import React from 'react'
import { mount } from 'cypress-react-unit-test'

const MyInput = ({ inputVal, onInputChanged }) => {
  console.log('MyInput "%s"', inputVal)
  return (
    <>
      <input
        type="text"
        value={inputVal}
        onChange={e => onInputChanged(e.target.value)}
      />
      <p>You entered {inputVal} </p>
    </>
  )
}

describe('My Input', () => {
  it('updates when props change', () => {
    // can we shorten this example
    // that checks if the MyInput is re-rendering?
    const App = () => {
      const [message, setMessage] = React.useState('')
      return (
        <>
          <MyInput
            inputVal={message}
            onInputChanged={newValue => {
              setMessage(newValue)
              return null
            }}
          />
        </>
      )
    }
    mount(<App />)

    /* Update props */
    cy.get('input').type('hello there!')
    cy.contains('You entered hello there!')
  })
})
