import * as React from 'react'
import { mount } from '@cypress/react'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'

import { LeftNav } from './LeftNav'

library.add(fas)
library.add(fab)

it('renders', () => {
  mount(<LeftNav items={[]} />)
  cy.get('ul').should('exist')
})

it('renders a stack of items', () => {
  mount(<LeftNav items={[{
    id: 'foo',
    title: 'Foo button',
    icon: 'home',
    interaction: {
      type: 'anchor',
      href: '/cypress.io',
    },
  }, {
    id: 'bar',
    title: 'Bar button',
    icon: 'key',
    interaction: {
      type: 'js',
      onClick: () => {},
    },
  }]} />)

  cy.get('ul').should('exist')
})

it('properly follows anchor links', () => {
  mount(<LeftNav items={[{
    id: 'foo',
    title: 'Foo button',
    icon: 'home',
    interaction: {
      type: 'anchor',
      href: '#foo',
    },
  }, {
    id: 'bar',
    title: 'Bar button',
    icon: 'key',
    interaction: {
      type: 'js',
      onClick: () => {},
    },
  }]} />)

  cy.get('li').eq(0).click().url().should('include', '#foo')
})

it('properly follows JS onclicks', () => {
  const clickSpy = cy.spy()

  mount(<LeftNav items={[{
    id: 'foo',
    title: 'Foo button',
    icon: 'home',
    interaction: {
      type: 'anchor',
      href: '/cypress.io',
    },
  }, {
    id: 'bar',
    title: 'Bar button',
    icon: 'key',
    interaction: {
      type: 'js',
      onClick: () => clickSpy(),
    },
  }]} />)

  cy.get('li').eq(1).click().should(() => {
    expect(clickSpy).to.be.called
  })
})

it('should properly display in page', () => {
  mount(<div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr' }}>
    <LeftNav items={[{
      id: 'foo',
      title: 'Foo button',
      icon: 'home',
      interaction: {
        type: 'anchor',
        href: '/cypress.io',
      },
    }, {
      id: 'bar',
      title: 'Bar button',
      icon: 'key',
      interaction: {
        type: 'js',
        onClick: () => {},
      },
    }]} />
    <div style={{ height: 1000, width: 1000 }}>
      This is the main page content
    </div>
  </div>)
})
