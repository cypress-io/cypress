/// <reference types="cypress" />
import { MyPlugin } from './MyPlugin'
import { MyPluginWithOptions } from './MyPluginWithOptions'
import { mount } from '@cypress/vue'

const EmptyComponent = { template: '<div></div>' }

describe('Single component mount', () => {
  it('has the plugin', () => {
    const use = [MyPlugin]

    // extend Vue with plugins
    const extensions = {
      use,
    }

    mount(EmptyComponent, { extensions })

    cy.wrap(Cypress).its('vue').invoke('aPluginMethod').should('equal', 'foo')
  })
})

describe('Custom plugin MyPlugin', () => {
  const use = [MyPlugin]

  // extend Vue with plugins
  const extensions = {
    use,
  }

  beforeEach(() => {
    mount(EmptyComponent, { extensions })
  })

  it('registers global method on Vue instance', () => {
    cy.wrap(Cypress).its('vue').its('aPluginMethod').should('be.a', 'function')
  })

  it('can call this global function', () => {
    cy.wrap(Cypress).its('vue').invoke('aPluginMethod').should('equal', 'foo')
  })
})

describe('Plugins with options', () => {
  it('passes options', () => {
    const use = [
      MyPlugin, // this plugin does not need options
      [MyPluginWithOptions, { label: 'testing' }], // this plugin needs options
    ]

    // extend Vue with plugins
    const extensions = {
      use,
    }

    mount(EmptyComponent, { extensions })

    // first plugin works
    cy.wrap(Cypress).its('vue').invoke('aPluginMethod').should('equal', 'foo')
    // second plugin works
    cy.wrap(Cypress).its('vue')
    .invoke('anotherPluginMethod')
    .should('equal', 'testing')
  })
})
