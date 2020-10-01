/// <reference types="cypress" />
import { mount } from '@cypress/vue'

describe('Single render function component', () => {
  // the component definition
  const appComponent = {
    template: '<h1>hi! This is a Render Function Example</h1>',
    data () {
      return {}
    },
  }

  const mountOptions = {
    // we want to use custom app component above
    extensions: {
      components: {
        'app-component': appComponent,
      },
    },
  }

  it('loads', () => {
    mount(
      {
        template: `
          <div>
            <app-component></app-component>
          </div>
        `,
      },
      mountOptions,
    )

    cy.contains('h1', 'hi!')
  })

  it('loads 3 times', () => {
    // tip: always have top level single root element
    mount(
      {
        template: `
          <div>
            <app-component></app-component>
            <app-component></app-component>
            <app-component>foo</app-component>
          </div>
        `,
      },
      mountOptions,
    )

    cy.get('h1')
    .should('have.length', 3)
    .each(($el) => {
      expect($el).to.contain('hi!')
    })
  })
})

describe('Component with slot', () => {
  // the component definition
  const appComponent = {
    template: '<h1><slot></slot></h1>',
    data () {
      return {}
    },
  }

  const mountOptions = {
    // we want to use custom app component above
    extensions: {
      components: {
        'app-component': appComponent,
      },
    },
  }

  it('loads', () => {
    mount(
      {
        template: `
          <div>
            <app-component>Hello</app-component>
          </div>
        `,
      },
      mountOptions,
    )

    cy.contains('h1', 'Hello')
  })

  it('loads 3 different components', () => {
    // tip: always have top level single root element
    mount(
      {
        template: `
          <div>
            <app-component>Hello World</app-component>
            <app-component>Hello John</app-component>
            <app-component>Hello Peter</app-component>
          </div>
        `,
      },
      mountOptions,
    )

    cy.get('h1')
    .should('have.length', 3)
    .and(($el) => {
      expect($el[0]).to.have.text('Hello World')
      expect($el[1]).to.have.text('Hello John')
      expect($el[2]).to.have.text('Hello Peter')
    })
  })
})

describe('Component with arguments', () => {
  // the component definition
  const appComponent = {
    render (createElement) {
      let a = this.elementtype.split(',')

      return createElement(
        a[0],
        {
          attrs: {
            id: a[3],
            style: `color:${a[1]};font-size:${a[2]};`,
          },
        },
        this.$slots.default || '<EMPTY>',
      )
    },
    props: {
      elementtype: {
        attributes: String,
        required: true,
      },
    },
  }

  const mountOptions = {
    // we want to use custom app component above
    extensions: {
      components: {
        'app-component': appComponent,
      },
    },
  }

  it('renders different colors', () => {
    // tip: always have top level single root element
    mount(
      {
        template: `
          <div>
            <app-component :elementtype = "'div,blue,30,div1'">Hello World</app-component>
            <app-component :elementtype = "'h3,red,30,h3tag'">Hello Peter</app-component>
            <app-component :elementtype = "'p,green,30,ptag'">Hello John</app-component>
            <app-component :elementtype = "'div,violet,30,divtag'">Hello Herry</app-component>
          </div>
        `,
      },
      mountOptions,
    )

    cy.contains('h3', 'Hello Peter').should(
      'have.attr',
      'style',
      'color:red;font-size:30;',
    )

    cy.contains('p', 'Hello John').should(
      'have.attr',
      'style',
      'color:green;font-size:30;',
    )
  })

  it('mounts just the component and passes props', () => {
    mount(appComponent, {
      propsData: {
        elementtype: 'h3,red,30,h3tag',
      },
    })

    // the component appears and the styling is applied
    cy.contains('<EMPTY>').should(
      'have.attr',
      'style',
      'color:red;font-size:30;',
    )
  })
})
