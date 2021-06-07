/// <reference types="cypress" />
import { MyPlugin } from './MyPlugin'
import { MyPluginWithOptions } from './MyPluginWithOptions'
import { mount, mountCallback } from '@cypress/vue'

const EmptyComponent = { template: '<div></div>' }

describe('Single component mount', () => {
  it('has the plugin', () => {
    const use = [MyPlugin]

    // extend Vue with plugins
    const extensions = {
      use,
    }

    mount(EmptyComponent, { extensions })

    cy.window().its('Vue').invoke('aPluginMethod').should('equal', 'foo')
  })
})

describe('Custom plugin MyPlugin', () => {
  const use = [MyPlugin]

  // extend Vue with plugins
  const extensions = {
    use,
  }

  // use "mountCallback" to register the plugins
  beforeEach(mountCallback(EmptyComponent, { extensions }))

  it('registers global method on Vue instance', () => {
    cy.window().its('Vue').its('aPluginMethod').should('be.a', 'function')
  })

  it('can call this global function', () => {
    cy.window().its('Vue').invoke('aPluginMethod').should('equal', 'foo')
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
    cy.window().its('Vue').invoke('aPluginMethod').should('equal', 'foo')
    // second plugin works
    cy.window()
    .its('Vue')
    .invoke('anotherPluginMethod')
    .should('equal', 'testing')
  })
})
