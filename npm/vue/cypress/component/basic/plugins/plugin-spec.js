/// <reference types="cypress" />
import { MyPlugin } from './MyPlugin'
import { MyPluginWithOptions } from './MyPluginWithOptions'
import { mount } from '@cypress/vue'

describe('Single component mount', () => {
  const Component = {
    template: '<h1>{{ myPlugin }}</h1>',
    inject: ['myPlugin'],
  }

  it('has the plugin', () => {
    const plugin = MyPlugin

    // extend Vue with plugins
    const extensions = {
      plugins: [plugin],
    }

    mount(Component, { extensions })

    cy.get('h1').should('have.text', 'This is a plugin')
  })
})

describe('Plugins with options', () => {
  it('passes options', () => {
    const Component = {
      template: '<h1>{{ label() }}</h1>',
    }

    const plugins = [
      MyPlugin, // this plugin does not need options
      [MyPluginWithOptions, { label: 'testing' }], // this plugin needs options
    ]

    // extend Vue with plugins
    const extensions = {
      plugins,
    }

    mount(Component, { extensions })

    cy.get('h1').should('have.text', 'testing')
  })
})
