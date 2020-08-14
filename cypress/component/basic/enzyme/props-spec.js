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

    it('mounts component with new props', () => {
      mount(<Foo id="foo" foo="initial" />)
      cy.contains('initial').should('be.visible')

      mount(<Foo id="foo" foo="second" />)
      cy.contains('second').should('be.visible')
    })

    it('mounts cloned component', () => {
      const cmp = <Foo id="foo" foo="initial" />
      mount(cmp)
      cy.contains('initial').should('be.visible')

      const cloned = Cypress._.cloneDeep(cmp)
      // change a property, leaving the rest unchanged
      cloned.props.foo = 'second'
      mount(cloned)
      cy.contains('.foo', 'second').should('be.visible')
    })
  })
})
