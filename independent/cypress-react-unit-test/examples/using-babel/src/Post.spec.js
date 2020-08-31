/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'

import * as calc from './calc'
import SideBySide from './SideBySide'
import Post from './Post'
import { SkeletonTheme } from 'react-loading-skeleton'

describe('Post skeletons', () => {
  it('mocks the es6 import', () => {
    cy.stub(calc, 'getRandomNumber')
      .as('lucky')
      .returns(777)

    mount(<Post />)
    cy.contains('.random', '777')
  })

  it('default', () => {
    mount(
      <SideBySide>
        <Post />
        <Post title="A title">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum
          nec justo feugiat, auctor nunc ac, volutpat arcu. Suspendisse faucibus
          aliquam ante, sit amet iaculis dolor posuere et. In ut placerat leo.
        </Post>
      </SideBySide>,
    )
  })

  it('large size', () => {
    mount(
      <SideBySide>
        <Post size="large" />
        <Post size="large" title="A title">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum
          nec justo feugiat, auctor nunc ac, volutpat arcu. Suspendisse faucibus
          aliquam ante, sit amet iaculis dolor posuere et. In ut placerat leo.
        </Post>
      </SideBySide>,
    )
  })

  it('different colors', () => {
    const Test = () => (
      <div>
        <SkeletonTheme color="#1D5CA6" highlightColor="#164999">
          <Post />
        </SkeletonTheme>
        <SkeletonTheme color="#333" highlightColor="#4a4a4a">
          <Post />
        </SkeletonTheme>
      </div>
    )

    mount(<Test />)
  })

  // extra test - set Post title after a timeout
  it('loads title after timeout', () => {
    const Demo = () => {
      // at first there is not title, no children
      const [title, setTitle] = React.useState('')
      const [text, setText] = React.useState('')

      setTimeout(() => {
        setTitle('Post title 👍')
      }, 1000)

      setTimeout(() => {
        setText(`The text has arrived ...
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum nec
          justo feugiat, auctor nunc ac, volutpat arcu. Suspendisse faucibus
          aliquam ante, sit amet iaculis dolor posuere et. In ut placerat leo.
        `)
      }, 2000)

      return <Post title={title} children={text} />
    }
    mount(<Demo />)
    // at first, the title and the text are 💀
    cy.get('h1 .react-loading-skeleton').should('have.length', 1)
    cy.get('p .react-loading-skeleton').should('have.length', 5)

    // then the title arrives, but the text is still skeletons
    cy.contains('h1', 'Post title 👍').should('be.visible')
    cy.get('p .react-loading-skeleton').should('have.length', 5)

    // and then no skeletons remain
    cy.get('.react-loading-skeleton').should('not.exist')
  })
})
