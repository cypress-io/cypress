import * as React from 'react'
import { mount } from '@cypress/react'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'

import { NavItem } from './types'
import { LeftNav } from './LeftNav'

library.add(fas)
library.add(fab)

const homeItem: NavItem = {
  id: 'foo',
  title: 'Foo button',
  icon: 'home',
  interaction: {
    type: 'anchor',
    href: 'https://cypress.io',
  },
}

const makeOnClickItem: (options?: Partial<NavItem>) => NavItem = (options?: Partial<NavItem>) => {
  return {
    id: 'bar',
    title: 'Bar button',
    icon: 'key',
    interaction: {
      type: 'js',
      onClick: () => {
      },
    },
    ...options,
  }
}

const items = [homeItem, makeOnClickItem()]

function addStyle () {
  const style = document.createElement('style')

  style.innerText = `
    .left-nav-classes {
      background: red;
    }
  
    .button-class {
      color: yellow;
    }
  
    .button-class:hover {
      color: orange;
    }
  
    .second-item-button {
      transform: scale(0.5);
      transition: transform 1s ease-in;
    }
  
    .second-item-button-active {
      transform: scale(1);
    }
    `

  document.head.appendChild(style)
}

it('renders', () => {
  mount(<LeftNav items={[]} />)
  cy.get('nav').should('exist')
})

it('renders a stack of items', () => {
  mount(<LeftNav items={items} />)

  cy.get('nav').should('exist')
})

it('properly follows anchor links', () => {
  mount(<LeftNav items={[
    {
      id: 'foo',
      title: 'Foo button',
      icon: 'home',
      interaction: {
        type: 'anchor',
        href: '#foo',
      },
    },
  ]} />)

  cy.get('a').first().eq(0).click().url().should('include', '#foo')
})

it('should properly display in page', () => {
  mount(<div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr' }}>
    <LeftNav items={items} />
    <div style={{ height: 1000, width: 1000 }}>
      This is the main page content
    </div>
  </div>)
})

it('properly follows JS onclicks', () => {
  // addStyle()
  const clickSpy = cy.spy()

  const Wrapper = () => {
    const [activeIndex, setActiveIndex] = React.useState<number>()

    const items = [
      homeItem,
      makeOnClickItem({
        itemClassesActive: 'second-item-button-active',
        itemClasses: 'second-item-button',
        interaction: {
          type: 'js',
          onClick (idx) {
            if (idx === activeIndex) {
              setActiveIndex(undefined)

              return
            }

            setActiveIndex(idx)
            clickSpy()
          },
        },
      }),
    ]

    return (<div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr' }}>
      <LeftNav activeIndex={activeIndex}
        items={items}/>
      <div style={{ height: 1000, width: 1000 }}>
        This is the main page content
      </div>
    </div>)
  }

  mount(<Wrapper />)

  cy.get('a').eq(1).click().should(() => {
    expect(clickSpy).to.be.called
  })
})
