/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'

class Foo extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      count: 0,
    }
  }

  componentDidMount() {
    console.log('componentDidMount called')
  }

  componentDidUpdate() {
    console.log('componentDidUpdate called')
  }

  render() {
    const { id, foo } = this.props
    return (
      <div className={id}>
        {foo} count {this.state.count}
      </div>
    )
  }
}

describe('Enzyme', () => {
  // example test copied from
  // https://github.com/enzymejs/enzyme/blob/master/packages/enzyme-test-suite/test/shared/methods/setProps.jsx

  context('setProps', () => {
    it('gets props from the component', () => {
      mount(<Foo id="foo" foo="initial" />)
      cy.contains('initial').should('be.visible')

      cy.get('@Foo')
        .its('props')
        .then(props => {
          console.log('current props', props)
          expect(props).to.deep.equal({
            id: 'foo',
            foo: 'initial',
          })
          // you can get current props of the component
          // but not change them - they are read-only
          expect(() => {
            props.foo = 'change 1'
          }).to.throw()
        })
    })
  })

  context('setState', () => {
    it('sets component state', () => {
      // get the component reference using "ref" prop
      // and place it into the object for Cypress to "wait" for it
      let c = {}
      mount(<Foo id="foo" foo="initial" ref={i => (c.instance = i)} />)
      cy.contains('initial').should('be.visible')

      cy.log('**check state**')
      cy.wrap(c)
        .its('instance.state')
        .should('deep.equal', { count: 0 })

      cy.log('**setState**')
      cy.wrap(c)
        .its('instance')
        .invoke('setState', { count: 10 })
      cy.wrap(c)
        .its('instance.state')
        .should('deep.equal', { count: 10 })
      cy.contains('initial count 10')
    })
  })
})
